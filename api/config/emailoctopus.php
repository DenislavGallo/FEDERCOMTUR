<?php
/**
 * Configurazione EmailOctopus
 * ===========================
 * Gestisce la configurazione e connessione con EmailOctopus API
 */

// Configurazione EmailOctopus - API v2 con Bearer Authentication
define('EMAILOCTOPUS_API_TOKEN', 'eo_fa8d6ddc9d71ab2288c57e9aaa5cb90906fb22e17d7bea51dd75a401ad884281');
define('EMAILOCTOPUS_API_URL', 'https://api.emailoctopus.com'); // Nuovo endpoint API v2
define('EMAILOCTOPUS_LIST_ID', '3bada182-8a8a-11f0-b920-71a7ef473c68'); // Lista "Audience"

// Configurazione generale
define('NEWSLETTER_DOUBLE_OPTIN', true); // true = PENDING, false = SUBSCRIBED
define('NEWSLETTER_DEFAULT_TAGS', ['website', 'federcomtur-est-europa']);

/**
 * Classe per gestire le operazioni EmailOctopus
 */
class EmailOctopusManager {
    private $apiToken;
    private $apiUrl;
    private $listId;
    private $doubleOptIn;
    private $defaultTags;
    
    public function __construct($listId = null) {
        $this->apiToken = EMAILOCTOPUS_API_TOKEN;
        $this->apiUrl = EMAILOCTOPUS_API_URL;
        $this->listId = $listId ?? EMAILOCTOPUS_LIST_ID;
        $this->doubleOptIn = NEWSLETTER_DOUBLE_OPTIN;
        $this->defaultTags = NEWSLETTER_DEFAULT_TAGS;
        
        // Validazione configurazione
        if (empty($this->apiToken)) {
            throw new Exception('EmailOctopus API token non configurato');
        }
    }
    
