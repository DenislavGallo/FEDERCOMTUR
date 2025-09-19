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
            
            // Determina lo status
            if ($status === null) {
                $postData['status'] = $this->doubleOptIn ? 'PENDING' : 'SUBSCRIBED';
            } else {
                $postData['status'] = $status;
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
                    'error' => $response['error']
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
     * Effettua chiamata API con cURL
     */
    private function makeApiCall($url, $data = null, $method = 'POST') {
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
        
        // Gestione SSL per ambiente di sviluppo
        if (defined('ENVIRONMENT') && ENVIRONMENT === 'development') {
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
        
        // Gestione codici HTTP
        if ($httpCode >= 200 && $httpCode < 300) {
            return [
                'success' => true,
                'data' => $responseData,
                'http_code' => $httpCode
            ];
        } else {
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
                'response' => $responseData
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
 * Formatta campi per EmailOctopus
 */
function formatEmailOctopusFields($data) {
    $fields = [];
    
    // Mappa campi comuni
    if (isset($data['first_name'])) {
        $fields['FirstName'] = $data['first_name'];
    }
    
    if (isset($data['last_name'])) {
        $fields['LastName'] = $data['last_name'];
    }
    
    if (isset($data['company'])) {
        $fields['Company'] = $data['company'];
    }
    
    return $fields;
}
?>
