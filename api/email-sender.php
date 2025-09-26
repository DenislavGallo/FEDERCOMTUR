<?php
/**
 * Email Sender Class
 * Classe per l'invio delle email con supporto SMTP
 */

class EmailSender {
    private $config;
    private $errors = [];
    
    public function __construct($config) {
        $this->config = $config;
    }
    
    /**
     * Invia email usando PHPMailer se disponibile, altrimenti mail() nativo
     */
    public function sendEmail($to, $subject, $message, $from = null, $replyTo = null) {
        if (class_exists('PHPMailer\PHPMailer\PHPMailer')) {
            return $this->sendWithPHPMailer($to, $subject, $message, $from, $replyTo);
        } else {
            return $this->sendWithNativeMail($to, $subject, $message, $from, $replyTo);
        }
    }
    
    /**
     * Invio con PHPMailer (più affidabile)
     */
    private function sendWithPHPMailer($to, $subject, $message, $from = null, $replyTo = null) {
        try {
            $mail = new PHPMailer\PHPMailer\PHPMailer(true);
            
            // Configurazione SMTP
            $mail->isSMTP();
            $mail->Host = $this->config['smtp']['host'];
            $mail->SMTPAuth = $this->config['smtp']['auth'];
            $mail->Username = $this->config['smtp']['username'];
            $mail->Password = $this->config['smtp']['password'];
            $mail->SMTPSecure = $this->config['smtp']['encryption'];
            $mail->Port = $this->config['smtp']['port'];
            
            // Configurazione email
            $mail->setFrom(
                $from ? $from['email'] : $this->config['from_email'],
                $from ? $from['name'] : $this->config['from_name']
            );
            
            $mail->addAddress($to['email'], $to['name'] ?? '');
            
            if ($replyTo) {
                $mail->addReplyTo($replyTo['email'], $replyTo['name'] ?? '');
            }
            
            $mail->isHTML(true);
            $mail->Subject = $subject;
            $mail->Body = $message;
            $mail->CharSet = 'UTF-8';
            
            return $mail->send();
            
        } catch (Exception $e) {
            $this->errors[] = "Errore PHPMailer: " . $e->getMessage();
            return false;
        }
    }
    
    /**
     * Invio con mail() nativo (fallback)
     */
    private function sendWithNativeMail($to, $subject, $message, $from = null, $replyTo = null) {
        $from_email = $from ? $from['email'] : $this->config['from_email'];
        $from_name = $from ? $from['name'] : $this->config['from_name'];
        $reply_to = $replyTo ? $replyTo['email'] : $from_email;
        
        $headers = [
            'MIME-Version: 1.0',
            'Content-Type: text/html; charset=UTF-8',
            'From: ' . $from_name . ' <' . $from_email . '>',
            'Reply-To: ' . $reply_to,
            'X-Mailer: PHP/' . phpversion(),
            'X-Priority: 3'
        ];
        
        return mail($to['email'], $subject, $message, implode("\r\n", $headers));
    }
    
    /**
     * Verifica configurazione email
     */
    public function testConfiguration() {
        $tests = [];
        
        // Test connessione SMTP
        if (function_exists('fsockopen')) {
            $smtp_host = $this->config['smtp']['host'];
            $smtp_port = $this->config['smtp']['port'];
            
            $connection = @fsockopen($smtp_host, $smtp_port, $errno, $errstr, 10);
            if ($connection) {
                $tests['smtp_connection'] = true;
                fclose($connection);
            } else {
                $tests['smtp_connection'] = false;
                $tests['smtp_error'] = "$errstr ($errno)";
            }
        }
        
        // Test configurazione
        $tests['config_valid'] = !empty($this->config['smtp']['host']) && 
                                !empty($this->config['smtp']['username']) && 
                                !empty($this->config['smtp']['password']);
        
        return $tests;
    }
    
    /**
     * Ottieni errori
     */
    public function getErrors() {
        return $this->errors;
    }
    
    /**
     * Pulisci errori
     */
    public function clearErrors() {
        $this->errors = [];
    }
}
?>
