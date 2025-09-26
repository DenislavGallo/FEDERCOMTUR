<?php
/**
 * API Newsletter Subscription - FederComTur
 * =========================================
 * Gestisce le iscrizioni newsletter tramite EmailOctopus
 */

require_once 'config/database.php';
require_once 'config/emailoctopus.php';

/**
 * Classe per gestire le iscrizioni newsletter
 */
class NewsletterSubscriptionManager {
    private $emailOctopus;
    private $listId;
    
    public function __construct() {
        // Usa List ID da configurazione EmailOctopus
        $this->listId = EMAILOCTOPUS_LIST_ID;
        $this->emailOctopus = getEmailOctopusManager($this->listId);
    }
    
    /**
     * Gestisce l'iscrizione newsletter
     */
    public function subscribe($email, $additionalData = []) {
        try {
            // Honeypot check
            if (isset($additionalData['website']) && !empty($additionalData['website'])) {
                return [
                    'success' => false,
                    'error' => 'Richiesta sospetta rilevata'
                ];
            }
            
            // Validazione input
            $email = trim($email);
            if (empty($email)) {
                return [
                    'success' => false,
                    'error' => 'Email richiesta'
                ];
            }
            
            if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
                return [
                    'success' => false,
                    'error' => 'Formato email non valido'
                ];
            }
            
            // Controllo duplicati intelligente
            if ($this->isDuplicateEmail($email)) {
                return [
                    'success' => false,
                    'error' => 'Email già registrata',
                    'already_subscribed' => true
                ];
            }
            
            // Sanitizza dati aggiuntivi
            $cleanData = sanitizeEmailOctopusData($additionalData);
            
            // Prepara campi per EmailOctopus con auto-estrazione nome da email
            $fields = formatEmailOctopusFields($cleanData, $email);
            
            // Prepara tag
            $tags = ['website', 'federcomtur-est-europa'];
            if (isset($cleanData['source'])) {
                $tags[] = 'source-' . $cleanData['source'];
            }
            
            // Se EmailOctopus non è disponibile, salva localmente
            if (!$this->emailOctopus) {
                return $this->saveLocalSubscription($email, $fields, $tags);
            }
            
            // Prova iscrizione EmailOctopus
            $result = $this->emailOctopus->addSubscriber($email, $fields, $tags);
            
            if ($result['success']) {
                // Salva anche localmente per backup
                $this->saveLocalSubscription($email, $fields, $tags, 'emailoctopus');
                
                return [
                    'success' => true,
                    'message' => $result['message'],
                    'provider' => 'emailoctopus',
                    'status' => $result['status'],
                    'contact_id' => $result['contact_id'] ?? null
                ];
            } else {
                // Gestione intelligente errori EmailOctopus
                if (isset($result['http_code']) && $result['http_code'] === 409) {
                    return [
                        'success' => false,
                        'error' => 'Email già registrata su EmailOctopus',
                        'already_subscribed' => true
                    ];
                }
                
                // Se altri errori EmailOctopus, salva localmente
                $localResult = $this->saveLocalSubscription($email, $fields, $tags, 'local_fallback');
                
                return [
                    'success' => true,
                    'message' => 'Iscrizione registrata. Verrai contattato presto!',
                    'provider' => 'local_fallback',
                    'warning' => 'EmailOctopus temporaneamente non disponibile',
                    'original_error' => $result['error']
                ];
            }
            
        } catch (Exception $e) {
            error_log('Errore iscrizione newsletter: ' . $e->getMessage());
            
            // Fallback locale in caso di errore
            $localResult = $this->saveLocalSubscription($email, $fields ?? [], $tags ?? []);
            
            return [
                'success' => true,
                'message' => 'Iscrizione registrata localmente',
                'provider' => 'local_emergency'
            ];
        }
    }
    
    /**
     * Controlla se email già esistente (CSV locale)
     */
    private function isDuplicateEmail($email) {
        $csvFile = __DIR__ . '/../data/newsletter_subscriptions.csv';
        
        if (!file_exists($csvFile)) {
            return false; // File non esiste, nessun duplicato
        }
        
        try {
            $handle = fopen($csvFile, 'r');
            if (!$handle) {
                return false; // Errore lettura, permetti iscrizione
            }
            
            // Salta header
            fgetcsv($handle);
            
            // Controlla ogni riga
            while (($data = fgetcsv($handle)) !== FALSE) {
                if (isset($data[1]) && trim(strtolower($data[1])) === strtolower($email)) {
                    fclose($handle);
                    return true; // Duplicato trovato
                }
            }
            
            fclose($handle);
            return false; // Nessun duplicato
            
        } catch (Exception $e) {
            error_log('Errore controllo duplicati: ' . $e->getMessage());
            return false; // In caso di errore, permetti iscrizione
        }
    }

    /**
     * Salva iscrizione localmente (backup o fallback)
     */
    private function saveLocalSubscription($email, $fields = [], $tags = [], $source = 'local') {
        try {
            // Crea file CSV se non esiste
            $csvFile = __DIR__ . '/../data/newsletter_subscriptions.csv';
            $fileExists = file_exists($csvFile);
            
            // Prepara dati per CSV
            $csvData = [
                date('Y-m-d H:i:s'),
                $email,
                json_encode($fields),
                json_encode($tags),
                $source,
                $_SERVER['REMOTE_ADDR'] ?? 'unknown',
                $_SERVER['HTTP_USER_AGENT'] ?? 'unknown'
            ];
            
            // Controlla duplicato prima di salvare
            if ($this->isDuplicateEmail($email)) {
                return [
                    'success' => false,
                    'error' => 'Email già presente nel backup locale'
                ];
            }
            
            // Apri file in append mode
            $file = fopen($csvFile, 'a');
            
            // Aggiungi header se file nuovo
            if (!$fileExists) {
                fputcsv($file, [
                    'timestamp',
                    'email',
                    'fields',
                    'tags',
                    'source',
                    'ip_address',
                    'user_agent'
                ]);
            }
            
            // Scrivi dati
            fputcsv($file, $csvData);
            fclose($file);
            
            return [
                'success' => true,
                'message' => 'Iscrizione salvata localmente',
                'provider' => $source
            ];
            
        } catch (Exception $e) {
            error_log('Errore salvataggio locale: ' . $e->getMessage());
            return [
                'success' => false,
                'error' => 'Errore nel salvataggio'
            ];
        }
    }
    
    /**
     * Test configurazione EmailOctopus
     */
    public function testConfiguration() {
        if (!$this->emailOctopus) {
            return [
                'success' => false,
                'error' => 'EmailOctopusManager non inizializzato'
            ];
        }
        
        return $this->emailOctopus->testConnection();
    }
    
    /**
     * Cleanup duplicati dal CSV esistente
     */
    public function cleanupDuplicates() {
        $csvFile = __DIR__ . '/../data/newsletter_subscriptions.csv';
        
        if (!file_exists($csvFile)) {
            return [
                'success' => true,
                'message' => 'Nessun file da pulire',
                'removed' => 0
            ];
        }
        
        try {
            $lines = file($csvFile, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
            $header = array_shift($lines); // Rimuovi header
            
            $uniqueEmails = [];
            $cleanLines = [$header]; // Mantieni header
            $removedCount = 0;
            
            foreach ($lines as $line) {
                $data = str_getcsv($line);
                if (isset($data[1]) && !empty($data[1])) {
                    $email = strtolower(trim($data[1]));
                    
                    if (!in_array($email, $uniqueEmails)) {
                        $uniqueEmails[] = $email;
                        $cleanLines[] = $line;
                    } else {
                        $removedCount++;
                        error_log("Duplicato rimosso: $email");
                    }
                }
            }
            
            // Riscrivi file pulito
            file_put_contents($csvFile, implode('', $cleanLines));
            
            return [
                'success' => true,
                'message' => "Rimossi $removedCount duplicati",
                'removed' => $removedCount,
                'unique_emails' => count($uniqueEmails)
            ];
            
        } catch (Exception $e) {
            error_log('Errore cleanup duplicati: ' . $e->getMessage());
            return [
                'success' => false,
                'error' => 'Errore durante cleanup'
            ];
        }
    }

    /**
     * Ottiene statistiche iscrizioni locali
     */
    public function getLocalStats() {
        $csvFile = __DIR__ . '/../data/newsletter_subscriptions.csv';
        
        if (!file_exists($csvFile)) {
            return [
                'success' => true,
                'total_subscriptions' => 0,
                'by_source' => []
            ];
        }
        
        $lines = file($csvFile);
        $total = count($lines) - 1; // -1 per header
        
        $bySource = [];
        for ($i = 1; $i < count($lines); $i++) {
            $data = str_getcsv($lines[$i]);
            $source = $data[4] ?? 'unknown';
            $bySource[$source] = ($bySource[$source] ?? 0) + 1;
        }
        
        return [
            'success' => true,
            'total_subscriptions' => max(0, $total),
            'by_source' => $bySource
        ];
    }
}

