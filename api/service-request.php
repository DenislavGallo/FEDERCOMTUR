<?php
// Endpoint richiesta servizio - invio email semplice + log
header('Content-Type: application/json; charset=utf-8');

try {
    if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
        http_response_code(405);
        echo json_encode(['success' => false, 'error' => 'Metodo non consentito']);
        exit;
    }

    // Anti-spam honeypot
    $hp = $_POST['website'] ?? '';
    if (!empty($hp)) {
        echo json_encode(['success' => true]); // rispondi ok silenziosamente
        exit;
    }

    $name = trim($_POST['name'] ?? '');
    $email = trim($_POST['email'] ?? '');
    $company = trim($_POST['company'] ?? '');
    $service = trim($_POST['service'] ?? '');
    $message = trim($_POST['message'] ?? '');

    if ($name === '' || !filter_var($email, FILTER_VALIDATE_EMAIL) || strlen($message) < 10) {
        http_response_code(400);
        echo json_encode(['success' => false, 'error' => 'Dati non validi']);
        exit;
    }

    // Componi email
    $to = 'info@federcomtur.it';
    $subject = "Richiesta Servizio - $service";
    $body = "Nome: $name\nEmail: $email\nAzienda: $company\nServizio: $service\n\nMessaggio:\n$message\n";
    $headers = 'From: noreply@federcomtur.it' . "\r\n" . 'Reply-To: ' . $email;

    // Tenta invio email (se mail() non configurata risponde comunque con success false)
    $sent = @mail($to, $subject, $body, $headers);

    // Log minimale
    $logLine = date('c') . "\t$ip\t$service\t$email\t" . ($sent ? 'SENT' : 'NOT_SENT') . "\n";
    @file_put_contents(__DIR__ . '/../data/service_requests.log', $logLine, FILE_APPEND);

    echo json_encode(['success' => $sent]);
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => 'Errore server']);
}
?>


