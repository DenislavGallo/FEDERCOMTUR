<?php
/**
 * Simple Contact Form Handler
 * Versione semplificata per test
 */

// Disabilita errori e warning per output pulito
error_reporting(0);
ini_set('display_errors', 0);

// Pulisci buffer di output
if (ob_get_level()) {
    ob_clean();
}

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST');
header('Access-Control-Allow-Headers: Content-Type, X-Requested-With');

// Verifica metodo
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['success' => false, 'message' => 'Metodo non consentito']);
    exit;
}

// Verifica AJAX
if (!isset($_SERVER['HTTP_X_REQUESTED_WITH']) || $_SERVER['HTTP_X_REQUESTED_WITH'] !== 'XMLHttpRequest') {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'Richiesta non valida']);
    exit;
}

try {
    // Validazione campi obbligatori
    $required_fields = ['fullname', 'email', 'message', 'request_type', 'privacy_consent'];
    $errors = [];
    
    foreach ($required_fields as $field) {
        if (!isset($_POST[$field]) || empty(trim($_POST[$field]))) {
            $errors[] = "Campo {$field} obbligatorio";
        }
    }
    
    // Validazione email
    if (isset($_POST['email']) && !filter_var($_POST['email'], FILTER_VALIDATE_EMAIL)) {
        $errors[] = 'Email non valida';
    }
    
    // Controllo honeypot
    if (isset($_POST['website']) && !empty(trim($_POST['website']))) {
        $errors[] = 'Richiesta non valida';
    }
    
    if (!empty($errors)) {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'Dati non validi', 'errors' => $errors]);
        exit;
    }
    
    // Prepara dati email
    $fullname = htmlspecialchars(trim($_POST['fullname']));
    $email = htmlspecialchars(trim($_POST['email']));
    $company = isset($_POST['company']) ? htmlspecialchars(trim($_POST['company'])) : '';
    $request_type = htmlspecialchars(trim($_POST['request_type']));
    $message = htmlspecialchars(trim($_POST['message']));
    
    // Etichette tipo richiesta
    $request_labels = [
        'info' => 'Richiesta informazioni generali',
        'membership' => 'Adesione alla federazione',
        'consulting' => 'Consulenza normativa',
        'funding' => 'Supporto bandi e finanziamenti',
        'other' => 'Altro'
    ];
    
    $request_label = $request_labels[$request_type] ?? 'Non specificato';
    
    // Contenuto email
    $subject = "Nuova richiesta di contatto - " . $request_label;
    
    $email_body = "
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
                    <div class='value'>{$fullname}</div>
                </div>
                
                <div class='field'>
                    <div class='label'>Email:</div>
                    <div class='value'>{$email}</div>
                </div>
                
                <div class='field'>
                    <div class='label'>Azienda/Organizzazione:</div>
                    <div class='value'>" . ($company ?: 'Non specificato') . "</div>
                </div>
                
                <div class='field'>
                    <div class='label'>Tipo di Richiesta:</div>
                    <div class='value'>{$request_label}</div>
                </div>
                
                <div class='field'>
                    <div class='label'>Messaggio:</div>
                    <div class='value'>" . nl2br($message) . "</div>
                </div>
                
                <div class='field'>
                    <div class='label'>Data e Ora:</div>
                    <div class='value'>" . date('Y-m-d H:i:s') . "</div>
                </div>
                
                <div class='field'>
                    <div class='label'>IP:</div>
                    <div class='value'>" . ($_SERVER['REMOTE_ADDR'] ?? 'N/A') . "</div>
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
    
    // Headers email
    $headers = [
        'MIME-Version: 1.0',
        'Content-Type: text/html; charset=UTF-8',
        'From: FederComTur <noreply@federcomtur.it>',
        'Reply-To: ' . $email,
        'X-Mailer: PHP/' . phpversion()
    ];
    
    // Salva in file per test (invece di inviare email)
    $log_entry = [
        'timestamp' => date('Y-m-d H:i:s'),
        'fullname' => $fullname,
        'email' => $email,
        'company' => $company,
        'request_type' => $request_type,
        'message' => $message,
        'ip' => $_SERVER['REMOTE_ADDR'] ?? 'N/A'
    ];
    
    // Salva in file JSON
    $log_file = 'data/contact_requests.json';
    $requests = [];
    
    if (file_exists($log_file)) {
        $requests = json_decode(file_get_contents($log_file), true) ?: [];
    }
    
    $requests[] = $log_entry;
    file_put_contents($log_file, json_encode($requests, JSON_PRETTY_PRINT));
    
    // Per ora salva anche come file email per test
    $email_file = 'data/last_email.html';
    file_put_contents($email_file, $email_body);
    
    // Risposta di successo
    http_response_code(200);
    echo json_encode([
        'success' => true,
        'message' => 'Richiesta inviata con successo! Controlla data/last_email.html per vedere il contenuto.'
    ]);
    
} catch (Exception $e) {
    error_log('Contact form error: ' . $e->getMessage());
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => 'Errore interno del server'
    ]);
}
?>
