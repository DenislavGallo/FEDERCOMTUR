<?php
/**
 * Sistema Autenticazione Admin - FederComTur
 * ==========================================
 * Gestione sicura login, sessioni e autorizzazioni admin
 */

require_once __DIR__ . '/database.php';

/**
 * Classe per gestire autenticazione admin
 */
class AdminAuth {
    private $db;
    private $conn;
    private $sessionLifetime = 3600; // 1 ora
    private $maxLoginAttempts = 5;
    private $lockoutDuration = 1800; // 30 minuti
    
    public function __construct() {
        $this->db = Database::getInstance();
        $this->conn = $this->db->getConnection();
        
        // Configurazione sessione sicura
        $this->configureSession();
    }
    
    /**
     * Configurazione sessione sicura
     */
    private function configureSession() {
        // Configurazione sicurezza sessione
        ini_set('session.cookie_httponly', 1);
        ini_set('session.use_only_cookies', 1);
        ini_set('session.cookie_secure', isset($_SERVER['HTTPS']));
        ini_set('session.cookie_samesite', 'Strict');
        
        // Nome sessione personalizzato
        session_name('FEDERCOMTUR_ADMIN_SESSION');
        
        // Lifetime sessione
        ini_set('session.gc_maxlifetime', $this->sessionLifetime);
        session_set_cookie_params($this->sessionLifetime);
    }
    
    /**
     * Login admin con sicurezza avanzata
     */
    public function login($username, $password, $rememberMe = false) {
        try {
            // Validazione input
            if (empty($username) || empty($password)) {
                $this->logLoginAttempt($username, false);
                return [
                    'success' => false,
                    'error' => 'Username e password sono obbligatori'
                ];
            }
            
            // Controllo rate limiting
            if ($this->isRateLimited()) {
                return [
                    'success' => false,
                    'error' => 'Troppi tentativi di login. Riprova tra 15 minuti.'
                ];
            }
            
            // Recupero utente
            $user = $this->getUserByUsername($username);
            if (!$user) {
                $this->logLoginAttempt($username, false);
                return [
                    'success' => false,
                    'error' => 'Credenziali non valide'
                ];
            }
            
            // Controllo account bloccato
            if ($this->isAccountLocked($user)) {
                return [
                    'success' => false,
                    'error' => 'Account temporaneamente bloccato per sicurezza'
                ];
            }
            
            // Verifica password
            if (!password_verify($password, $user['password_hash'])) {
                $this->incrementFailedAttempts($username);
                $this->logLoginAttempt($username, false);
                return [
                    'success' => false,
                    'error' => 'Credenziali non valide'
                ];
            }
            
            // Controllo stato account
            if ($user['status'] !== 'active') {
                $this->logLoginAttempt($username, false);
                return [
                    'success' => false,
                    'error' => 'Account non attivo'
                ];
            }
            
            // Login successful
            $this->resetFailedAttempts($username);
            $this->createSession($user, $rememberMe);
            $this->updateLastLogin($user['id']);
            $this->logLoginAttempt($username, true);
            
            return [
                'success' => true,
                'user' => [
                    'id' => $user['id'],
                    'username' => $user['username'],
                    'full_name' => $user['full_name'],
                    'role' => $user['role'],
                    'email' => $user['email']
                ]
            ];
            
        } catch (Exception $e) {
            error_log("Admin login error: " . $e->getMessage());
            return [
                'success' => false,
                'error' => 'Errore interno del server'
            ];
        }
    }
    
    /**
     * Logout admin con cleanup sessione
     */
    public function logout() {
        try {
            if (session_status() === PHP_SESSION_ACTIVE) {
                $sessionId = session_id();
                
                // Rimuovi sessione dal database
                if ($sessionId) {
                    $stmt = $this->conn->prepare("DELETE FROM admin_sessions WHERE id = ?");
                    $stmt->execute([$sessionId]);
                }
                
                // Distruggi sessione PHP
                session_unset();
                session_destroy();

                if (ini_get('session.use_cookies')) {
                    $params = session_get_cookie_params();
                    setcookie(session_name(), '', time() - 42000, $params['path'], $params['domain'] ?? '', $params['secure'], $params['httponly']);
                }
                
                // Rigenera ID sessione
                session_regenerate_id(true);
            }
            
            return ['success' => true];
            
        } catch (Exception $e) {
            error_log("Admin logout error: " . $e->getMessage());
            return ['success' => false, 'error' => 'Errore durante logout'];
        }
    }
    
