<?php
/**
 * API per Dati Notizie - FederComTur
 * ==================================
 * Gestisce tutte le query per le card notizie
 */

require_once 'config/database.php';

/**
 * Classe per gestire i dati delle notizie
 */
class NewsDataManager {
    private $db;
    private $conn;
    
    public function __construct() {
        $this->db = Database::getInstance();
        $this->conn = $this->db->getConnection();
    }
    
    /**
     * Ottiene notizie per le card con paginazione
     */
    public function getNewsCards($params = []) {
        $page = isset($params['page']) ? (int)$params['page'] : 1;
        $limit = isset($params['limit']) ? (int)$params['limit'] : 12;
        $category = isset($params['category']) ? sanitizeInput($params['category']) : 'all';
        $featured_only = isset($params['featured']) ? filter_var($params['featured'], FILTER_VALIDATE_BOOLEAN) : false;
        
        $offset = ($page - 1) * $limit;
        
        // Query ottimizzata per card
        $query = "
            SELECT 
                n.id,
                n.title,
                n.excerpt,
                n.author,
                n.date_formatted,
                n.read_time,
                n.featured,
                n.tags,
                n.deadline,
                n.event_date,
                n.location,
                n.event_type,
                n.views,
                c.name as category,
                c.label as category_label,
                c.color as category_color,
                CASE 
                    WHEN n.event_date IS NOT NULL THEN 'evento'
                    WHEN n.deadline IS NOT NULL THEN 'scadenza'
                    ELSE 'normale'
                END as card_type
            FROM news n
            JOIN categories c ON n.category_id = c.id
            WHERE n.status = 'published'
        ";
        
        $params_array = [];
        
        // Filtro categoria
        if ($category !== 'all') {
            $query .= " AND c.name = :category";
            $params_array[':category'] = $category;
        }
        
        // Filtro featured
        if ($featured_only) {
            $query .= " AND n.featured = 1";
        }
        
        $query .= " ORDER BY n.featured DESC, n.date_published DESC LIMIT :limit OFFSET :offset";
        
        try {
            $stmt = $this->conn->prepare($query);
            
            foreach ($params_array as $key => $value) {
                $stmt->bindValue($key, $value);
            }
            $stmt->bindValue(':limit', $limit, PDO::PARAM_INT);
            $stmt->bindValue(':offset', $offset, PDO::PARAM_INT);
            
            $stmt->execute();
            $news = $stmt->fetchAll();
            
            // Processa i risultati per le card
            $cards = [];
            foreach ($news as $item) {
                $cards[] = $this->formatNewsCard($item);
            }
            
            // Conta totale per paginazione
            $total_count = $this->countNewsFiltered($category, $featured_only);
            $total_pages = ceil($total_count / $limit);
            
            return [
                'success' => true,
                'data' => $cards,
                'pagination' => [
                    'current_page' => $page,
                    'total_pages' => $total_pages,
                    'total_count' => $total_count,
                    'per_page' => $limit,
                    'has_next' => $page < $total_pages,
                    'has_previous' => $page > 1
                ],
                'filters' => [
                    'category' => $category,
                    'featured_only' => $featured_only
                ]
            ];
            
        } catch (Exception $e) {
            logError('Errore nel recupero card notizie', ['error' => $e->getMessage()]);
            return [
                'success' => false,
                'error' => 'Errore nel caricamento delle notizie'
            ];
        }
    }
    
    /**
     * Formatta una notizia per la card
     */
    private function formatNewsCard($item) {
        // Decodifica tags JSON
        $tags = null;
        if (!empty($item['tags'])) {
            $decoded_tags = json_decode($item['tags'], true);
            $tags = is_array($decoded_tags) ? $decoded_tags : null;
        }
        
        // Determina icona categoria
        $category_icon = $this->getCategoryIcon($item['category']);
        
        // Formatta date speciali
        $special_date = null;
        $special_date_label = null;
        
        if ($item['event_date']) {
            $special_date = $item['event_date'];
            $special_date_label = 'Data evento';
        } elseif ($item['deadline']) {
            $special_date = $item['deadline'];
            $special_date_label = 'Scadenza';
        }
        
        return [
            'id' => (int)$item['id'],
            'title' => $item['title'],
            'excerpt' => $item['excerpt'],
            'author' => $item['author'],
            'date_formatted' => $item['date_formatted'],
            'read_time' => $item['read_time'],
            'featured' => (bool)$item['featured'],
            'tags' => $tags,
            'views' => (int)$item['views'],
            'category' => [
                'name' => $item['category'],
                'label' => $item['category_label'],
                'color' => $item['category_color'],
                'icon' => $category_icon
            ],
            'card_type' => $item['card_type'],
            'special_date' => $special_date,
            'special_date_label' => $special_date_label,
            'location' => $item['location'],
            'event_type' => $item['event_type'],
            'url' => "notizie.html?id=" . $item['id']
        ];
    }
    
