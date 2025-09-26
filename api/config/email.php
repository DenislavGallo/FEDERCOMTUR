<?php
/**
 * Email Configuration
 * Configurazione per l'invio delle email
 */

return [
    // Email destinatario
    'to_email' => 'denislavgallo2005@gmail.com',
    'to_name' => 'FederComTur',
    
    // Email mittente
    'from_email' => 'noreply@federcomtur.it',
    'from_name' => 'FederComTur - Sistema Contatti',
    
    // Configurazione SMTP
    'smtp' => [
        'host' => 'smtp.gmail.com',
        'port' => 587,
        'username' => 'denislavgallo2005@gmail.com',
        'password' => 'zggq tiyu iwta ldnw', // Password app Gmail
        'encryption' => 'tls',
        'auth' => true
    ],
    
    // Configurazione rate limiting
    'rate_limit' => [
        'window' => 300, // 5 minuti
        'max_requests' => 3,
        'file' => __DIR__ . '/../../data/rate_limit.json'
    ],
    
    // Configurazione sicurezza
    'security' => [
        'honeypot_field' => 'website',
        'max_message_length' => 2000,
        'min_message_length' => 10,
        'allowed_request_types' => ['info', 'membership', 'consulting', 'funding', 'other']
    ]
];
?>
