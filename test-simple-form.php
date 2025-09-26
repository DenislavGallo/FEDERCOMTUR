<?php
/**
 * Test Simple Contact Form
 */

// Simula richiesta POST
$_SERVER['REQUEST_METHOD'] = 'POST';
$_SERVER['HTTP_X_REQUESTED_WITH'] = 'XMLHttpRequest';

// Dati di test
$_POST = [
    'fullname' => 'Mario Rossi',
    'email' => 'mario.rossi@test.com',
    'company' => 'Test Company',
    'request_type' => 'info',
    'message' => 'Questo è un messaggio di test.',
    'privacy_consent' => '1',
    'website' => ''
];

echo "<h2>Test Simple Contact Form</h2>\n";

// Cattura output
ob_start();

try {
    include 'api/simple-contact-form.php';
    $output = ob_get_contents();
    ob_end_clean();
    
    echo "<h3>Output Raw:</h3>\n";
    echo "<pre>" . htmlspecialchars($output) . "</pre>\n";
    
    echo "<h3>JSON Decoded:</h3>\n";
    $json = json_decode($output, true);
    if ($json) {
        echo "<pre>" . print_r($json, true) . "</pre>\n";
    } else {
        echo "<p style='color: red;'>Errore JSON: " . json_last_error_msg() . "</p>\n";
    }
    
} catch (Exception $e) {
    ob_end_clean();
    echo "<h3>Errore:</h3>\n";
    echo "<p style='color: red;'>" . htmlspecialchars($e->getMessage()) . "</p>\n";
    echo "<p><strong>Stack trace:</strong></p>\n";
    echo "<pre>" . htmlspecialchars($e->getTraceAsString()) . "</pre>\n";
}

// Verifica file generati
echo "<h3>File Generati:</h3>\n";
if (file_exists('data/contact_requests.json')) {
    echo "✅ data/contact_requests.json creato<br>\n";
    $content = file_get_contents('data/contact_requests.json');
    echo "<pre>" . htmlspecialchars($content) . "</pre>\n";
} else {
    echo "❌ data/contact_requests.json non creato<br>\n";
}

if (file_exists('data/last_email.html')) {
    echo "✅ data/last_email.html creato<br>\n";
} else {
    echo "❌ data/last_email.html non creato<br>\n";
}
?>