    /**
     * Conta notizie filtrate
     */
    private function countNewsFiltered($category, $featured_only) {
        $query = "
            SELECT COUNT(*) as total_count
            FROM news n
            JOIN categories c ON n.category_id = c.id
            WHERE n.status = 'published'
        ";
        
        $params_array = [];
        
        if ($category !== 'all') {
            $query .= " AND c.name = :category";
            $params_array[':category'] = $category;
        }
        
        if ($featured_only) {
            $query .= " AND n.featured = 1";
        }
        
        try {
            $stmt = $this->conn->prepare($query);
            
            foreach ($params_array as $key => $value) {
                $stmt->bindValue($key, $value);
            }
            
            $stmt->execute();
            $result = $stmt->fetch();
            
            return (int)$result['total_count'];
            
        } catch (Exception $e) {
            logError('Errore nel conteggio notizie', ['error' => $e->getMessage()]);
            return 0;
        }
    }
    
    /**
     * Ottiene singola notizia completa
     */
    public function getSingleNews($id) {
        $query = "
            SELECT 
                n.*,
                c.name as category,
                c.label as category_label,
                c.color as category_color,
                c.description as category_description
            FROM news n
            JOIN categories c ON n.category_id = c.id
            WHERE n.id = :id AND n.status = 'published'
        ";
        
        try {
            $stmt = $this->conn->prepare($query);
            $stmt->bindValue(':id', $id, PDO::PARAM_INT);
            $stmt->execute();
            
            $news = $stmt->fetch();
            
            if (!$news) {
                return [
                    'success' => false,
                    'error' => 'Notizia non trovata'
                ];
            }
            
            // Incrementa visualizzazioni
            $this->incrementViews($id);
            
            return [
                'success' => true,
                'data' => $this->formatFullNews($news)
            ];
            
        } catch (Exception $e) {
            logError('Errore nel recupero notizia singola', ['id' => $id, 'error' => $e->getMessage()]);
            return [
                'success' => false,
                'error' => 'Errore nel caricamento della notizia'
            ];
        }
    }
    
    /**
     * Formatta notizia completa
     */
    private function formatFullNews($item) {
        $tags = null;
        if (!empty($item['tags'])) {
            $decoded_tags = json_decode($item['tags'], true);
            $tags = is_array($decoded_tags) ? $decoded_tags : null;
        }
        
        return [
            'id' => (int)$item['id'],
            'title' => $item['title'],
            'slug' => $item['slug'],
            'excerpt' => $item['excerpt'],
            'content' => $item['content'],
            'author' => $item['author'],
            'date_formatted' => $item['date_formatted'],
            'read_time' => $item['read_time'],
            'featured' => (bool)$item['featured'],
            'tags' => $tags,
            'deadline' => $item['deadline'],
            'event_date' => $item['event_date'],
            'location' => $item['location'],
            'event_type' => $item['event_type'],
            'views' => (int)$item['views'] + 1, // +1 per la visualizzazione corrente
            'category' => [
                'name' => $item['category'],
                'label' => $item['category_label'],
                'color' => $item['category_color'],
                'description' => $item['category_description']
            ],
            'created_at' => $item['created_at'],
            'updated_at' => $item['updated_at']
        ];
    }
    
