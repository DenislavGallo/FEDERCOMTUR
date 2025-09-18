-- =============================================
-- Database di Prova FederComTur - Notizie
-- =============================================

-- Crea il database
CREATE DATABASE IF NOT EXISTS federcomtur_news 
CHARACTER SET utf8mb4 
COLLATE utf8mb4_unicode_ci;

USE federcomtur_news;

-- =============================================
-- Tabella delle Categorie
-- =============================================
CREATE TABLE IF NOT EXISTS categories (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(50) NOT NULL UNIQUE,
    label VARCHAR(100) NOT NULL,
    color VARCHAR(7) NOT NULL,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- =============================================
-- Tabella delle Notizie
-- =============================================
CREATE TABLE IF NOT EXISTS news (
    id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    slug VARCHAR(255) NOT NULL UNIQUE,
    excerpt TEXT NOT NULL,
    content LONGTEXT NOT NULL,
    category_id INT NOT NULL,
    author VARCHAR(100) NOT NULL,
    date_published DATE NOT NULL,
    date_formatted VARCHAR(50) NOT NULL,
    read_time VARCHAR(20) NOT NULL,
    featured BOOLEAN DEFAULT FALSE,
    tags JSON,
    deadline DATE NULL,
    event_date DATE NULL,
    location VARCHAR(255) NULL,
    event_type VARCHAR(50) NULL,
    status ENUM('draft', 'published', 'archived') DEFAULT 'published',
    views INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (category_id) REFERENCES categories(id),
    INDEX idx_category (category_id),
    INDEX idx_published (date_published),
    INDEX idx_featured (featured),
    INDEX idx_status (status)
);

-- =============================================
-- Inserimento Categorie
-- =============================================
INSERT INTO categories (name, label, color, description) VALUES
('normative', 'Normative', '#dc2626', 'Aggiornamenti normativi e legislativi'),
('bandi', 'Bandi', '#16a34a', 'Opportunità di finanziamento e bandi'),
('eventi', 'Eventi', '#7c3aed', 'Eventi, convegni e workshop'),
('mercato', 'Mercato', '#ea580c', 'Analisi e trend di mercato');

-- =============================================
-- Inserimento 12 Notizie di Prova
-- =============================================

-- Notizia 1
INSERT INTO news (title, slug, excerpt, content, category_id, author, date_published, date_formatted, read_time, featured, tags) VALUES
('Decreto Credito d\'Imposta: Nuove Opportunità per PMI del Turismo', 
'decreto-credito-imposta-pmi-turismo-2024', 
'Il Ministero del Turismo ha pubblicato i dettagli operativi per il credito d\'imposta del 65% per investimenti in digitalizzazione e sostenibilità. Risorse per 200 milioni nel biennio 2025-2026.',
'Con la Circolare n. 47/E dell\'Agenzia delle Entrate sono state definite le modalità operative per accedere al credito d\'imposta turismo. Le PMI del settore possono beneficiare di un sostegno fino al 65% per investimenti in digitalizzazione, efficientamento energetico e sostenibilità ambientale. Il decreto prevede uno stanziamento di 200 milioni di euro distribuiti nel biennio 2025-2026, con priorità per le imprese che dimostrano maggiore innovazione nei processi digitali e nella riduzione dell\'impatto ambientale.',
1, 'Ufficio Legislativo FederComTur', '2024-12-18', '18 Dicembre 2024', '6 min', TRUE, 
JSON_ARRAY('credito-imposta', 'digitalizzazione', 'turismo', 'ministero'));

-- Notizia 2
INSERT INTO news (title, slug, excerpt, content, category_id, author, date_published, date_formatted, read_time, featured, tags, deadline) VALUES
('Bando PNRR Competitività PMI: 850 Milioni per Commercio e Servizi', 
'bando-pnrr-competitivita-pmi-2024', 
'Aperto il bando del MiSE per progetti di innovazione e competitività. Contributi a fondo perduto fino a 500.000 euro per impresa. Scadenza presentazione domande: 28 febbraio 2025.',
'Il Ministero delle Imprese e del Made in Italy ha pubblicato l\'attesissimo bando PNRR dedicato alla competitività delle PMI. L\'iniziativa mette a disposizione 850 milioni di euro per sostenere progetti di innovazione tecnologica, digitalizzazione dei processi e internazionalizzazione. Ogni impresa può richiedere contributi a fondo perduto fino a 500.000 euro, con copertura fino all\'80% delle spese ammissibili. Particolare attenzione è riservata ai progetti che integrano sostenibilità ambientale e innovazione digitale.',
2, 'Area Finanziamenti', '2024-12-15', '15 Dicembre 2024', '8 min', TRUE, 
JSON_ARRAY('pnrr', 'mise', 'competitività', 'finanziamenti'), '2025-02-28');

-- Notizia 3
INSERT INTO news (title, slug, excerpt, content, category_id, author, date_published, date_formatted, read_time, featured, tags, event_date, location) VALUES
('Forum Nazionale PMI 2025: "Innovazione e Crescita Sostenibile"', 
'forum-nazionale-pmi-2025-milano', 
'Il 20-21 marzo 2025 a Milano si terrà il Forum Nazionale PMI organizzato da FederComTur. Attesi 500 imprenditori e 50 relatori internazionali. Early bird fino al 31 gennaio.',
'FieraMilanoCity ospiterà la quinta edizione del Forum Nazionale PMI, l\'evento di riferimento per piccole e medie imprese del settore commercio, turismo e servizi. Due giorni di confronto su innovazione, sostenibilità e crescita internazionale, con la partecipazione di oltre 500 imprenditori e 50 relatori di calibro internazionale. Il programma include workshop tematici, sessioni di networking e la premiazione delle eccellenze imprenditoriali italiane.',
3, 'Segreteria Organizzativa', '2024-12-12', '12 Dicembre 2024', '5 min', FALSE, 
JSON_ARRAY('forum', 'milano', 'networking', 'innovazione'), '2025-03-20', 'Milano, FieraMilanoCity');

-- Notizia 4
INSERT INTO news (title, slug, excerpt, content, category_id, author, date_published, date_formatted, read_time, featured, tags) VALUES
('Osservatorio Mercato: Commercio +7,2% nel 2024, Turismo +15,8%', 
'osservatorio-mercato-2024-crescita', 
'I dati dell\'Osservatorio FederComTur confermano la crescita sostenuta dei settori rappresentati. Il turismo traina la ripresa con performance superiori al periodo pre-pandemia.',
'L\'Osservatorio Economico FederComTur presenta i dati definitivi sull\'andamento dei settori commercio, turismo e servizi per l\'anno 2024. Il commercio al dettaglio registra una crescita del 7,2% rispetto al 2023, mentre il turismo segna un eccezionale +15,8%, superando i livelli pre-pandemia. I servizi alle imprese mostrano una crescita del 5,4%, confermando la ripresa economica del Paese. Particolarmente positivi i dati sull\'occupazione, con 120.000 nuovi posti di lavoro creati nel settore.',
4, 'Centro Studi Economici', '2024-12-10', '10 Dicembre 2024', '7 min', FALSE, 
JSON_ARRAY('osservatorio', 'crescita', 'dati', 'economia'));

-- Notizia 5
INSERT INTO news (title, slug, excerpt, content, category_id, author, date_published, date_formatted, read_time, featured, tags) VALUES
('Accordo Quadro Confturismo-FederComTur per Rappresentanza Unitaria', 
'accordo-confturismo-federcomtur-2024', 
'Siglato accordo strategico per rafforzare la rappresentanza delle imprese turistiche presso le istituzioni nazionali ed europee. Focus su sostenibilità e competitività internazionale.',
'I presidenti di Confturismo e FederComTur hanno sottoscritto un accordo quadro che punta a unificare la voce del settore turistico italiano. L\'intesa prevede azioni coordinate per la rappresentanza presso le istituzioni, la promozione di politiche favorevoli alle PMI turistiche e lo sviluppo di progetti comuni per la sostenibilità ambientale e la digitalizzazione. L\'accordo rafforza la posizione negoziale del settore turistico italiano in ambito europeo.',
1, 'Presidenza', '2024-12-08', '8 Dicembre 2024', '4 min', FALSE, 
JSON_ARRAY('confturismo', 'accordo', 'rappresentanza', 'turismo'));

-- Notizia 6
INSERT INTO news (title, slug, excerpt, content, category_id, author, date_published, date_formatted, read_time, featured, tags, event_date, event_type) VALUES
('Webinar Gratuito: "Export Digitale per PMI del Made in Italy"', 
'webinar-export-digitale-made-in-italy-2025', 
'Il 16 gennaio 2025 webinar gratuito con ICE-Agenzia e Google per scoprire strumenti e strategie per l\'internazionalizzazione digitale delle PMI italiane.',
'In collaborazione con ICE-Agenzia per la promozione all\'estero e l\'internazionalizzazione delle imprese italiane e Google Italia, FederComTur organizza un webinar gratuito dedicato all\'export digitale. L\'evento illustrerà le migliori strategie per l\'internazionalizzazione online, con focus su e-commerce, marketing digitale e piattaforme di vendita internazionali. Partecipazione gratuita previa registrazione.',
3, 'Ufficio Internazionalizzazione', '2024-12-05', '5 Dicembre 2024', '3 min', FALSE, 
JSON_ARRAY('export', 'digitale', 'ice', 'made-in-italy'), '2025-01-16', 'webinar');

-- Notizia 7
INSERT INTO news (title, slug, excerpt, content, category_id, author, date_published, date_formatted, read_time, featured, tags, deadline) VALUES
('Contributi Regione Lombardia per Digitalizzazione Imprese Commerciali', 
'contributi-lombardia-digitalizzazione-commercio-2024', 
'Stanziati 15 milioni per sostenere la transizione digitale delle PMI commerciali lombarde. Contributi fino a 25.000 euro per progetti di e-commerce e automazione.',
'La Regione Lombardia ha approvato il nuovo bando per la digitalizzazione delle imprese commerciali, con uno stanziamento di 15 milioni di euro. Le PMI possono richiedere contributi fino a 25.000 euro per progetti di sviluppo e-commerce, implementazione di sistemi gestionali digitali, automazione dei processi e marketing digitale. Il bando è rivolto a imprese con sede in Lombardia e fatturato non superiore a 2 milioni di euro.',
2, 'Ufficio Regionale Lombardia', '2024-12-03', '3 Dicembre 2024', '6 min', FALSE, 
JSON_ARRAY('lombardia', 'digitalizzazione', 'e-commerce', 'contributi'), '2025-01-31');

-- Notizia 8
INSERT INTO news (title, slug, excerpt, content, category_id, author, date_published, date_formatted, read_time, featured, tags) VALUES
('Nuova Direttiva UE sui Servizi Digitali: Impatti per le PMI Italiane', 
'direttiva-ue-servizi-digitali-pmi-2024', 
'Entrata in vigore la nuova normativa europea sui servizi digitali. Obblighi di trasparenza e responsabilità per piattaforme online e marketplace utilizzati dalle PMI.',
'La Direttiva UE sui Servizi Digitali (DSA) introduce nuovi obblighi per le piattaforme online che ospitano contenuti o facilitano transazioni commerciali. Le PMI che utilizzano marketplace, social media per il marketing o piattaforme e-commerce devono conoscere le nuove regole su trasparenza degli algoritmi, gestione dei contenuti illegali e protezione dei dati. FederComTur ha preparato una guida pratica per orientare le imprese associate.',
1, 'Ufficio Affari Europei', '2024-12-01', '1 Dicembre 2024', '8 min', FALSE, 
JSON_ARRAY('ue', 'servizi-digitali', 'normativa', 'piattaforme'));

-- Notizia 9
INSERT INTO news (title, slug, excerpt, content, category_id, author, date_published, date_formatted, read_time, featured, tags) VALUES
('Trend 2025: Sostenibilità e Tecnologia Guidano la Ripresa del Turismo', 
'trend-2025-sostenibilita-turismo-tecnologia', 
'Il rapporto annuale di FederComTur evidenzia le principali tendenze per il 2025: turismo sostenibile, esperienze personalizzate e integrazione AI nei servizi turistici.',
'Il Rapporto Tendenze Turismo 2025 di FederComTur rivela come sostenibilità ambientale e innovazione tecnologica stiano ridefinendo il settore. Il 78% dei turisti sceglie destinazioni eco-friendly, mentre il 65% delle strutture ricettive ha investito in tecnologie AI per personalizzare l\'esperienza ospite. Crescono i viaggi esperienziali (+23%) e il turismo di prossimità (+18%). Le previsioni indicano una crescita del 12% per il settore nel 2025.',
4, 'Osservatorio Turismo', '2024-11-28', '28 Novembre 2024', '9 min', TRUE, 
JSON_ARRAY('trend', 'sostenibilità', 'ai', 'turismo-2025'));

-- Notizia 10
INSERT INTO news (title, slug, excerpt, content, category_id, author, date_published, date_formatted, read_time, featured, tags, event_date, location) VALUES
('Convegno "Commercio di Vicinato e Innovazione Digitale"', 
'convegno-commercio-vicinato-innovazione-roma-2025', 
'Il 14 febbraio 2025 a Roma si terrà il convegno nazionale sul futuro del commercio di vicinato nell\'era digitale. Interverranno ministri, sindaci e imprenditori.',
'La Camera di Commercio di Roma e FederComTur organizzano il convegno nazionale "Commercio di Vicinato e Innovazione Digitale" per discutere le sfide e le opportunità del retail fisico nell\'era digitale. L\'evento vedrà la partecipazione del Ministro delle Imprese, sindaci delle principali città italiane e imprenditori innovativi. Focus su omnicanalità, customer experience e rigenerazione urbana attraverso il commercio di prossimità.',
3, 'Segreteria Eventi', '2024-11-25', '25 Novembre 2024', '4 min', FALSE, 
JSON_ARRAY('commercio', 'vicinato', 'innovazione', 'roma'), '2025-02-14', 'Roma, Camera di Commercio');

-- Notizia 11
INSERT INTO news (title, slug, excerpt, content, category_id, author, date_published, date_formatted, read_time, featured, tags, deadline) VALUES
('Bando Transizione Ecologica: 50 Milioni per PMI del Sud Italia', 
'bando-transizione-ecologica-sud-italia-2024', 
'Il Ministero dell\'Ambiente lancia il nuovo bando per la transizione ecologica delle PMI meridionali. Incentivi fino al 70% per progetti green e economia circolare.',
'Il Ministero dell\'Ambiente e della Sicurezza Energetica ha pubblicato il bando "Transizione Ecologica Sud" con uno stanziamento di 50 milioni di euro. Le PMI delle regioni del Mezzogiorno possono accedere a incentivi fino al 70% per progetti di efficientamento energetico, economia circolare, mobilità sostenibile e riduzione delle emissioni. Priorità per progetti che creano occupazione giovanile e femminile nel settore green.',
2, 'Ufficio Ambiente e Sostenibilità', '2024-11-22', '22 Novembre 2024', '7 min', FALSE, 
JSON_ARRAY('transizione-ecologica', 'sud-italia', 'green', 'economia-circolare'), '2025-03-15');

-- Notizia 12
INSERT INTO news (title, slug, excerpt, content, category_id, author, date_published, date_formatted, read_time, featured, tags) VALUES
('Analisi Mercato: E-commerce Italiano Cresce del 18% nel 2024', 
'analisi-ecommerce-italiano-crescita-2024', 
'Il Politecnico di Milano certifica la crescita record dell\'e-commerce italiano. Fashion e food guidano la crescita, mobile commerce al 65% del totale.',
'L\'Osservatorio eCommerce B2C del Politecnico di Milano, in collaborazione con FederComTur, presenta i dati definitivi del 2024. L\'e-commerce italiano raggiunge 48,1 miliardi di euro (+18% vs 2023), con fashion e food & grocery che guidano la crescita. Il mobile commerce rappresenta il 65% degli acquisti online, mentre cresce l\'integrazione omnicanale tra negozi fisici e digitali. Le PMI italiane che hanno investito nell\'online mostrano performance superiori del 25% rispetto ai competitor tradizionali.',
4, 'Centro Studi Digitali', '2024-11-20', '20 Novembre 2024', '6 min', TRUE, 
JSON_ARRAY('ecommerce', 'crescita', 'mobile', 'omnicanale'));

-- =============================================
-- Viste Utili per Query Frequenti
-- =============================================

-- Vista per notizie con categoria
CREATE VIEW news_with_category AS
SELECT 
    n.id,
    n.title,
    n.slug,
    n.excerpt,
    n.content,
    n.author,
    n.date_published,
    n.date_formatted,
    n.read_time,
    n.featured,
    n.tags,
    n.deadline,
    n.event_date,
    n.location,
    n.event_type,
    n.views,
    c.name as category_name,
    c.label as category_label,
    c.color as category_color
FROM news n
JOIN categories c ON n.category_id = c.id
WHERE n.status = 'published'
ORDER BY n.date_published DESC;

-- Vista per notizie in evidenza
CREATE VIEW featured_news AS
SELECT * FROM news_with_category 
WHERE featured = TRUE
ORDER BY date_published DESC;

-- Vista per statistiche categorie
CREATE VIEW category_stats AS
SELECT 
    c.name,
    c.label,
    c.color,
    COUNT(n.id) as total_news,
    COUNT(CASE WHEN n.featured = TRUE THEN 1 END) as featured_count,
    MAX(n.date_published) as latest_news_date
FROM categories c
LEFT JOIN news n ON c.id = n.category_id AND n.status = 'published'
GROUP BY c.id, c.name, c.label, c.color;

-- =============================================
-- Stored Procedures Utili
-- =============================================

DELIMITER //

-- Procedura per ottenere notizie con paginazione
CREATE PROCEDURE GetNewsPaginated(
    IN category_filter VARCHAR(50),
    IN page_num INT,
    IN page_size INT
)
BEGIN
    DECLARE offset_val INT DEFAULT 0;
    SET offset_val = (page_num - 1) * page_size;
    
    IF category_filter = 'all' OR category_filter IS NULL THEN
        SELECT * FROM news_with_category
        ORDER BY date_published DESC
        LIMIT page_size OFFSET offset_val;
    ELSE
        SELECT * FROM news_with_category
        WHERE category_name = category_filter
        ORDER BY date_published DESC
        LIMIT page_size OFFSET offset_val;
    END IF;
END //

-- Procedura per incrementare le visualizzazioni
CREATE PROCEDURE IncrementNewsViews(IN news_id INT)
BEGIN
    UPDATE news 
    SET views = views + 1 
    WHERE id = news_id;
END //

DELIMITER ;

-- =============================================
-- Indici per Performance
-- =============================================

-- Indici per ricerche full-text
ALTER TABLE news ADD FULLTEXT(title, excerpt, content);

-- Indici composti per query frequenti
CREATE INDEX idx_category_date ON news(category_id, date_published DESC);
CREATE INDEX idx_featured_date ON news(featured, date_published DESC);
CREATE INDEX idx_status_date ON news(status, date_published DESC);

-- =============================================
-- Query di Test
-- =============================================

-- Test: Tutte le notizie con categoria
-- SELECT * FROM news_with_category LIMIT 5;

-- Test: Notizie per categoria
-- SELECT * FROM news_with_category WHERE category_name = 'bandi' LIMIT 3;

-- Test: Notizie in evidenza
-- SELECT * FROM featured_news;

-- Test: Statistiche categorie
-- SELECT * FROM category_stats;

-- Test: Paginazione
-- CALL GetNewsPaginated('all', 1, 6);

-- =============================================
-- Inserimento dati di esempio completato
-- =============================================

SELECT 'Database FederComTur News creato con successo!' as status;
SELECT COUNT(*) as total_news FROM news;
SELECT COUNT(*) as total_categories FROM categories;