    /**
     * Aggiunge un contatto alla lista
     */
    public function addSubscriber($email, $fields = [], $tags = [], $status = null) {
        try {
            // Validazione email
            if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
                return [
                    'success' => false,
                    'error' => 'Indirizzo email non valido'
                ];
            }
            
            // Controlla se la lista è configurata
            if (empty($this->listId)) {
                return [
                    'success' => false,
                    'error' => 'Lista EmailOctopus non configurata'
                ];
            }
            
            // Prepara i dati (senza api_key, ora usa Bearer auth)
            $postData = [
                'email_address' => $email,
                'fields' => $fields,
                'tags' => array_merge($this->defaultTags, $tags)
            ];
            
            // Determina lo status - EmailOctopus v2 usa valori diversi
            if ($status === null) {
                // Per API v2, usa 'subscribed' (lowercase) invece di 'SUBSCRIBED'
                $postData['status'] = $this->doubleOptIn ? 'pending' : 'subscribed';
            } else {
                $postData['status'] = strtolower($status);
            }
            
            // Effettua la chiamata API
            $url = $this->apiUrl . '/lists/' . $this->listId . '/contacts';
            $response = $this->makeApiCall($url, $postData);
            
            if ($response['success']) {
                return [
                    'success' => true,
                    'message' => $this->doubleOptIn ? 
                        'Iscrizione in attesa di conferma. Controlla la tua email!' : 
                        'Iscrizione completata con successo!',
                    'contact_id' => $response['data']['id'] ?? null,
                    'status' => $response['data']['status'] ?? $postData['status']
                ];
            } else {
                return [
                    'success' => false,
                    'error' => $response['error'],
                    'response' => $response['response'] ?? null,
                    'raw_response' => $response['raw_response'] ?? null
                ];
            }
            
        } catch (Exception $e) {
            error_log('Errore EmailOctopus addSubscriber: ' . $e->getMessage());
            return [
                'success' => false,
                'error' => 'Errore interno durante l\'iscrizione'
            ];
        }
    }
    
    /**
     * Ottiene informazioni sulla lista
     */
    public function getListInfo() {
        try {
            if (empty($this->listId)) {
                return [
                    'success' => false,
                    'error' => 'Lista non configurata'
                ];
            }
            
            $url = $this->apiUrl . '/lists/' . $this->listId;
            $response = $this->makeApiCall($url, null, 'GET');
            
            return $response;
            
        } catch (Exception $e) {
            error_log('Errore EmailOctopus getListInfo: ' . $e->getMessage());
            return [
                'success' => false,
                'error' => 'Errore nel recupero informazioni lista'
            ];
        }
    }
    
    /**
     * Ottiene tutte le liste disponibili
     */
    public function getLists() {
        try {
            $url = $this->apiUrl . '/lists';
            $response = $this->makeApiCall($url, null, 'GET');
            
            return $response;
            
        } catch (Exception $e) {
            error_log('Errore EmailOctopus getLists: ' . $e->getMessage());
            return [
                'success' => false,
                'error' => 'Errore nel recupero liste'
            ];
        }
    }
    
    /**
     * Effettua chiamata API con cURL e retry logic
     */
    private function makeApiCall($url, $data = null, $method = 'POST', $retryCount = 0) {
        $curl = curl_init();
        
        // Configurazione base cURL
        $curlOptions = [
            CURLOPT_URL => $url,
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_TIMEOUT => 30,
            CURLOPT_FOLLOWLOCATION => true,
            CURLOPT_USERAGENT => 'FederComTur-Website/1.0',
            CURLOPT_HTTPHEADER => [
                'Content-Type: application/json',
                'Accept: application/json',
                'Authorization: Bearer ' . $this->apiToken
            ]
        ];
        
        // Gestione SSL - disabilita per localhost/sviluppo
        $isLocalhost = (strpos($_SERVER['HTTP_HOST'] ?? 'localhost', 'localhost') !== false) || 
                      (defined('ENVIRONMENT') && ENVIRONMENT === 'development');
        
        if ($isLocalhost) {
            $curlOptions[CURLOPT_SSL_VERIFYPEER] = false;
            $curlOptions[CURLOPT_SSL_VERIFYHOST] = false;
        } else {
            $curlOptions[CURLOPT_SSL_VERIFYPEER] = true;
        }
        
        curl_setopt_array($curl, $curlOptions);
        
        // Configurazione metodo
        if ($method === 'POST' && $data !== null) {
            curl_setopt($curl, CURLOPT_POST, true);
            curl_setopt($curl, CURLOPT_POSTFIELDS, json_encode($data));
        }
        
        $response = curl_exec($curl);
        $httpCode = curl_getinfo($curl, CURLINFO_HTTP_CODE);
        $error = curl_error($curl);
        
        
        curl_close($curl);
        
        // Gestione errori cURL
        if ($error) {
            return [
                'success' => false,
                'error' => 'Errore di connessione: ' . $error
            ];
        }
        
        // Decodifica risposta
        $responseData = json_decode($response, true);
        
        // Gestione codici HTTP con retry logic
        if ($httpCode >= 200 && $httpCode < 300) {
            return [
                'success' => true,
                'data' => $responseData,
                'http_code' => $httpCode
            ];
        } else {
            // Gestione retry per errori temporanei
            if ($this->shouldRetry($httpCode, $retryCount)) {
                $waitTime = $this->calculateBackoff($retryCount);
                error_log("EmailOctopus retry #" . ($retryCount + 1) . " after {$waitTime}s for HTTP $httpCode");
                sleep($waitTime);
                return $this->makeApiCall($url, $data, $method, $retryCount + 1);
            }
            
            $errorMessage = 'Errore HTTP ' . $httpCode;
            
            // Estrai messaggio di errore da EmailOctopus se disponibile
            if (isset($responseData['error'])) {
                if (isset($responseData['error']['message'])) {
                    $errorMessage = $responseData['error']['message'];
                } elseif (is_string($responseData['error'])) {
                    $errorMessage = $responseData['error'];
                }
            }
            
            return [
                'success' => false,
                'error' => $errorMessage,
                'http_code' => $httpCode,
                'response' => $responseData,
                'raw_response' => $response,
                'retry_attempted' => $retryCount > 0
            ];
        }
    }
    
    /**
     * Valida la configurazione
     */
    public function validateConfig() {
        $errors = [];
        
        if (empty($this->apiToken)) {
            $errors[] = 'API Token mancante';
        }
        
        if (empty($this->listId)) {
            $errors[] = 'List ID mancante';
        }
        
        return [
            'valid' => empty($errors),
            'errors' => $errors
        ];
    }
    
    /**
     * Determina se un errore HTTP deve essere ritentato
     */
    private function shouldRetry($httpCode, $retryCount) {
        $maxRetries = 3;
        
        if ($retryCount >= $maxRetries) {
            return false;
        }
        
        // Retry per errori temporanei
        $retryableErrors = [
            429, // Rate limit
            500, // Server error
            502, // Bad gateway
            503, // Service unavailable
            504  // Gateway timeout
        ];
        
        return in_array($httpCode, $retryableErrors);
    }
    
    /**
     * Calcola tempo attesa exponential backoff
     */
    private function calculateBackoff($retryCount) {
        // Exponential backoff: 1s, 2s, 4s
        return min(pow(2, $retryCount), 8);
    }

    /**
     * Test connessione EmailOctopus
     */
    public function testConnection() {
        try {
            $lists = $this->getLists();
            
            if ($lists['success']) {
                return [
                    'success' => true,
                    'message' => 'Connessione EmailOctopus funzionante',
                    'lists_count' => count($lists['data']['data'] ?? [])
                ];
            } else {
                return [
                    'success' => false,
                    'error' => 'Test connessione fallito: ' . $lists['error']
                ];
            }
            
        } catch (Exception $e) {
            return [
                'success' => false,
                'error' => 'Errore test connessione: ' . $e->getMessage()
            ];
        }
    }
}

