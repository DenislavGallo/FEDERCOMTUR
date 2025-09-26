<?php
/**
 * Test Contact Form Backend
 * Script per testare il backend del form contatti
 */

// Simula una richiesta POST
$_SERVER['REQUEST_METHOD'] = 'POST';
$_SERVER['HTTP_X_REQUESTED_WITH'] = 'XMLHttpRequest';

// Dati di test
$_POST = [
    'fullname' => 'Mario Rossi',
    'email' => 'mario.rossi@test.com',
    'company' => 'Test Company',
    'request_type' => 'info',
    'message' => 'Questo è un messaggio di test per verificare il funzionamento del form di contatto.',
    'privacy_consent' => '1',
    'website' => '', // Honeypot vuoto
    'timestamp' => date('Y-m-d H:i:s')
];

echo "<h2>Test Contact Form Backend</h2>\n";

// Cattura output
ob_start();

try {
    // Includi il file contact-form.php
    include 'api/contact-form.php';
    
    $output = ob_get_contents();
    ob_end_clean();
    
    echo "<h3>Output Backend:</h3>\n";
    echo "<pre>" . htmlspecialchars($output) . "</pre>\n";
    
} catch (Exception $e) {
    ob_end_clean();
    echo "<h3>Errore:</h3>\n";
    echo "<p style='color: red;'>" . htmlspecialchars($e->getMessage()) . "</p>\n";
    echo "<p><strong>Stack trace:</strong></p>\n";
    echo "<pre>" . htmlspecialchars($e->getTraceAsString()) . "</pre>\n";
}

// Test configurazione
echo "<h3>Test Configurazione:</h3>\n";

if (file_exists('api/config/email.php')) {
    echo "✅ File configurazione trovato<br>\n";
    
    try {
        $config = require 'api/config/email.php';
        echo "✅ Configurazione caricata<br>\n";
        
        if (isset($config['smtp']['password']) && $config['smtp']['password'] !== 'your_app_password_here') {
            echo "✅ Password SMTP configurata<br>\n";
        } else {
            echo "⚠️ Password SMTP non configurata (usa ancora placeholder)<br>\n";
        }
        
    } catch (Exception $e) {
        echo "❌ Errore caricamento configurazione: " . htmlspecialchars($e->getMessage()) . "<br>\n";
    }
} else {
    echo "❌ File configurazione non trovato<br>\n";
}

// Test directory data
echo "<h3>Test Directory Data:</h3>\n";
if (is_dir('data')) {
    echo "✅ Directory data esiste<br>\n";
    if (is_writable('data')) {
        echo "✅ Directory data scrivibile<br>\n";
    } else {
        echo "❌ Directory data non scrivibile<br>\n";
    }
} else {
    echo "❌ Directory data non esiste<br>\n";
}

// Test file rate limit
echo "<h3>Test File Rate Limit:</h3>\n";
if (file_exists('data/rate_limit.json')) {
    echo "✅ File rate limit esiste<br>\n";
    if (is_writable('data/rate_limit.json')) {
        echo "✅ File rate limit scrivibile<br>\n";
    } else {
        echo "❌ File rate limit non scrivibile<br>\n";
    }
} else {
    echo "❌ File rate limit non esiste<br>\n";
}

// Test funzioni PHP
echo "<h3>Test Funzioni PHP:</h3>\n";
if (function_exists('mail')) {
    echo "✅ Funzione mail() disponibile<br>\n";
} else {
    echo "❌ Funzione mail() non disponibile<br>\n";
}

if (function_exists('fsockopen')) {
    echo "✅ Funzione fsockopen() disponibile<br>\n";
} else {
    echo "❌ Funzione fsockopen() non disponibile<br>\n";
}

// Test connessione SMTP
echo "<h3>Test Connessione SMTP:</h3>\n";
$smtp_host = 'smtp.gmail.com';
$smtp_port = 587;

$connection = @fsockopen($smtp_host, $smtp_port, $errno, $errstr, 10);
if ($connection) {
    echo "✅ Connessione SMTP a {$smtp_host}:{$smtp_port} riuscita<br>\n";
    fclose($connection);
} else {
    echo "❌ Connessione SMTP fallita: {$errstr} ({$errno})<br>\n";
}

echo "<hr>\n";
echo "<p><strong>Se vedi errori qui sopra, correggili prima di testare il form.</strong></p>\n";
?>