    /**
     * Ottiene categorie con statistiche
     */
    public function getCategories() {
        $query = "
            SELECT 
                c.id,
                c.name,
                c.label,
                c.color,
                c.description,
                COUNT(n.id) as news_count,
                COUNT(CASE WHEN n.featured = 1 THEN 1 END) as featured_count
            FROM categories c
            LEFT JOIN news n ON c.id = n.category_id AND n.status = 'published'
            GROUP BY c.id, c.name, c.label, c.color, c.description
            ORDER BY c.name
        ";
        
        try {
            $stmt = $this->conn->prepare($query);
            $stmt->execute();
            $categories = $stmt->fetchAll();
            
            return [
                'success' => true,
                'data' => $categories
            ];
            
        } catch (Exception $e) {
            logError('Errore nel recupero categorie', ['error' => $e->getMessage()]);
            return [
                'success' => false,
                'error' => 'Errore nel caricamento delle categorie'
            ];
        }
    }
    
    /**
     * Incrementa visualizzazioni
     */
    private function incrementViews($id) {
        try {
            $query = "UPDATE news SET views = views + 1 WHERE id = :id";
            $stmt = $this->conn->prepare($query);
            $stmt->bindValue(':id', $id, PDO::PARAM_INT);
            $stmt->execute();
        } catch (Exception $e) {
            logError('Errore incremento visualizzazioni', ['id' => $id, 'error' => $e->getMessage()]);
        }
    }
    
    /**
     * Ottiene icona per categoria
     */
    private function getCategoryIcon($category) {
        $icons = [
            'normative' => 'document-text',
            'bandi' => 'currency-euro',
            'eventi' => 'calendar',
            'mercato' => 'chart-line'
        ];
        
        return $icons[$category] ?? 'newspaper';
    }
    
    /**
     * Ricerca notizie
     */
    public function searchNews($search_term, $limit = 20) {
        $query = "
            SELECT 
                n.id,
                n.title,
                n.excerpt,
                n.author,
                n.date_formatted,
                n.read_time,
                n.views,
                c.name as category,
                c.label as category_label,
                c.color as category_color,
                MATCH(n.title, n.excerpt, n.content) AGAINST(:search_term IN NATURAL LANGUAGE MODE) as relevance
            FROM news n
            JOIN categories c ON n.category_id = c.id
            WHERE n.status = 'published'
                AND MATCH(n.title, n.excerpt, n.content) AGAINST(:search_term IN NATURAL LANGUAGE MODE)
            ORDER BY relevance DESC, n.date_published DESC
            LIMIT :limit
        ";
        
        try {
            $stmt = $this->conn->prepare($query);
            $stmt->bindValue(':search_term', $search_term);
            $stmt->bindValue(':limit', $limit, PDO::PARAM_INT);
            $stmt->execute();
            
            $results = $stmt->fetchAll();
            
            return [
                'success' => true,
                'data' => $results,
                'search_term' => $search_term,
                'count' => count($results)
            ];
            
        } catch (Exception $e) {
            logError('Errore nella ricerca', ['search_term' => $search_term, 'error' => $e->getMessage()]);
            return [
                'success' => false,
                'error' => 'Errore nella ricerca'
            ];
        }
    }
}

// =============================================
// GESTIONE RICHIESTE HTTP
// =============================================

try {
    $newsManager = new NewsDataManager();
    $method = $_SERVER['REQUEST_METHOD'] ?? 'GET';
    $query_params = $_GET ?? [];
    
    switch ($method) {
        case 'GET':
            if (isset($query_params['action'])) {
                switch ($query_params['action']) {
                    case 'categories':
                        $result = $newsManager->getCategories();
                        break;
                        
                    case 'search':
                        $search_term = $query_params['q'] ?? '';
                        $limit = isset($query_params['limit']) ? (int)$query_params['limit'] : 20;
                        $result = $newsManager->searchNews($search_term, $limit);
                        break;
                        
                    default:
                        sendErrorResponse('Azione non riconosciuta', 400);
                }
            } elseif (isset($query_params['id'])) {
                // Singola notizia
                $id = (int)$query_params['id'];
                $result = $newsManager->getSingleNews($id);
            } else {
                // Lista notizie per card
                $result = $newsManager->getNewsCards($query_params);
            }
            
            sendJsonResponse($result);
            break;
            
        default:
            sendErrorResponse('Metodo HTTP non supportato', 405);
    }
    
} catch (Exception $e) {
    logError('Errore generale API notizie', ['error' => $e->getMessage()]);
    sendErrorResponse('Errore interno del server', 500);
}
?>
