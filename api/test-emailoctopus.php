<?php
/**
 * Test EmailOctopus Configuration
 * ==============================
 */

require_once 'config/emailoctopus.php';

echo "<h1>🐙 Test Configurazione EmailOctopus</h1>";
echo "<style>body{font-family:Arial,sans-serif;max-width:800px;margin:0 auto;padding:20px;line-height:1.6;}h1{color:#023e8a;}h2{color:#10b981;border-bottom:2px solid #10b981;padding-bottom:5px;}pre{background:#f5f5f5;padding:10px;border-radius:5px;overflow-x:auto;}.success{color:#16a34a;}.error{color:#ef4444;}.warning{color:#f59e0b;}</style>";

// Test 1: Verifica Configurazione
echo "<h2>1. ✅ Verifica Configurazione</h2>";
echo "<strong>🔑 API Key:</strong> " . (defined('EMAILOCTOPUS_API_KEY') ? 'Configurata (' . substr(EMAILOCTOPUS_API_KEY, 0, 10) . '...)' : '<span class="error">Non configurata</span>') . "<br>";
echo "<strong>🌐 API URL:</strong> " . (defined('EMAILOCTOPUS_API_URL') ? EMAILOCTOPUS_API_URL : '<span class="error">Non configurato</span>') . "<br>";
echo "<strong>📋 List ID:</strong> " . (defined('EMAILOCTOPUS_LIST_ID') && !empty(EMAILOCTOPUS_LIST_ID) ? EMAILOCTOPUS_LIST_ID : '<span class="warning">Non configurato (normale per setup iniziale)</span>') . "<br>";
echo "<strong>📧 Double Opt-in:</strong> " . (NEWSLETTER_DOUBLE_OPTIN ? '<span class="success">Attivo</span>' : 'Disattivo') . "<br>";
echo "<strong>🏷️ Tag Predefiniti:</strong> " . implode(', ', NEWSLETTER_DEFAULT_TAGS) . "<br>";

// Test 2: Test Inizializzazione Classe
echo "<h2>2. 🔄 Test Inizializzazione</h2>";
try {
    $emailOctopus = getEmailOctopusManager();
    
    if ($emailOctopus) {
        echo "<span class='success'>✅ EmailOctopusManager creato con successo</span><br>";
        
        // Test validazione configurazione
        $validation = $emailOctopus->validateConfig();
        if ($validation['valid']) {
            echo "<span class='success'>✅ Configurazione valida</span><br>";
        } else {
            echo "<span class='error'>❌ Errori configurazione:</span><br>";
            foreach ($validation['errors'] as $error) {
                echo "&nbsp;&nbsp;• $error<br>";
            }
        }
    } else {
        echo "<span class='error'>❌ Errore nella creazione di EmailOctopusManager</span><br>";
    }
    
} catch (Exception $e) {
    echo "<span class='error'>❌ Errore: " . htmlspecialchars($e->getMessage()) . "</span><br>";
}

// Test 3: Test Connessione (solo se configurato)
echo "<h2>3. 🌐 Test Connessione EmailOctopus</h2>";
if ($emailOctopus && !empty(EMAILOCTOPUS_LIST_ID)) {
    try {
        $connectionTest = $emailOctopus->testConnection();
        
        if ($connectionTest['success']) {
            echo "<span class='success'>✅ Connessione EmailOctopus riuscita</span><br>";
            echo "<strong>📊 Liste trovate:</strong> " . $connectionTest['lists_count'] . "<br>";
        } else {
            echo "<span class='error'>❌ Test connessione fallito: " . htmlspecialchars($connectionTest['error']) . "</span><br>";
        }
        
    } catch (Exception $e) {
        echo "<span class='error'>❌ Errore test connessione: " . htmlspecialchars($e->getMessage()) . "</span><br>";
    }
} else {
    echo "<span class='warning'>⚠️ Test connessione saltato: List ID non configurato</span><br>";
    echo "<span class='warning'>💡 Configura EMAILOCTOPUS_LIST_ID per testare la connessione</span><br>";
}

