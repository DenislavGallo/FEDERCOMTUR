<?php
/**
 * Setup SMTP per XAMPP
 * Configurazione per invio email in ambiente locale
 */

echo "<h2>Configurazione SMTP per XAMPP</h2>\n";

echo "<h3>1. Problema Attuale</h3>\n";
echo "<div style='background: #fff3cd; padding: 15px; border-left: 4px solid #ffc107; margin: 10px 0;'>\n";
echo "<strong>XAMPP locale non può inviare email direttamente</strong><br>\n";
echo "• XAMPP non ha un server SMTP configurato<br>\n";
echo "• La funzione mail() PHP cerca localhost:25 (non disponibile)<br>\n";
echo "• Serve configurazione SMTP esterna (Gmail, ecc.)<br>\n";
echo "</div>\n";

echo "<h3>2. Soluzioni Disponibili</h3>\n";

echo "<h4>Opzione A: Configurazione Gmail SMTP</h4>\n";
echo "<div style='background: #d1ecf1; padding: 15px; border-left: 4px solid #17a2b8; margin: 10px 0;'>\n";
echo "<strong>Passaggi:</strong><br>\n";
echo "1. Abilita 2FA su denislavgallo2005@gmail.com<br>\n";
echo "2. Genera password app Gmail<br>\n";
echo "3. Configura php.ini di XAMPP<br>\n";
echo "4. Testa invio email<br>\n";
echo "</div>\n";

echo "<h4>Opzione B: Usare servizio esterno</h4>\n";
echo "<div style='background: #d4edda; padding: 15px; border-left: 4px solid #28a745; margin: 10px 0;'>\n";
echo "<strong>Servizi consigliati:</strong><br>\n";
echo "• SendGrid (gratuito fino a 100 email/giorno)<br>\n";
echo "• Mailgun (gratuito fino a 5.000 email/mese)<br>\n";
echo "• Amazon SES (molto economico)<br>\n";
echo "</div>\n";

echo "<h3>3. Configurazione php.ini per Gmail</h3>\n";
echo "<div style='background: #f8f9fa; padding: 15px; border: 1px solid #dee2e6; margin: 10px 0;'>\n";
echo "<strong>Modifica php.ini in C:\\xampp\\php\\php.ini:</strong><br>\n";
echo "<pre>\n";
echo "[mail function]\n";
echo "SMTP = smtp.gmail.com\n";
echo "smtp_port = 587\n";
echo "sendmail_from = denislavgallo2005@gmail.com\n";
echo "sendmail_path = \"C:\\xampp\\sendmail\\sendmail.exe -t\"\n";
echo "</pre>\n";
echo "</div>\n";

echo "<h3>4. Configurazione sendmail.ini</h3>\n";
echo "<div style='background: #f8f9fa; padding: 15px; border: 1px solid #dee2e6; margin: 10px 0;'>\n";
echo "<strong>Crea/modifica C:\\xampp\\sendmail\\sendmail.ini:</strong><br>\n";
echo "<pre>\n";
echo "[sendmail]\n";
echo "smtp_server=smtp.gmail.com\n";
echo "smtp_port=587\n";
echo "smtp_ssl=auto\n";
echo "auth_username=denislavgallo2005@gmail.com\n";
echo "auth_password=your_app_password_here\n";
echo "force_sender=denislavgallo2005@gmail.com\n";
echo "</pre>\n";
echo "</div>\n";

echo "<h3>5. Test Configurazione</h3>\n";
echo "<p>Dopo la configurazione, testa con:</p>\n";
echo "<ol>\n";
echo "<li>Riavvia Apache in XAMPP</li>\n";
echo "<li>Vai su <a href='contattaci.html'>contattaci.html</a></li>\n";
echo "<li>Compila e invia il form</li>\n";
echo "<li>Controlla la casella denislavgallo2005@gmail.com</li>\n";
echo "</ol>\n";

echo "<h3>6. Stato Attuale</h3>\n";
echo "<p>Il form attualmente:</p>\n";
echo "<ul>\n";
echo "<li>✅ Salva le richieste in data/contact_requests.json</li>\n";
echo "<li>✅ Genera email HTML in data/last_email.html</li>\n";
echo "<li>❌ Non invia email reali (configurazione SMTP mancante)</li>\n";
echo "</ul>\n";

echo "<h3>7. Alternative Immediate</h3>\n";
echo "<div style='background: #e2e3e5; padding: 15px; border-left: 4px solid #6c757d; margin: 10px 0;'>\n";
echo "<strong>Per test immediato:</strong><br>\n";
echo "1. Usa il form per inviare richieste<br>\n";
echo "2. Controlla data/last_email.html per vedere l'email generata<br>\n";
echo "3. Copia il contenuto e invialo manualmente<br>\n";
echo "4. Configura SMTP per automazione completa<br>\n";
echo "</div>\n";

echo "<hr>\n";
echo "<p><strong>Raccomandazione:</strong> Configura Gmail SMTP per avere invio email automatico funzionante.</p>\n";
?>