// =============================================
// GESTIONE RICHIESTE HTTP
// =============================================

// Headers CORS
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');
header('Content-Type: application/json; charset=utf-8');

// Gestione preflight
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

try {
    $subscriptionManager = new NewsletterSubscriptionManager();
    $method = $_SERVER['REQUEST_METHOD'] ?? 'POST';
    
    switch ($method) {
        case 'POST':
            // Leggi dati JSON dal body
            $input = file_get_contents('php://input');
            $data = json_decode($input, true);
            
            // Fallback a $_POST se JSON non disponibile
            if (!$data) {
                $data = $_POST;
            }
            
            $email = $data['email'] ?? '';
            $additionalData = [
                'source' => $data['source'] ?? 'website',
                'page' => $data['page'] ?? 'unknown',
                'first_name' => $data['first_name'] ?? '',
                'last_name' => $data['last_name'] ?? '',
                'company' => $data['company'] ?? ''
            ];
            
            $result = $subscriptionManager->subscribe($email, $additionalData);
            sendJsonResponse($result);
            break;
            
        case 'GET':
            // Endpoint per test e statistiche
            $action = $_GET['action'] ?? 'test';
            
            switch ($action) {
                case 'test':
                    $result = $subscriptionManager->testConfiguration();
                    break;
                    
                case 'stats':
                    $result = $subscriptionManager->getLocalStats();
                    break;
                    
                case 'cleanup':
                    $result = $subscriptionManager->cleanupDuplicates();
                    break;
                    
                default:
                    sendErrorResponse('Azione non riconosciuta', 400);
            }
            
            sendJsonResponse($result);
            break;
            
        default:
            sendErrorResponse('Metodo HTTP non supportato', 405);
    }
    
} catch (Exception $e) {
    error_log('Errore generale newsletter API: ' . $e->getMessage());
    sendErrorResponse('Errore interno del server', 500);
}
?>