// Test 4: Recupero Liste (per configurazione)
echo "<h2>4. 📋 Recupero Liste Disponibili</h2>";
if ($emailOctopus) {
    try {
        $lists = $emailOctopus->getLists();
        
        if ($lists['success']) {
            echo "<span class='success'>✅ Liste recuperate con successo</span><br>";
            
            if (isset($lists['data']['data']) && is_array($lists['data']['data'])) {
                echo "<strong>📋 Liste disponibili:</strong><br>";
                foreach ($lists['data']['data'] as $list) {
                    echo "&nbsp;&nbsp;• <strong>" . htmlspecialchars($list['name']) . "</strong><br>";
                    echo "&nbsp;&nbsp;&nbsp;&nbsp;ID: <code>" . htmlspecialchars($list['id']) . "</code><br>";
                    echo "&nbsp;&nbsp;&nbsp;&nbsp;Iscritti: " . ($list['counts']['subscribed'] ?? 0) . "<br>";
                    echo "&nbsp;&nbsp;&nbsp;&nbsp;Creata: " . (isset($list['created_at']) ? date('d/m/Y', strtotime($list['created_at'])) : 'N/A') . "<br><br>";
                }
                
                echo "<div style='background:#f0f9ff;padding:15px;border-radius:8px;margin-top:20px;'>";
                echo "<strong>💡 Per configurare:</strong><br>";
                echo "1. Copia l'ID della lista che vuoi usare<br>";
                echo "2. Modifica <code>api/config/emailoctopus.php</code><br>";
                echo "3. Imposta <code>define('EMAILOCTOPUS_LIST_ID', 'TUO_LIST_ID');</code>";
                echo "</div>";
            } else {
                echo "<span class='warning'>⚠️ Nessuna lista trovata nel tuo account EmailOctopus</span><br>";
            }
        } else {
            echo "<span class='error'>❌ Errore recupero liste: " . htmlspecialchars($lists['error']) . "</span><br>";
        }
        
    } catch (Exception $e) {
        echo "<span class='error'>❌ Errore: " . htmlspecialchars($e->getMessage()) . "</span><br>";
    }
} else {
    echo "<span class='error'>❌ EmailOctopusManager non disponibile</span><br>";
}

// Test 5: Test Iscrizione (solo se tutto configurato)
echo "<h2>5. 📧 Test Iscrizione Newsletter</h2>";
if ($emailOctopus && !empty(EMAILOCTOPUS_LIST_ID)) {
    echo "<form method='post' style='background:#f9fafb;padding:20px;border-radius:8px;'>";
    echo "<strong>Test iscrizione EmailOctopus:</strong><br><br>";
    echo "<input type='email' name='test_email' placeholder='test@example.com' required style='padding:10px;margin-right:10px;border:1px solid #ccc;border-radius:4px;'>";
    echo "<input type='submit' name='test_subscribe' value='Test Iscrizione' style='padding:10px 20px;background:#10b981;color:white;border:none;border-radius:4px;cursor:pointer;'>";
    echo "</form>";
    
    // Gestisci test iscrizione
    if (isset($_POST['test_subscribe']) && !empty($_POST['test_email'])) {
        echo "<br><strong>🧪 Risultato Test:</strong><br>";
        
        try {
            require_once 'newsletter-subscribe.php';
            $manager = new NewsletterSubscriptionManager();
            $result = $manager->subscribe($_POST['test_email'], ['source' => 'test']);
            
            if ($result['success']) {
                echo "<span class='success'>✅ " . htmlspecialchars($result['message']) . "</span><br>";
                echo "<strong>Provider:</strong> " . $result['provider'] . "<br>";
                if (isset($result['status'])) {
                    echo "<strong>Status:</strong> " . $result['status'] . "<br>";
                }
            } else {
                echo "<span class='error'>❌ " . htmlspecialchars($result['error']) . "</span><br>";
            }
            
        } catch (Exception $e) {
            echo "<span class='error'>❌ Errore test: " . htmlspecialchars($e->getMessage()) . "</span><br>";
        }
    }
} else {
    echo "<span class='warning'>⚠️ Test iscrizione non disponibile: configura prima List ID</span><br>";
}

// Test 6: Statistiche Locali
echo "<h2>6. 📊 Statistiche Iscrizioni Locali</h2>";
try {
    require_once 'newsletter-subscribe.php';
    $manager = new NewsletterSubscriptionManager();
    $stats = $manager->getLocalStats();
    
    if ($stats['success']) {
        echo "<strong>📈 Totale iscrizioni locali:</strong> " . $stats['total_subscriptions'] . "<br>";
        
        if (!empty($stats['by_source'])) {
            echo "<strong>📋 Per fonte:</strong><br>";
            foreach ($stats['by_source'] as $source => $count) {
                echo "&nbsp;&nbsp;• $source: $count<br>";
            }
        }
    } else {
        echo "<span class='error'>❌ Errore statistiche: " . $stats['error'] . "</span><br>";
    }
    
} catch (Exception $e) {
    echo "<span class='error'>❌ Errore: " . htmlspecialchars($e->getMessage()) . "</span><br>";
}

echo "<h2>✅ Test Completati</h2>";
echo "<p><strong>Setup EmailOctopus analizzato!</strong></p>";
echo "<p>🔗 <a href='../index.html'>Torna alla Homepage</a> | <a href='../notizie.html'>Vai alle Notizie</a></p>";
?>
