<?php
/**
 * Contact Form Backend Handler
 * Gestisce l'invio delle richieste di contatto via email
 * 
 * @author FederComTur
 * @version 1.0
 */

// Configurazione
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST');
header('Access-Control-Allow-Headers: Content-Type, X-Requested-With');

// Configurazione email
define('TO_EMAIL', 'denislavgallo2005@gmail.com');
define('FROM_EMAIL', 'noreply@federcomtur.it');
define('FROM_NAME', 'FederComTur - Sistema Contatti');

// Configurazione SMTP (da configurare con il tuo provider)
define('SMTP_HOST', 'smtp.gmail.com');
define('SMTP_PORT', 587);
define('SMTP_USERNAME', 'denislavgallo2005@gmail.com');
define('SMTP_PASSWORD', 'your_app_password_here'); // Password app Gmail
define('SMTP_ENCRYPTION', 'tls');

// Rate limiting
define('RATE_LIMIT_FILE', __DIR__ . '/../data/rate_limit.json');
define('RATE_LIMIT_WINDOW', 300); // 5 minuti
define('RATE_LIMIT_MAX_REQUESTS', 3);

class ContactFormHandler {
    private $errors = [];
    private $data = [];
    
    public function __construct() {
        // Verifica metodo HTTP
        if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
            $this->sendError('Metodo non consentito', 405);
            return;
        }
        
        // Verifica AJAX request
        if (!isset($_SERVER['HTTP_X_REQUESTED_WITH']) || 
            $_SERVER['HTTP_X_REQUESTED_WITH'] !== 'XMLHttpRequest') {
            $this->sendError('Richiesta non valida', 400);
            return;
        }
        
