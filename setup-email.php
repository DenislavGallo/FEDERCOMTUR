<?php
/**
 * Setup Email Configuration
 * Script per configurare l'invio delle email
 */

// Carica configurazione
$email_config = require_once 'api/config/email.php';

echo "<h2>Configurazione Email FederComTur</h2>\n";

// Test configurazione corrente
echo "<h3>1. Test Configurazione Corrente</h3>\n";

// Verifica file di configurazione
if (file_exists('api/config/email.php')) {
    echo "✅ File configurazione email trovato<br>\n";
} else {
    echo "❌ File configurazione email non trovato<br>\n";
}

// Verifica directory data
if (is_dir('data') && is_writable('data')) {
    echo "✅ Directory data scrivibile<br>\n";
} else {
    echo "❌ Directory data non scrivibile<br>\n";
    echo "Eseguire: mkdir data && chmod 755 data<br>\n";
}

// Test connessione SMTP
echo "<h3>2. Test Connessione SMTP</h3>\n";

$smtp_host = $email_config['smtp']['host'];
$smtp_port = $email_config['smtp']['port'];

$connection = @fsockopen($smtp_host, $smtp_port, $errno, $errstr, 10);
if ($connection) {
    echo "✅ Connessione SMTP a {$smtp_host}:{$smtp_port} riuscita<br>\n";
    fclose($connection);
} else {
    echo "❌ Connessione SMTP fallita: {$errstr} ({$errno})<br>\n";
}

// Istruzioni configurazione
echo "<h3>3. Istruzioni per Configurazione Gmail</h3>\n";
echo "<div style='background: #f0f8ff; padding: 15px; border-left: 4px solid #007cba; margin: 10px 0;'>\n";
echo "<strong>Per configurare Gmail SMTP:</strong><br>\n";
echo "1. Abilita l'autenticazione a 2 fattori sul tuo account Gmail<br>\n";
echo "2. Genera una 'Password per le app' specifica<br>\n";
echo "3. Sostituisci 'your_app_password_here' in api/config/email.php<br>\n";
echo "4. Testa l'invio con il form di contatto<br>\n";
echo "</div>\n";

// Test form
echo "<h3>4. Test Form di Contatto</h3>\n";
echo "<p>Per testare l'invio email:</p>\n";
echo "<ol>\n";
echo "<li>Vai su <a href='contattaci.html'>contattaci.html</a></li>\n";
echo "<li>Compila il form con dati di test</li>\n";
echo "<li>Invia la richiesta</li>\n";
echo "<li>Controlla la casella email denislavgallo2005@gmail.com</li>\n";
echo "</ol>\n";

// Configurazione alternativa
echo "<h3>5. Configurazione Alternativa (Mail nativo)</h3>\n";
echo "<div style='background: #fff3cd; padding: 15px; border-left: 4px solid #ffc107; margin: 10px 0;'>\n";
echo "<strong>Se SMTP non funziona:</strong><br>\n";
echo "Il sistema userà automaticamente la funzione mail() nativa di PHP.<br>\n";
echo "Assicurati che il server abbia un MTA configurato (sendmail, postfix, ecc.)<br>\n";
echo "</div>\n";

// Log errori
echo "<h3>6. Debug e Log</h3>\n";
echo "<p>Per debug, controlla:</p>\n";
echo "<ul>\n";
echo "<li>Log errori PHP: " . ini_get('error_log') . "</li>\n";
echo "<li>Log server web (Apache/Nginx)</li>\n";
echo "<li>Console browser per errori JavaScript</li>\n";
echo "</ul>\n";

// Stato finale
echo "<h3>7. Stato Configurazione</h3>\n";
if (file_exists('api/contact-form.php')) {
    echo "✅ Backend contact form implementato<br>\n";
} else {
    echo "❌ Backend contact form mancante<br>\n";
}

if (file_exists('js/contact.js')) {
    echo "✅ Frontend contact form implementato<br>\n";
} else {
    echo "❌ Frontend contact form mancante<br>\n";
}

echo "<hr>\n";
echo "<p><strong>Prossimi passi:</strong></p>\n";
echo "<ol>\n";
echo "<li>Configura la password app Gmail in api/config/email.php</li>\n";
echo "<li>Testa l'invio con il form di contatto</li>\n";
echo "<li>Verifica la ricezione email su denislavgallo2005@gmail.com</li>\n";
echo "</ol>\n";
?>
