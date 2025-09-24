<?php
/**
 * API Endpoints Autenticazione Admin - FederComTur
 * ================================================
 * Gestione login, logout e verifica autenticazione
 */

// Avvia output buffering per catturare eventuali output indesiderati
ob_start();

// Enable error display per debug (temporaneo)
ini_set('display_errors', 1);
ini_set('log_errors', 1);
error_reporting(E_ALL);

require_once __DIR__ . '/config/database.php';
require_once __DIR__ . '/config/auth.php';

// Pulisci qualsiasi output indesiderato
ob_clean();

// Headers per API
header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Credentials: true');

// Gestione CORS per admin
$allowedOrigins = [
    'http://localhost:8080',
    'http://localhost:3000', 
    'https://federcomtur.it',
    'https://www.federcomtur.it'
];

$origin = $_SERVER['HTTP_ORIGIN'] ?? '';
if (in_array($origin, $allowedOrigins)) {
    header("Access-Control-Allow-Origin: $origin");
}

header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With');

// Gestione preflight
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

try {
    $auth = new AdminAuth();
    $method = $_SERVER['REQUEST_METHOD'];
    $action = $_GET['action'] ?? '';
    
    // Debug temporaneo
    error_log("Admin API Debug - Method: $method, Action: '$action'");
    error_log("Admin API Debug - GET: " . print_r($_GET, true));
    error_log("Admin API Debug - POST: " . print_r($_POST, true));
    
    switch ($method) {
        case 'POST':
            handlePost($auth, $action);
            break;
            
        case 'GET':
            handleGet($auth, $action);
            break;
            
        case 'DELETE':
            handleDelete($auth, $action);
            break;
            
        default:
            sendErrorResponse('Metodo HTTP non supportato', 405);
    }
    
} catch (Exception $e) {
    error_log("Admin Auth API Error: " . $e->getMessage());
    sendErrorResponse('Errore interno del server', 500);
}

// =============================================
// HANDLERS
// =============================================

function handlePost($auth, $action) {
    // Leggi input JSON con fallback
    $rawInput = file_get_contents('php://input');
    
    // Debug: log raw input
    if (empty($rawInput)) {
        error_log("Admin API: php://input è vuoto");
    } else {
        error_log("Admin API: raw input = " . substr($rawInput, 0, 100));
    }
    
    $input = json_decode($rawInput, true);
    
    // Se JSON parsing fallisce, prova con $_POST
    if ($input === null && !empty($_POST)) {
        $input = $_POST;
        error_log("Admin API: usando $_POST come fallback");
    }
    
    // Se ancora null, errore
    if ($input === null) {
        sendErrorResponse('Dati input non validi', 400);
        return;
    }
    
    // Debug action
    error_log("Admin API handlePost - Action received: '$action'");
    
    switch ($action) {
        case 'login':
            error_log("Admin API - Handling login action");
            handleLogin($auth, $input);
            break;
            
        case 'change-password':
            error_log("Admin API - Handling change-password action");
            handleChangePassword($auth, $input);
            break;
            
        default:
            error_log("Admin API - Unknown action: '$action'");
            sendErrorResponse('Azione non riconosciuta', 400);
    }
}

function handleGet($auth, $action) {
    switch ($action) {
        case 'check':
            handleAuthCheck($auth);
            break;
            
        case 'user':
            handleGetCurrentUser($auth);
            break;
            
        case 'logout':
            // Permetti il logout anche via GET per compatibilità
            handleLogout($auth);
            break;

        case 'sessions':
            handleGetSessions($auth);
            break;
            
        case 'stats':
            handleGetStats($auth);
            break;
            
        default:
            sendErrorResponse('Azione non riconosciuta', 400);
    }
}

function handleDelete($auth, $action) {
    switch ($action) {
        case 'logout':
            handleLogout($auth);
            break;
            
        default:
            sendErrorResponse('Azione non riconosciuta', 400);
    }
}

// =============================================
// LOGIN/LOGOUT
// =============================================

function handleLogin($auth, $input) {
    // Validazione input
    if (empty($input['username']) || empty($input['password'])) {
        sendErrorResponse('Username e password sono obbligatori', 400);
        return;
    }
    
    $username = sanitizeInput($input['username']);
    $password = $input['password'];
    $rememberMe = $input['remember_me'] ?? false;
    
    // Tentativo di login
    $result = $auth->login($username, $password, $rememberMe);
    
    if ($result['success']) {
        sendSuccessResponse([
            'message' => 'Login effettuato con successo',
            'user' => $result['user']
        ]);
    } else {
        sendErrorResponse($result['error'], 401);
    }
}

