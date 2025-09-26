<?php
/**
 * Middleware Protezione Admin - FederComTur
 * ========================================
 * Middleware per proteggere pagine e API admin
 */

require_once 'config/auth.php';

/**
 * Middleware per protezione pagine admin HTML
 */
function protectAdminPage($requiredRole = 'admin') {
    $auth = new AdminAuth();
    
    if (!$auth->isAuthenticated()) {
        // Reindirizza al login se non autenticato
        header('Location: admin-login.html');
        exit();
    }
    
    if (!$auth->hasRole($requiredRole)) {
        // Errore 403 se non ha il ruolo richiesto
        http_response_code(403);
        echo '<!DOCTYPE html>
        <html lang="it">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Accesso Negato - FederComTur Admin</title>
            <style>
                body { font-family: Arial, sans-serif; text-align: center; padding: 50px; }
                .error-container { max-width: 500px; margin: 0 auto; }
                .error-code { font-size: 4rem; color: #dc2626; font-weight: bold; }
                .error-message { font-size: 1.2rem; color: #374151; margin: 20px 0; }
                .back-link { color: #059669; text-decoration: none; }
            </style>
        </head>
        <body>
            <div class="error-container">
                <div class="error-code">403</div>
                <div class="error-message">Accesso Negato</div>
                <p>Non hai i permessi necessari per accedere a questa risorsa.</p>
                <a href="admin-dashboard.html" class="back-link">← Torna alla Dashboard</a>
            </div>
        </body>
        </html>';
        exit();
    }
    
    return $auth->getCurrentUser();
}

/**
 * Middleware per protezione API admin
 */
function protectAdminAPI($requiredRole = 'admin') {
    $auth = new AdminAuth();
    
    // Headers per JSON response
    header('Content-Type: application/json; charset=utf-8');
    
    if (!$auth->isAuthenticated()) {
        http_response_code(401);
        echo json_encode([
            'success' => false,
            'error' => 'Autenticazione richiesta',
            'code' => 'AUTH_REQUIRED'
        ]);
        exit();
    }
    
    if (!$auth->hasRole($requiredRole)) {
        http_response_code(403);
        echo json_encode([
            'success' => false,
            'error' => 'Autorizzazione insufficiente',
            'code' => 'INSUFFICIENT_ROLE',
            'required_role' => $requiredRole
        ]);
        exit();
    }
    
    return $auth->getCurrentUser();
}

/**
 * Middleware per CSRF protection
 */
function protectCSRF() {
    if ($_SERVER['REQUEST_METHOD'] === 'POST' || 
        $_SERVER['REQUEST_METHOD'] === 'PUT' || 
        $_SERVER['REQUEST_METHOD'] === 'DELETE') {
        
        $token = $_POST['csrf_token'] ?? $_SERVER['HTTP_X_CSRF_TOKEN'] ?? '';
        
        if (!hash_equals($_SESSION['csrf_token'] ?? '', $token)) {
            http_response_code(403);
            echo json_encode([
                'success' => false,
                'error' => 'Token CSRF non valido',
                'code' => 'CSRF_TOKEN_INVALID'
            ]);
            exit();
        }
    }
}

/**
 * Genera token CSRF
 */
function generateCSRFToken() {
    if (session_status() !== PHP_SESSION_ACTIVE) {
        session_start();
    }
    
    if (!isset($_SESSION['csrf_token'])) {
        $_SESSION['csrf_token'] = bin2hex(random_bytes(32));
    }
    
    return $_SESSION['csrf_token'];
}

/**
 * Rate limiting per API admin
 */
function adminRateLimit($maxRequests = 60, $windowMinutes = 1) {
    $cacheFile = sys_get_temp_dir() . '/admin_rate_limit_' . md5($_SERVER['REMOTE_ADDR']);
    
    $now = time();
    $windowStart = $now - ($windowMinutes * 60);
    
    // Leggi requests esistenti
    $requests = [];
    if (file_exists($cacheFile)) {
        $data = file_get_contents($cacheFile);
        $requests = json_decode($data, true) ?: [];
    }
    
    // Filtra requests nella finestra temporale
    $requests = array_filter($requests, function($timestamp) use ($windowStart) {
        return $timestamp > $windowStart;
    });
    
    // Controlla limite
    if (count($requests) >= $maxRequests) {
        http_response_code(429);
        echo json_encode([
            'success' => false,
            'error' => 'Troppi richieste. Riprova più tardi.',
            'code' => 'RATE_LIMIT_EXCEEDED',
            'retry_after' => 60
        ]);
        exit();
    }
    
    // Aggiungi richiesta corrente
    $requests[] = $now;
    file_put_contents($cacheFile, json_encode($requests));
}

/**
 * Log attività admin
 */
function logAdminActivity($action, $details = []) {
    $auth = new AdminAuth();
    $user = $auth->getCurrentUser();
    
    if (!$user) return;
    
    try {
        $db = Database::getInstance();
        $conn = $db->getConnection();
        
        // Crea tabella se non esiste
        $conn->exec("
            CREATE TABLE IF NOT EXISTS admin_activity_log (
                id INT AUTO_INCREMENT PRIMARY KEY,
                admin_user_id INT NOT NULL,
                action VARCHAR(100) NOT NULL,
                details JSON,
                ip_address VARCHAR(45) NOT NULL,
                user_agent TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                INDEX idx_admin_user (admin_user_id),
                INDEX idx_action (action),
                INDEX idx_created_at (created_at)
            )
        ");
        
        $stmt = $conn->prepare("
            INSERT INTO admin_activity_log 
            (admin_user_id, action, details, ip_address, user_agent)
            VALUES (?, ?, ?, ?, ?)
        ");
        
        $stmt->execute([
            $user['id'],
            $action,
            json_encode($details),
            $_SERVER['REMOTE_ADDR'] ?? 'unknown',
            $_SERVER['HTTP_USER_AGENT'] ?? 'unknown'
        ]);
        
    } catch (Exception $e) {
        error_log("Admin activity log error: " . $e->getMessage());
    }
}

/**
 * Controllo IP whitelist per super admin
 */
function checkIPWhitelist($role = 'super_admin') {
    if ($role !== 'super_admin') return true;
    
    $allowedIPs = [
        '127.0.0.1',
        '::1',
        // Aggiungi IP ufficio qui
        // '192.168.1.100',
    ];
    
    $clientIP = $_SERVER['REMOTE_ADDR'] ?? '';
    
    if (!in_array($clientIP, $allowedIPs)) {
        http_response_code(403);
        echo json_encode([
            'success' => false,
            'error' => 'Accesso da IP non autorizzato',
            'code' => 'IP_NOT_WHITELISTED'
        ]);
        exit();
    }
    
    return true;
}

/**
 * Wrapper completo per protezione admin
 */
function fullAdminProtection($requiredRole = 'admin', $enableCSRF = true, $enableRateLimit = true) {
    // Rate limiting
    if ($enableRateLimit) {
        adminRateLimit();
    }
    
    // Autenticazione e autorizzazione
    $user = protectAdminAPI($requiredRole);
    
    // IP whitelist per super admin
    checkIPWhitelist($requiredRole);
    
    // CSRF protection
    if ($enableCSRF) {
        protectCSRF();
    }
    
    return $user;
}

/**
 * Helper per includere in pagine admin HTML
 */
function includeAdminHead() {
    echo '
    <meta name="robots" content="noindex, nofollow">
    <meta name="csrf-token" content="' . generateCSRFToken() . '">
    <script>
        // Configurazione globale admin
        window.ADMIN_CONFIG = {
            csrfToken: "' . generateCSRFToken() . '",
            apiBase: "api/",
            sessionTimeout: 3600000 // 1 ora in ms
        };
        
        // Controllo sessione automatico
        setInterval(() => {
            fetch("api/admin-auth.php?action=check", { credentials: "include" })
                .then(response => response.json())
                .then(data => {
                    if (!data.success || !data.data.authenticated) {
                        alert("Sessione scaduta. Verrai reindirizzato al login.");
                        window.location.href = "admin-login.html";
                    }
                })
                .catch(() => {
                    console.warn("Controllo sessione fallito");
                });
        }, 300000); // Ogni 5 minuti
    </script>
    ';
}

?>
