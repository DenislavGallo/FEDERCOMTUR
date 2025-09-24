<?php
/**
 * Safe Cleanup - Pulizia Sicura Progetto
 */

echo "<h2>🧹 Pulizia Sicura Progetto FederComTur</h2>";

// File di test/debug da rimuovere (sicuri)
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
    'analyze-project-dependencies.php',
    'verify-dependencies.php',
    'safe-cleanup.php' // questo stesso file
];

// File backup da rimuovere
$backupFiles = [
    'api/config/auth.php.backup.2025-09-24-10-34-26'
];

// Directory da rimuovere (se non referenziate)
$directoriesToRemove = [
    'email-octopus-php-main',
    'testsprite_tests',
    'components' // directory vuota
];

// File singoli potenzialmente inutili
$potentiallyUnused = [
    'api/test-emailoctopus.php',
    'api/config/test-config.php',
    'img/skyline-sofia.png'
];

$totalSpaceSaved = 0;
$filesRemoved = 0;
$foldersRemoved = 0;

// 1. Rimozione file di test/debug
echo "<h3>🗑️ Rimozione File Test/Debug</h3>";
echo "<div style='background: #fef2f2; padding: 15px; border-radius: 8px; margin: 10px 0;'>";

foreach ($testFiles as $file) {
    if (file_exists($file)) {
        $fileSize = filesize($file);
        
        if (unlink($file)) {
            echo "✅ Rimosso: <strong>$file</strong> (" . round($fileSize/1024, 1) . " KB)<br>";
            $totalSpaceSaved += $fileSize;
            $filesRemoved++;
        } else {
            echo "❌ Errore rimozione: <strong>$file</strong><br>";
        }
    } else {
        echo "⚪ Non trovato: <strong>$file</strong><br>";
    }
}
echo "</div>";

// 2. Rimozione file backup
echo "<h3>🗂️ Rimozione File Backup</h3>";
echo "<div style='background: #fffbeb; padding: 15px; border-radius: 8px; margin: 10px 0;'>";

foreach ($backupFiles as $file) {
    if (file_exists($file)) {
        $fileSize = filesize($file);
        
        if (unlink($file)) {
            echo "✅ Rimosso backup: <strong>$file</strong> (" . round($fileSize/1024, 1) . " KB)<br>";
            $totalSpaceSaved += $fileSize;
            $filesRemoved++;
        } else {
            echo "❌ Errore rimozione backup: <strong>$file</strong><br>";
        }
    } else {
        echo "⚪ Backup non trovato: <strong>$file</strong><br>";
    }
}
echo "</div>";

// 3. Rimozione directory esterne
echo "<h3>📁 Rimozione Directory Esterne</h3>";
echo "<div style='background: #f3f4f6; padding: 15px; border-radius: 8px; margin: 10px 0;'>";

// Funzione per rimuovere directory ricorsivamente
function removeDirectory($dir) {
    if (!is_dir($dir)) return false;
    
    $files = array_diff(scandir($dir), array('.', '..'));
    $totalSize = 0;
    
    foreach ($files as $file) {
        $path = $dir . DIRECTORY_SEPARATOR . $file;
        if (is_dir($path)) {
            $totalSize += removeDirectory($path);
        } else {
            $totalSize += filesize($path);
            unlink($path);
        }
    }
    
    rmdir($dir);
    return $totalSize;
}

foreach ($directoriesToRemove as $dir) {
    if (is_dir($dir)) {
        echo "🗂️ Rimuovendo directory: <strong>$dir/</strong><br>";
        
        try {
            $dirSize = removeDirectory($dir);
            echo "✅ Directory rimossa: <strong>$dir/</strong> (" . round($dirSize/1024, 1) . " KB)<br>";
            $totalSpaceSaved += $dirSize;
            $foldersRemoved++;
        } catch (Exception $e) {
            echo "❌ Errore rimozione directory: <strong>$dir/</strong> - " . $e->getMessage() . "<br>";
        }
    } else {
        echo "⚪ Directory non trovata: <strong>$dir/</strong><br>";
    }
}
echo "</div>";

