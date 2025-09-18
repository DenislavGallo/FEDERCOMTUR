<?php
/**
 * Configurazione Database FederComTur
 * ===================================
 */

// Configurazione database
define('DB_HOST', 'localhost');
define('DB_PORT', '3306'); // Porta MySQL standard
define('DB_NAME', 'federcomtur_news');
define('DB_USER', 'root'); // Modifica se necessario  
define('DB_PASS', ''); // Inserisci la password se necessaria

// Configurazione generale
define('API_VERSION', '1.0');
define('CHARSET', 'utf8mb4');

// Gestione Ambiente di Sviluppo
define('ENVIRONMENT', 'development'); // development|production
define('DEBUG_MODE', ENVIRONMENT === 'development');

// Headers CORS per permettere richieste dal frontend
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');
header('Content-Type: application/json; charset=utf-8');

// Gestione preflight requests (solo per richieste HTTP)
if (isset($_SERVER['REQUEST_METHOD']) && $_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

/**
 * Classe per gestire la connessione al database con Connection Pooling
 */
class Database {
    private $host;
    private $db_name;
    private $username;
    private $password;
    private $conn;
    private static $instance = null;
    
    private function __construct() {
        $this->host = DB_HOST . ':' . DB_PORT;
        $this->db_name = DB_NAME;
        $this->username = DB_USER;
        $this->password = DB_PASS;
    }
    
    /**
     * Implementa il pattern Singleton per Connection Pooling
     */
    public static function getInstance() {
        if (self::$instance === null) {
            self::$instance = new self();
        }
        return self::$instance;
    }
    
    /**
     * Previene la clonazione dell'istanza
     */
    private function __clone() {}
    
    /**
     * Previene la deserializzazione dell'istanza
     */
    public function __wakeup() {
        throw new Exception("Cannot unserialize singleton");
    }
    
    /**
     * Ottiene la connessione al database
     */
    public function getConnection() {
        // Validazione Database Name
        if (empty($this->db_name)) {
            sendErrorResponse('Database non configurato', 500);
        }
        
        // Se la connessione esiste già, riutilizzala (connection pooling)
        if ($this->conn !== null) {
            return $this->conn;
        }
        
        try {
            $dsn = "mysql:host=" . $this->host . ";dbname=" . $this->db_name . ";charset=" . CHARSET;
            $this->conn = new PDO($dsn, $this->username, $this->password);
            $this->conn->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
            $this->conn->setAttribute(PDO::ATTR_DEFAULT_FETCH_MODE, PDO::FETCH_ASSOC);
            
            // Ottimizzazioni per performance
            $this->conn->setAttribute(PDO::ATTR_PERSISTENT, true);
            $this->conn->setAttribute(PDO::ATTR_EMULATE_PREPARES, false);
            
        } catch(PDOException $exception) {
            error_log("Errore connessione database: " . $exception->getMessage());
            http_response_code(500);
            
            // Gestione errori basata sull'ambiente
            if (DEBUG_MODE) {
                echo json_encode([
                    'error' => true,
                    'message' => 'Errore di connessione al database',
                    'details' => $exception->getMessage(),
                    'dsn' => "mysql:host=" . $this->host . ";dbname=" . $this->db_name,
                    'environment' => ENVIRONMENT
                ], JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);
            } else {
                echo json_encode([
                    'error' => true,
                    'message' => 'Errore interno del server'
                ], JSON_UNESCAPED_UNICODE);
            }
            exit();
        }
        
        return $this->conn;
    }
    
    /**
     * Chiude la connessione
     */
    public function closeConnection() {
        $this->conn = null;
    }
}

/**
 * Funzioni di utilità
 */

/**
 * Invia risposta JSON formattata
 */
function sendJsonResponse($data, $status_code = 200) {
    http_response_code($status_code);
    echo json_encode($data, JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);
    exit();
}

/**
 * Invia risposta di errore
 */
function sendErrorResponse($message, $status_code = 400, $details = null) {
    $response = [
        'error' => true,
        'message' => $message
    ];
    
    if ($details) {
        $response['details'] = $details;
    }
    
    sendJsonResponse($response, $status_code);
}

/**
 * Sanitizza input
 */
function sanitizeInput($input) {
    return htmlspecialchars(strip_tags(trim($input)));
}

/**
 * Valida parametri richiesti
 */
function validateRequiredParams($params, $required) {
    $missing = [];
    
    foreach ($required as $param) {
        if (!isset($params[$param]) || empty($params[$param])) {
            $missing[] = $param;
        }
    }
    
    if (!empty($missing)) {
        sendErrorResponse('Parametri mancanti: ' . implode(', ', $missing), 400);
    }
}

/**
 * Log errori
 */
function logError($message, $context = []) {
    $log_message = date('Y-m-d H:i:s') . ' - ' . $message;
    if (!empty($context)) {
        $log_message .= ' - Context: ' . json_encode($context);
    }
    error_log($log_message);
}
?>