        $this->processRequest();
    }
    
    private function processRequest() {
        try {
            // Rate limiting
            if (!$this->checkRateLimit()) {
                $this->sendError('Troppe richieste. Riprova più tardi.', 429);
                return;
            }
            
            // Validazione e sanitizzazione
            if (!$this->validateAndSanitize()) {
                $this->sendError('Dati non validi', 400, 'validation');
                return;
            }
            
            // Controllo honeypot
            if (!$this->checkHoneypot()) {
                $this->sendError('Richiesta non valida', 400, 'spam');
                return;
            }
            
            // Invio email
            if ($this->sendEmail()) {
                $this->sendSuccess();
            } else {
                $this->sendError('Errore nell\'invio dell\'email', 500);
            }
            
        } catch (Exception $e) {
            error_log('Contact form error: ' . $e->getMessage());
            $this->sendError('Errore interno del server', 500);
        }
    }
    
    private function validateAndSanitize() {
        $required_fields = ['fullname', 'email', 'message', 'request_type', 'privacy_consent'];
        
        foreach ($required_fields as $field) {
            if (!isset($_POST[$field]) || empty(trim($_POST[$field]))) {
                $this->errors[] = "Campo {$field} obbligatorio";
                continue;
            }
            
            $this->data[$field] = $this->sanitizeInput($_POST[$field]);
        }
        
        // Validazione email
        if (!filter_var($this->data['email'], FILTER_VALIDATE_EMAIL)) {
            $this->errors[] = 'Email non valida';
        }
        
        // Validazione nome completo
        if (str_word_count($this->data['fullname']) < 2) {
            $this->errors[] = 'Inserisci nome e cognome completi';
        }
        
        // Validazione messaggio
        if (strlen($this->data['message']) < 10) {
            $this->errors[] = 'Messaggio troppo breve';
        }
        
        // Validazione privacy consent
        if ($this->data['privacy_consent'] !== '1') {
            $this->errors[] = 'Consenso privacy obbligatorio';
        }
        
        // Campi opzionali
        $this->data['company'] = isset($_POST['company']) ? $this->sanitizeInput($_POST['company']) : '';
        $this->data['timestamp'] = date('Y-m-d H:i:s');
        $this->data['ip'] = $this->getClientIP();
        $this->data['user_agent'] = $_SERVER['HTTP_USER_AGENT'] ?? '';
        
        return empty($this->errors);
    }
    
    private function sanitizeInput($input) {
        return htmlspecialchars(trim($input), ENT_QUOTES, 'UTF-8');
    }
    
    private function checkHoneypot() {
        // Controllo campo honeypot (dovrebbe essere vuoto)
        return !isset($_POST['website']) || empty(trim($_POST['website']));
    }
    
    private function checkRateLimit() {
        $ip = $this->getClientIP();
        $rate_limit_file = RATE_LIMIT_FILE;
        
        // Crea directory se non esiste
        $dir = dirname($rate_limit_file);
        if (!is_dir($dir)) {
            mkdir($dir, 0755, true);
        }
        
        $rate_data = [];
        if (file_exists($rate_limit_file)) {
            $rate_data = json_decode(file_get_contents($rate_limit_file), true) ?: [];
        }
        
        $current_time = time();
        $window_start = $current_time - RATE_LIMIT_WINDOW;
        
        // Pulisci richieste vecchie
        if (isset($rate_data[$ip])) {
            $rate_data[$ip] = array_filter($rate_data[$ip], function($timestamp) use ($window_start) {
                return $timestamp > $window_start;
            });
        }
        
        // Controlla limite
        if (isset($rate_data[$ip]) && count($rate_data[$ip]) >= RATE_LIMIT_MAX_REQUESTS) {
            return false;
        }
        
        // Aggiungi richiesta corrente
        if (!isset($rate_data[$ip])) {
            $rate_data[$ip] = [];
        }
        $rate_data[$ip][] = $current_time;
        
        // Salva dati
        file_put_contents($rate_limit_file, json_encode($rate_data));
        
        return true;
    }
    
    private function getClientIP() {
        $ip_keys = ['HTTP_X_FORWARDED_FOR', 'HTTP_X_REAL_IP', 'HTTP_CLIENT_IP', 'REMOTE_ADDR'];
        
        foreach ($ip_keys as $key) {
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
        
        return $_SERVER['REMOTE_ADDR'] ?? '0.0.0.0';
    }
    
    private function sendEmail() {
        // Prepara contenuto email
        $subject = "Nuova richiesta di contatto - " . $this->getRequestTypeLabel($this->data['request_type']);
        
        $message = $this->buildEmailMessage();
        $headers = $this->buildEmailHeaders();
        
        // Per ora usa solo mail() nativo con configurazione SMTP
        return $this->sendWithNativeMail($subject, $message, $headers);
    }
    
    private function buildEmailMessage() {
        $request_type_labels = [
            'info' => 'Richiesta informazioni generali',
            'membership' => 'Adesione alla federazione',
            'consulting' => 'Consulenza normativa',
            'funding' => 'Supporto bandi e finanziamenti',
            'other' => 'Altro'
        ];
        
        $request_type = $request_type_labels[$this->data['request_type']] ?? 'Non specificato';
        
        $message = "
        <html>
        <head>
            <title>Nuova richiesta di contatto</title>
            <style>
                body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                .header { background: #059669; color: white; padding: 20px; text-align: center; }
                .content { background: #f9f9f9; padding: 20px; }
                .field { margin-bottom: 15px; }
                .label { font-weight: bold; color: #059669; }
                .value { margin-top: 5px; }
                .footer { background: #e5e7eb; padding: 15px; text-align: center; font-size: 12px; color: #666; }
            </style>
        </head>
        <body>
            <div class='container'>
                <div class='header'>
                    <h2>Nuova Richiesta di Contatto</h2>
                    <p>FederComTur - Sistema Contatti</p>
                </div>
                
                <div class='content'>
                    <div class='field'>
                        <div class='label'>Nome e Cognome:</div>
                        <div class='value'>{$this->data['fullname']}</div>
                    </div>
                    
                    <div class='field'>
                        <div class='label'>Email:</div>
                        <div class='value'>{$this->data['email']}</div>
                    </div>
                    
                    <div class='field'>
                        <div class='label'>Azienda/Organizzazione:</div>
                        <div class='value'>" . ($this->data['company'] ?: 'Non specificato') . "</div>
                    </div>
                    
                    <div class='field'>
                        <div class='label'>Tipo di Richiesta:</div>
                        <div class='value'>{$request_type}</div>
                    </div>
                    
                    <div class='field'>
                        <div class='label'>Messaggio:</div>
                        <div class='value'>" . nl2br($this->data['message']) . "</div>
                    </div>
                    
                    <div class='field'>
                        <div class='label'>Data e Ora:</div>
                        <div class='value'>{$this->data['timestamp']}</div>
                    </div>
                    
                    <div class='field'>
                        <div class='label'>IP:</div>
                        <div class='value'>{$this->data['ip']}</div>
                    </div>
                </div>
                
                <div class='footer'>
                    <p>Questa email è stata generata automaticamente dal sistema di contatti di FederComTur.</p>
                    <p>Per rispondere, utilizza l'indirizzo email fornito dal richiedente.</p>
                </div>
            </div>
        </body>
        </html>
        ";
        
        return $message;
    }
    
    private function buildEmailHeaders() {
        $headers = [
            'MIME-Version: 1.0',
            'Content-Type: text/html; charset=UTF-8',
            'From: ' . FROM_NAME . ' <' . FROM_EMAIL . '>',
            'Reply-To: ' . $this->data['email'],
            'X-Mailer: PHP/' . phpversion(),
            'X-Priority: 3'
        ];
        
        return implode("\r\n", $headers);
    }
    
    private function sendWithNativeMail($subject, $message, $headers) {
        // Configura SMTP per mail() nativo
        ini_set('SMTP', SMTP_HOST);
        ini_set('smtp_port', SMTP_PORT);
        ini_set('sendmail_from', FROM_EMAIL);
        
        // Prova invio email
        $result = mail(TO_EMAIL, $subject, $message, $headers);
        
        // Reset configurazione
        ini_restore('SMTP');
        ini_restore('smtp_port');
        ini_restore('sendmail_from');
        
        return $result;
    }
    
    private function sendWithPHPMailer($subject, $message) {
        // Implementazione PHPMailer (da aggiungere se necessario)
        // Per ora usa mail() nativo
        return $this->sendWithNativeMail($subject, $message, $this->buildEmailHeaders());
    }
    
    private function getRequestTypeLabel($type) {
        $labels = [
            'info' => 'Informazioni',
            'membership' => 'Adesione',
            'consulting' => 'Consulenza',
            'funding' => 'Finanziamenti',
            'other' => 'Altro'
        ];
        
        return $labels[$type] ?? 'Non specificato';
    }
    
    private function sendSuccess() {
        http_response_code(200);
        echo json_encode([
            'success' => true,
            'message' => 'Richiesta inviata con successo'
        ]);
        exit;
    }
    
    private function sendError($message, $code = 400, $error_type = null) {
        http_response_code($code);
        $response = [
            'success' => false,
            'message' => $message
        ];
        
        if ($error_type) {
            $response['error'] = $error_type;
        }
        
        if (!empty($this->errors)) {
            $response['errors'] = $this->errors;
        }
        
        echo json_encode($response);
        exit;
    }
}

// Inizializza handler
new ContactFormHandler();
?>