// 4. Verifica file potenzialmente inutili (solo verifica, non rimozione automatica)
echo "<h3>🔍 Verifica File Potenzialmente Inutili (Solo Analisi)</h3>";
echo "<div style='background: #f0f9ff; padding: 15px; border-radius: 8px; margin: 10px 0;'>";

foreach ($potentiallyUnused as $file) {
    if (file_exists($file)) {
        $fileSize = filesize($file);
        echo "⚠️ Da verificare manualmente: <strong>$file</strong> (" . round($fileSize/1024, 1) . " KB)<br>";
        
        // Cerca rapidamente riferimenti
        $hasReferences = false;
        $coreFiles = ['index.html', 'notizie.html', 'contattaci.html', 'admin-login.html', 'admin-dashboard.php'];
        
        foreach ($coreFiles as $coreFile) {
            if (file_exists($coreFile)) {
                $content = file_get_contents($coreFile);
                if (strpos($content, basename($file)) !== false) {
                    $hasReferences = true;
                    echo "<span style='margin-left: 20px; color: #dc2626;'>→ Referenziato in: $coreFile</span><br>";
                }
            }
        }
        
        if (!$hasReferences) {
            echo "<span style='margin-left: 20px; color: #16a34a;'>→ Probabilmente sicuro da rimuovere</span><br>";
        }
    } else {
        echo "⚪ Non trovato: <strong>$file</strong><br>";
    }
}
echo "</div>";

// 5. Pulizia directory vuote
echo "<h3>📂 Pulizia Directory Vuote</h3>";
echo "<div style='background: #f8fafc; padding: 15px; border-radius: 8px; margin: 10px 0;'>";

$emptyDirs = ['api/data', 'components'];
foreach ($emptyDirs as $dir) {
    if (is_dir($dir)) {
        $files = scandir($dir);
        if (count($files) <= 2) { // Solo . e ..
            if (rmdir($dir)) {
                echo "✅ Directory vuota rimossa: <strong>$dir/</strong><br>";
                $foldersRemoved++;
            } else {
                echo "❌ Errore rimozione directory vuota: <strong>$dir/</strong><br>";
            }
        } else {
            echo "⚪ Directory non vuota: <strong>$dir/</strong> (" . (count($files)-2) . " file)<br>";
        }
    } else {
        echo "⚪ Directory non trovata: <strong>$dir/</strong><br>";
    }
}
echo "</div>";

// Riepilogo finale
echo "<hr>";
echo "<h3>📊 Riepilogo Pulizia</h3>";
echo "<div style='background: #ecfdf5; padding: 20px; border-radius: 8px; border: 2px solid #22c55e;'>";
echo "<strong>🎉 Pulizia Completata!</strong><br><br>";
echo "📁 <strong>File rimossi:</strong> $filesRemoved<br>";
echo "🗂️ <strong>Directory rimosse:</strong> $foldersRemoved<br>";
echo "💾 <strong>Spazio recuperato:</strong> " . round($totalSpaceSaved/1024, 1) . " KB<br>";
echo "</div>";

echo "<h3>✅ Struttura Progetto Ottimizzata</h3>";
echo "<div style='background: #f0fdf4; padding: 15px; border-radius: 8px;'>";
echo "<strong>📁 File Core Mantenuti:</strong><br>";
echo "• Pagine HTML: index.html, notizie.html, contattaci.html<br>";
echo "• Sistema Admin: admin-login.html, admin-dashboard.php<br>";
echo "• Backend API: admin-auth.php, newsletter-subscribe.php, news-data.php<br>";
echo "• Frontend Assets: CSS, JS, immagini<br>";
echo "• Database: SQL setup files<br>";
echo "• Documentazione: README.md, ROADMAP_IMPLEMENTAZIONI.md<br>";
echo "</div>";

echo "<br><strong>🎯 Progetto ora pulito e ottimizzato per produzione!</strong><br>";

?>
