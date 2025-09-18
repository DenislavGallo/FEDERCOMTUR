<?php
require_once 'database.php';

echo "<h2>Test Configurazione Database</h2>";

try {
    $db = Database::getInstance();
    $conn = $db->getConnection();
    
    echo "✅ Connessione database riuscita!<br>";
    echo "Database: " . DB_NAME . "<br>";
    echo "Host: " . DB_HOST . ":" . DB_PORT . "<br>";
    
    // Test query
    $stmt = $conn->query("SHOW TABLES");
    $tables = $stmt->fetchAll();
    
    echo "<h3>Tabelle presenti:</h3>";
    foreach($tables as $table) {
        echo "- " . $table[0] . "<br>";
    }
    
} catch(Exception $e) {
    echo "❌ Errore: " . $e->getMessage();
}
?>