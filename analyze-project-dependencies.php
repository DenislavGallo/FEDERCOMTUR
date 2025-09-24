<?php
/**
 * Analisi Dipendenze Progetto - Verifica Utilizzo File
 */

echo "<h2>🔍 Analisi Dipendenze e Utilizzo File</h2>";

// File da analizzare
$projectFiles = [
    // Core del progetto
    'index.html' => 'core',
    'notizie.html' => 'core', 
    'contattaci.html' => 'core',
    'admin-login.html' => 'core',
    'admin-dashboard.html' => 'core',
    'admin-dashboard.php' => 'core',
    
    // CSS/JS
    'css/main.css' => 'core',
    'css/components.css' => 'core',
    'css/responsive.css' => 'core',
    'js/main.js' => 'core',
    'js/animations.js' => 'core',
    'js/newsletter.js' => 'core',
    'js/newsletter-popup.js' => 'core',
    'js/news.js' => 'core',
    'js/contact.js' => 'core',
    
    // API Backend
    'api/admin-auth.php' => 'core',
    'api/admin-middleware.php' => 'core',
    'api/newsletter-subscribe.php' => 'core',
    'api/news-data.php' => 'core',
    'api/config/database.php' => 'core',
    'api/config/auth.php' => 'core',
    'api/config/emailoctopus.php' => 'core',
    
    // Database
    'database/admin_auth_setup.sql' => 'core',
    'database/setup_news_database.sql' => 'core',
    
    // Data
    'data/news-database.json' => 'core',
    'data/news-mock.json' => 'core', 
    'data/newsletter_subscriptions.csv' => 'core',
    
    // Documentazione
    'README.md' => 'docs',
    'ROADMAP_IMPLEMENTAZIONI.md' => 'docs',
    'emailoctopus_implementation_guide.md' => 'docs',
];

// File di test/debug identificati
$testFiles = [
    'check-php-errors.php',
    'debug-401-error.php', 
    'debug-api-response.php',
    'debug-request-details.php',
    'disable-rate-limiting.php',
    'fix-password-hash.php',
    'fix-rate-limiting-smart.php',
    'quick-test-api.php',
    'remove-rate-limit.php',
    'setup-database.php',
    'simple-login-test.php',
    'test-api-endpoint.php',
    'test-api-simple.php', 
    'test-dashboard-access.php',
    'test-database-connection.php',
    'test-login-now.php',
    'analyze-project-dependencies.php' // questo stesso file
];

// File backup
$backupFiles = [
    'api/config/auth.php.backup.2025-09-24-10-34-26'
];

// Cartelle esterne/di sviluppo
$externalFolders = [
    'email-octopus-php-main',
    'testsprite_tests',
    'components' // vuota
];

echo "<h3>📋 File Core del Progetto (" . count($projectFiles) . ")</h3>";
echo "<div style='background: #f0fdf4; padding: 15px; border-radius: 8px; margin: 10px 0;'>";
foreach ($projectFiles as $file => $type) {
    $exists = file_exists($file) ? '✅' : '❌';
    $typeColor = $type === 'core' ? '#16a34a' : '#6b7280';
    echo "<div style='color: $typeColor;'>$exists <strong>$file</strong> ($type)</div>";
}
echo "</div>";

echo "<h3>🧪 File di Test/Debug (" . count($testFiles) . ") - CANDIDATI RIMOZIONE</h3>";
echo "<div style='background: #fef2f2; padding: 15px; border-radius: 8px; margin: 10px 0;'>";
foreach ($testFiles as $file) {
    $exists = file_exists($file) ? '⚠️' : '❌';
    $size = file_exists($file) ? round(filesize($file) / 1024, 1) . ' KB' : 'N/A';
    echo "<div>$exists <strong>$file</strong> ($size)</div>";
}
echo "</div>";

echo "<h3>🗂️ File Backup (" . count($backupFiles) . ") - CANDIDATI RIMOZIONE</h3>";
echo "<div style='background: #fffbeb; padding: 15px; border-radius: 8px; margin: 10px 0;'>";
foreach ($backupFiles as $file) {
    $exists = file_exists($file) ? '⚠️' : '❌';
    $size = file_exists($file) ? round(filesize($file) / 1024, 1) . ' KB' : 'N/A';
    echo "<div>$exists <strong>$file</strong> ($size)</div>";
}
echo "</div>";

echo "<h3>📁 Cartelle Esterne (" . count($externalFolders) . ") - CANDIDATI RIMOZIONE</h3>";
echo "<div style='background: #f3f4f6; padding: 15px; border-radius: 8px; margin: 10px 0;'>";
foreach ($externalFolders as $folder) {
    $exists = is_dir($folder) ? '⚠️' : '❌';
    if (is_dir($folder)) {
        $files = new RecursiveIteratorIterator(new RecursiveDirectoryIterator($folder));
        $fileCount = iterator_count($files);
        $totalSize = 0;
        foreach ($files as $file) {
            if ($file->isFile()) {
                $totalSize += $file->getSize();
            }
        }
        $sizeInfo = round($totalSize / 1024, 1) . ' KB, ' . $fileCount . ' file';
    } else {
        $sizeInfo = 'N/A';
    }
    echo "<div>$exists <strong>$folder/</strong> ($sizeInfo)</div>";
}
echo "</div>";

// Verifica dipendenze nei file core
echo "<h3>🔍 Verifica Dipendenze Critiche</h3>";

$criticalDependencies = [
    'api/config/test-config.php' => ['Usato da test o core?'],
    'api/test-emailoctopus.php' => ['Usato da sistema newsletter?'],
    'api/data/' => ['Directory vuota?'],
    'img/skyline-sofia.png' => ['Usato nelle pagine?']
];

echo "<div style='background: #f0f9ff; padding: 15px; border-radius: 8px; margin: 10px 0;'>";
foreach ($criticalDependencies as $file => $questions) {
    echo "<div><strong>$file</strong></div>";
    foreach ($questions as $q) {
        echo "<div style='margin-left: 20px; color: #6b7280;'>❓ $q</div>";
    }
    echo "<br>";
}
echo "</div>";

// Calcolo spazio totale
$totalTestSize = 0;
foreach ($testFiles as $file) {
    if (file_exists($file)) {
        $totalTestSize += filesize($file);
    }
}

$totalBackupSize = 0;
foreach ($backupFiles as $file) {
    if (file_exists($file)) {
        $totalBackupSize += filesize($file);
    }
}

echo "<hr>";
echo "<h3>📊 Riepilogo Pulizia</h3>";
echo "<div style='background: #ecfdf5; padding: 15px; border-radius: 8px;'>";
echo "<strong>🗑️ Spazio recuperabile:</strong><br>";
echo "• File test/debug: " . round($totalTestSize / 1024, 1) . " KB<br>";
echo "• File backup: " . round($totalBackupSize / 1024, 1) . " KB<br>";
echo "• email-octopus-php-main/: ~30 KB (esempio SDK)<br>";
echo "• testsprite_tests/: ~100 KB (test esterni)<br>";
echo "<strong>Totale stimato: ~" . round(($totalTestSize + $totalBackupSize + 130000) / 1024, 1) . " KB</strong><br>";
echo "</div>";

echo "<br><strong>🎯 Prossimi step:</strong><br>";
echo "• <a href='verify-dependencies.php'>verify-dependencies.php</a> - Verifica dipendenze specifiche<br>";
echo "• <a href='safe-cleanup.php'>safe-cleanup.php</a> - Pulizia sicura automatica<br>";

?>