function handleLogout($auth) {
    $result = $auth->logout();
    
    if ($result['success']) {
        sendSuccessResponse(['message' => 'Logout effettuato con successo']);
    } else {
        sendErrorResponse($result['error'], 500);
    }
}

// =============================================
// VERIFICA AUTENTICAZIONE
// =============================================

function handleAuthCheck($auth) {
    if ($auth->isAuthenticated()) {
        $user = $auth->getCurrentUser();
        sendSuccessResponse([
            'authenticated' => true,
            'user' => $user
        ]);
    } else {
        sendSuccessResponse(['authenticated' => false]);
    }
}

function handleGetCurrentUser($auth) {
    if (!$auth->isAuthenticated()) {
        sendErrorResponse('Autenticazione richiesta', 401);
        return;
    }
    
    $user = $auth->getCurrentUser();
    sendSuccessResponse(['user' => $user]);
}

// =============================================
// GESTIONE PASSWORD
// =============================================

function handleChangePassword($auth, $input) {
    if (!$auth->isAuthenticated()) {
        sendErrorResponse('Autenticazione richiesta', 401);
        return;
    }
    
    if (empty($input['current_password']) || empty($input['new_password'])) {
        sendErrorResponse('Password corrente e nuova password sono obbligatorie', 400);
        return;
    }
    
    $user = $auth->getCurrentUser();
    $result = $auth->changePassword(
        $user['id'],
        $input['current_password'],
        $input['new_password']
    );
    
    if ($result['success']) {
        sendSuccessResponse(['message' => $result['message']]);
    } else {
        sendErrorResponse($result['error'], 400);
    }
}

// =============================================
// STATISTICHE E MONITORING
// =============================================

function handleGetSessions($auth) {
    // Solo super admin può vedere sessioni
    if (!$auth->hasRole('super_admin')) {
        sendErrorResponse('Autorizzazione insufficiente', 403);
        return;
    }
    
    try {
        $db = Database::getInstance();
        $conn = $db->getConnection();
        
        $stmt = $conn->prepare("
            SELECT 
                s.id,
                u.username,
                u.full_name,
                s.ip_address,
                s.last_activity,
                s.expires_at,
                TIMESTAMPDIFF(MINUTE, s.last_activity, NOW()) as idle_minutes
            FROM admin_sessions s
            JOIN admin_users u ON s.admin_user_id = u.id
            WHERE s.expires_at > NOW()
            ORDER BY s.last_activity DESC
        ");
        $stmt->execute();
        $sessions = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        sendSuccessResponse(['sessions' => $sessions]);
        
    } catch (Exception $e) {
        sendErrorResponse('Errore nel recupero sessioni', 500);
    }
}

function handleGetStats($auth) {
    if (!$auth->hasRole('admin')) {
        sendErrorResponse('Autorizzazione insufficiente', 403);
        return;
    }
    
    try {
        $db = Database::getInstance();
        $conn = $db->getConnection();
        
        // Statistiche login ultimi 30 giorni
        $stmt = $conn->prepare("
            SELECT 
                DATE(attempted_at) as date,
                COUNT(*) as total_attempts,
                SUM(CASE WHEN success = 1 THEN 1 ELSE 0 END) as successful,
                SUM(CASE WHEN success = 0 THEN 1 ELSE 0 END) as failed
            FROM admin_login_attempts 
            WHERE attempted_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
            GROUP BY DATE(attempted_at)
            ORDER BY date DESC
            LIMIT 30
        ");
        $stmt->execute();
        $loginStats = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        // Sessioni attive
        $sessionStats = $auth->getActiveSessionsStats();
        
        // IP più attivi
        $stmt = $conn->prepare("
            SELECT 
                ip_address,
                COUNT(*) as attempts,
                SUM(CASE WHEN success = 1 THEN 1 ELSE 0 END) as successful
            FROM admin_login_attempts
            WHERE attempted_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)
            GROUP BY ip_address
            ORDER BY attempts DESC
            LIMIT 10
        ");
        $stmt->execute();
        $topIPs = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        sendSuccessResponse([
            'login_stats' => $loginStats,
            'session_stats' => $sessionStats,
            'top_ips' => $topIPs
        ]);
        
    } catch (Exception $e) {
        sendErrorResponse('Errore nel recupero statistiche', 500);
    }
}

// =============================================
// HELPER FUNCTIONS
// =============================================
// Nota: sendErrorResponse e sendJsonResponse sono definite in database.php

function sendSuccessResponse($data, $code = 200) {
    $response = [
        'success' => true,
        'data' => $data,
        'timestamp' => date('c')
    ];
    sendJsonResponse($response, $code);
}

?>