    /**
     * Controlla se utente è autenticato
     */
    public function isAuthenticated() {
        if (session_status() !== PHP_SESSION_ACTIVE) {
            session_start();
        }
        
        if (!isset($_SESSION['admin_authenticated']) || !isset($_SESSION['admin_user_id'])) {
            return false;
        }
        
        // Verifica sessione nel database
        $sessionId = session_id();
        $stmt = $this->conn->prepare("
            SELECT s.*, u.status, u.role
            FROM admin_sessions s
            JOIN admin_users u ON s.admin_user_id = u.id
            WHERE s.id = ? AND s.expires_at > NOW() AND u.status = 'active'
        ");
        $stmt->execute([$sessionId]);
        $session = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if (!$session) {
            $this->logout();
            return false;
        }
        
        // Aggiorna last activity
        $this->updateSessionActivity($sessionId);
        
        return true;
    }
    
    /**
     * Ottiene dati utente corrente
     */
    public function getCurrentUser() {
        if (!$this->isAuthenticated()) {
            return null;
        }
        
        $userId = $_SESSION['admin_user_id'];
        return $this->getUserById($userId);
    }
    
    /**
     * Controlla autorizzazione per ruolo
     */
    public function hasRole($requiredRole) {
        $user = $this->getCurrentUser();
        if (!$user) return false;
        
        $roleHierarchy = [
            'editor' => 1,
            'admin' => 2,
            'super_admin' => 3
        ];
        
        $userLevel = $roleHierarchy[$user['role']] ?? 0;
        $requiredLevel = $roleHierarchy[$requiredRole] ?? 0;
        
        return $userLevel >= $requiredLevel;
    }
    
    /**
     * Middleware per proteggere route admin
     */
    public function requireAuth($requiredRole = 'admin') {
        if (!$this->isAuthenticated()) {
            http_response_code(401);
            echo json_encode(['error' => 'Autenticazione richiesta']);
            exit();
        }
        
        if (!$this->hasRole($requiredRole)) {
            http_response_code(403);
            echo json_encode(['error' => 'Autorizzazione insufficiente']);
            exit();
        }
        
        return true;
    }
    
    // =============================================
    // METODI PRIVATI
    // =============================================
    
    private function getUserByUsername($username) {
        $stmt = $this->conn->prepare("
            SELECT * FROM admin_users 
            WHERE username = ? OR email = ?
        ");
        $stmt->execute([$username, $username]);
        return $stmt->fetch(PDO::FETCH_ASSOC);
    }
    
    private function getUserById($id) {
        $stmt = $this->conn->prepare("
            SELECT id, username, email, full_name, role, status, last_login
            FROM admin_users 
            WHERE id = ?
        ");
        $stmt->execute([$id]);
        return $stmt->fetch(PDO::FETCH_ASSOC);
    }
    
    private function isAccountLocked($user) {
        if (!$user['locked_until']) return false;
        
        $lockedUntil = new DateTime($user['locked_until']);
        $now = new DateTime();
        
        if ($now < $lockedUntil) {
            return true;
        }
        
        // Reset lock se scaduto
        $this->resetFailedAttempts($user['username']);
        return false;
    }
    
    private function isRateLimited() {
        $ip = $this->getClientIp();
        $stmt = $this->conn->prepare("
            SELECT COUNT(*) as attempts
            FROM admin_login_attempts 
            WHERE ip_address = ? 
            AND attempted_at > DATE_SUB(NOW(), INTERVAL 15 MINUTE)
            AND success = 0
        ");
        $stmt->execute([$ip]);
        $result = $stmt->fetch(PDO::FETCH_ASSOC);
        
        return false; // RATE LIMITING TEMPORANEAMENTE DISABILITATO
    }
    
    private function incrementFailedAttempts($username) {
        $stmt = $this->conn->prepare("
            UPDATE admin_users 
            SET failed_login_attempts = failed_login_attempts + 1
            WHERE username = ?
        ");
        $stmt->execute([$username]);
        
        // Blocca account se troppi tentativi
        $user = $this->getUserByUsername($username);
        if ($user && $user['failed_login_attempts'] >= $this->maxLoginAttempts) {
            $stmt = $this->conn->prepare("
                UPDATE admin_users 
                SET locked_until = DATE_ADD(NOW(), INTERVAL ? SECOND)
                WHERE username = ?
            ");
            $stmt->execute([$this->lockoutDuration, $username]);
        }
    }
    
    private function resetFailedAttempts($username) {
        $stmt = $this->conn->prepare("
            UPDATE admin_users 
            SET failed_login_attempts = 0, locked_until = NULL
            WHERE username = ?
        ");
        $stmt->execute([$username]);
    }
    
    private function createSession($user, $rememberMe = false) {
        if (session_status() !== PHP_SESSION_ACTIVE) {
            session_start();
        }
        
        // Rigenera ID sessione per sicurezza
        session_regenerate_id(true);
        
        $sessionId = session_id();
        $lifetime = $rememberMe ? (30 * 24 * 3600) : $this->sessionLifetime; // 30 giorni o 1 ora
        
        $_SESSION['admin_authenticated'] = true;
        $_SESSION['admin_user_id'] = $user['id'];
        $_SESSION['admin_username'] = $user['username'];
        $_SESSION['admin_role'] = $user['role'];
        $_SESSION['admin_login_time'] = time();
        
        // Salva sessione nel database
        $stmt = $this->conn->prepare("
            INSERT INTO admin_sessions (id, admin_user_id, ip_address, user_agent, payload, expires_at)
            VALUES (?, ?, ?, ?, ?, DATE_ADD(NOW(), INTERVAL ? SECOND))
        ");
        
        $payload = json_encode($_SESSION);
        $stmt->execute([
            $sessionId,
            $user['id'],
            $this->getClientIp(),
            $_SERVER['HTTP_USER_AGENT'] ?? 'Unknown',
            $payload,
            $lifetime
        ]);
    }
    
    private function updateSessionActivity($sessionId) {
        $stmt = $this->conn->prepare("
            UPDATE admin_sessions 
            SET last_activity = NOW() 
            WHERE id = ?
        ");
        $stmt->execute([$sessionId]);
    }
    
    private function updateLastLogin($userId) {
        $stmt = $this->conn->prepare("
            UPDATE admin_users 
            SET last_login = NOW(), last_login_ip = ?
            WHERE id = ?
        ");
        $stmt->execute([$this->getClientIp(), $userId]);
    }
    
    private function logLoginAttempt($username, $success) {
        $stmt = $this->conn->prepare("
            INSERT INTO admin_login_attempts (ip_address, username, success, user_agent)
            VALUES (?, ?, ?, ?)
        ");
        $stmt->execute([
            $this->getClientIp(),
            $username,
            $success ? 1 : 0,
            $_SERVER['HTTP_USER_AGENT'] ?? 'Unknown'
        ]);
    }
    
    private function getClientIp() {
        $ipKeys = ['HTTP_X_FORWARDED_FOR', 'HTTP_X_REAL_IP', 'HTTP_CLIENT_IP', 'REMOTE_ADDR'];
        
        foreach ($ipKeys as $key) {
            if (!empty($_SERVER[$key])) {
                $ip = $_SERVER[$key];
                if (strpos($ip, ',') !== false) {
                    $ip = trim(explode(',', $ip)[0]);
                }
                if (filter_var($ip, FILTER_VALIDATE_IP, FILTER_FLAG_NO_PRIV_RANGE | FILTER_FLAG_NO_RES_RANGE)) {
                    return $ip;
                }
            }
        }
        
        return $_SERVER['REMOTE_ADDR'] ?? 'unknown';
    }
    
    /**
     * Cambia password utente
     */
    public function changePassword($userId, $currentPassword, $newPassword) {
        try {
            $user = $this->getUserById($userId);
            if (!$user) {
                return ['success' => false, 'error' => 'Utente non trovato'];
            }
            
            // Verifica password corrente
            if (!password_verify($currentPassword, $user['password_hash'])) {
                return ['success' => false, 'error' => 'Password corrente non corretta'];
            }
            
            // Validazione nuova password
            if (strlen($newPassword) < 8) {
                return ['success' => false, 'error' => 'La password deve essere di almeno 8 caratteri'];
            }
            
            // Hash nuova password
            $newHash = password_hash($newPassword, PASSWORD_DEFAULT);
            
            $stmt = $this->conn->prepare("
                UPDATE admin_users 
                SET password_hash = ?, updated_at = NOW()
                WHERE id = ?
            ");
            $stmt->execute([$newHash, $userId]);
            
            return ['success' => true, 'message' => 'Password aggiornata con successo'];
            
        } catch (Exception $e) {
            error_log("Change password error: " . $e->getMessage());
            return ['success' => false, 'error' => 'Errore interno del server'];
        }
    }
    
    /**
     * Ottiene statistiche sessioni attive
     */
    public function getActiveSessionsStats() {
        $stmt = $this->conn->prepare("
            SELECT 
                COUNT(*) as active_sessions,
                COUNT(DISTINCT admin_user_id) as active_users,
                MAX(last_activity) as last_activity
            FROM admin_sessions
            WHERE expires_at > NOW()
        ");
        $stmt->execute();
        return $stmt->fetch(PDO::FETCH_ASSOC);
    }
}

// =============================================
// FUNZIONI HELPER
// =============================================

/**
 * Middleware semplice per proteggere route
 */
function requireAdminAuth($role = 'admin') {
    $auth = new AdminAuth();
    return $auth->requireAuth($role);
}

/**
 * Ottiene utente admin corrente
 */
function getCurrentAdmin() {
    $auth = new AdminAuth();
    return $auth->getCurrentUser();
}

/**
 * Controlla se utente ha ruolo specifico
 */
function hasAdminRole($role) {
    $auth = new AdminAuth();
    return $auth->hasRole($role);
}

?>