/**
 * Funzioni di utilità per EmailOctopus
 */

/**
 * Crea istanza EmailOctopusManager con gestione errori
 */
function getEmailOctopusManager($listId = null) {
    try {
        return new EmailOctopusManager($listId);
    } catch (Exception $e) {
        error_log('Errore creazione EmailOctopusManager: ' . $e->getMessage());
        return null;
    }
}

/**
 * Sanitizza dati per EmailOctopus
 */
function sanitizeEmailOctopusData($data) {
    $sanitized = [];
    
    foreach ($data as $key => $value) {
        if (is_string($value)) {
            $sanitized[$key] = htmlspecialchars(strip_tags(trim($value)));
        } else {
            $sanitized[$key] = $value;
        }
    }
    
    return $sanitized;
}

/**
 * Estrae nome e cognome dall'indirizzo email
 */
function extractNameFromEmail($email) {
    $email = strtolower(trim($email));
    $localPart = explode('@', $email)[0];
    
    // Pattern comuni per nomi negli email italiani/europei
    $patterns = [
        // mario.rossi, giovanni.verdi
        '/^([a-z]+)\.([a-z]+)$/',
        // mario_rossi, giovanni_verdi  
        '/^([a-z]+)_([a-z]+)$/',
        // mariorossi (difficile da separare, prova con vocali)
        '/^([a-z]{3,})([a-z]{3,})$/',
        // m.rossi, g.verdi
        '/^([a-z])\.([a-z]+)$/',
        // mario.r, giovanni.v
        '/^([a-z]+)\.([a-z])$/',
        // mario123, giovanni456 (rimuovi numeri)
        '/^([a-z]+)\d*$/'
    ];
    
    foreach ($patterns as $pattern) {
        if (preg_match($pattern, $localPart, $matches)) {
            switch ($pattern) {
                case '/^([a-z]+)\.([a-z]+)$/':
                case '/^([a-z]+)_([a-z]+)$/':
                    return [
                        'first_name' => ucfirst($matches[1]),
                        'last_name' => ucfirst($matches[2]),
                        'confidence' => 'high'
                    ];
                    
                case '/^([a-z])\.([a-z]+)$/':
                    return [
                        'first_name' => strtoupper($matches[1]),
                        'last_name' => ucfirst($matches[2]),
                        'confidence' => 'medium'
                    ];
                    
                case '/^([a-z]+)\.([a-z])$/':
                    return [
                        'first_name' => ucfirst($matches[1]),
                        'last_name' => strtoupper($matches[2]),
                        'confidence' => 'medium'
                    ];
                    
                case '/^([a-z]+)\d*$/':
                    return [
                        'first_name' => ucfirst($matches[1]),
                        'last_name' => '',
                        'confidence' => 'low'
                    ];
            }
        }
    }
    
    // Nomi composti più comuni in Italia
    $commonNames = [
        'mariateresa' => ['Maria', 'Teresa'],
        'mariagrazia' => ['Maria', 'Grazia'],
        'giuseppina' => ['Giuseppina', ''],
        'francesco' => ['Francesco', ''],
        'alessandro' => ['Alessandro', ''],
        'antonietta' => ['Antonietta', '']
    ];
    
    if (isset($commonNames[$localPart])) {
        return [
            'first_name' => $commonNames[$localPart][0],
            'last_name' => $commonNames[$localPart][1],
            'confidence' => 'medium'
        ];
    }
    
    return [
        'first_name' => '',
        'last_name' => '',
        'confidence' => 'none'
    ];
}

/**
 * Formatta campi per EmailOctopus con auto-estrazione da email
 */
function formatEmailOctopusFields($data, $email = null) {
    $fields = [];
    
    // Usa dati forniti se disponibili
    if (isset($data['first_name']) && !empty($data['first_name'])) {
        $fields['FirstName'] = $data['first_name'];
    }
    
    if (isset($data['last_name']) && !empty($data['last_name'])) {
        $fields['LastName'] = $data['last_name'];
    }
    
    if (isset($data['company']) && !empty($data['company'])) {
        $fields['Company'] = $data['company'];
    }
    
    // Se nome/cognome mancanti e email disponibile, prova estrazione
    if ($email && (empty($fields['FirstName']) || empty($fields['LastName']))) {
        $extracted = extractNameFromEmail($email);
        
        if ($extracted['confidence'] !== 'none') {
            if (empty($fields['FirstName']) && !empty($extracted['first_name'])) {
                $fields['FirstName'] = $extracted['first_name'];
                $fields['_ExtractedFirstName'] = true; // Debug info
            }
            
            if (empty($fields['LastName']) && !empty($extracted['last_name'])) {
                $fields['LastName'] = $extracted['last_name'];
                $fields['_ExtractedLastName'] = true; // Debug info
            }
            
            $fields['_ExtractionConfidence'] = $extracted['confidence'];
        }
    }
    
    return $fields;
}
?>
