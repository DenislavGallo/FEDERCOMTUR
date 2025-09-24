<?php
/**
 * Verifica Dipendenze Specifiche - Controllo Collegamenti
 */

echo "<h2>🔍 Verifica Dipendenze Specifiche</h2>";

// Funzione per cercare riferimenti a un file
function findReferences($filename, $searchDirs = ['.']) {
    $references = [];
    $cleanFilename = basename($filename);
    $filenameNoExt = pathinfo($cleanFilename, PATHINFO_FILENAME);
    
    foreach ($searchDirs as $dir) {
        $files = new RecursiveIteratorIterator(
            new RecursiveDirectoryIterator($dir, RecursiveDirectoryIterator::SKIP_DOTS)
        );
        
        foreach ($files as $file) {
            if ($file->isFile() && in_array($file->getExtension(), ['php', 'html', 'js', 'css'])) {
                $content = file_get_contents($file->getPathname());
                
                // Cerca vari pattern di riferimento
                $patterns = [
                    $cleanFilename,
                    $filenameNoExt,
                    str_replace('.php', '', $cleanFilename),
                    str_replace('.html', '', $cleanFilename)
                ];
                
                foreach ($patterns as $pattern) {
                    if (stripos($content, $pattern) !== false && $file->getFilename() !== $cleanFilename) {
                        $references[] = $file->getPathname();
                        break;
                    }
                }
            }
        }
    }
    
    return array_unique($references);
}

// File da verificare specificatamente
$filesToCheck = [
    // File di test che potrebbero essere linkati
    'api/test-emailoctopus.php' => 'Test EmailOctopus',
    'api/config/test-config.php' => 'Configurazione Test',
    
    // File potenzialmente inutili
    'api/data/' => 'Directory Data API',
    'components/' => 'Directory Components',
    
    // File di immagini
    'img/skyline-sofia.png' => 'Immagine Skyline Sofia',
];

echo "<h3>🔗 Controllo Collegamenti nei File Core</h3>";

foreach ($filesToCheck as $file => $description) {
    echo "<div style='margin: 15px 0; padding: 10px; border-left: 4px solid #3b82f6; background: #f8fafc;'>";
    echo "<strong>📁 $file</strong> - $description<br>";
    
    if (file_exists($file) || is_dir($file)) {
        $references = findReferences($file, ['.']);
        
        if (empty($references)) {
            echo "<span style='color: #16a34a;'>✅ <strong>SICURO DA RIMUOVERE</strong> - Nessun riferimento trovato</span><br>";
        } else {
            echo "<span style='color: #dc2626;'>⚠️ <strong>ATTENZIONE</strong> - Trovati riferimenti in:</span><br>";
            foreach ($references as $ref) {
                echo "<span style='margin-left: 20px; color: #6b7280;'>→ $ref</span><br>";
            }
        }
    } else {
        echo "<span style='color: #6b7280;'>❌ File/Directory non esistente</span><br>";
    }
    echo "</div>";
}

// Verifica file JavaScript specifici
echo "<h3>📜 Verifica Include/Require nei File PHP</h3>";

$phpFiles = ['api/admin-auth.php', 'api/newsletter-subscribe.php', 'api/news-data.php'];
$includePatterns = [];

foreach ($phpFiles as $phpFile) {
    if (file_exists($phpFile)) {
        $content = file_get_contents($phpFile);
        preg_match_all('/(?:require_once|require|include_once|include)\s*[\'"]([^\'"]+)[\'"]/', $content, $matches);
        
        if (!empty($matches[1])) {
            echo "<div style='margin: 10px 0;'>";
            echo "<strong>📄 $phpFile</strong><br>";
            foreach ($matches[1] as $include) {
                echo "<span style='margin-left: 20px; color: #059669;'>→ $include</span><br>";
                $includePatterns[] = $include;
            }
            echo "</div>";
        }
    }
}

// Verifica file HTML per link CSS/JS
echo "<h3>🌐 Verifica Link CSS/JS nei File HTML</h3>";

$htmlFiles = ['index.html', 'notizie.html', 'contattaci.html', 'admin-login.html'];
$linkedAssets = [];

foreach ($htmlFiles as $htmlFile) {
    if (file_exists($htmlFile)) {
        $content = file_get_contents($htmlFile);
        
        // CSS links
        preg_match_all('/href\s*=\s*[\'"]([^\'"]+\.css)[\'"]/', $content, $cssMatches);
        // JS links  
        preg_match_all('/src\s*=\s*[\'"]([^\'"]+\.js)[\'"]/', $content, $jsMatches);
        // Image links
        preg_match_all('/src\s*=\s*[\'"]([^\'"]+\.(png|jpg|jpeg|gif|svg))[\'"]/', $content, $imgMatches);
        
        $allMatches = array_merge($cssMatches[1] ?? [], $jsMatches[1] ?? [], $imgMatches[1] ?? []);
        
        if (!empty($allMatches)) {
            echo "<div style='margin: 10px 0;'>";
            echo "<strong>🌐 $htmlFile</strong><br>";
            foreach ($allMatches as $asset) {
                if (!str_starts_with($asset, 'http')) { // Solo asset locali
                    echo "<span style='margin-left: 20px; color: #7c3aed;'>→ $asset</span><br>";
                    $linkedAssets[] = $asset;
                }
            }
            echo "</div>";
        }
    }
}

// Controllo email-octopus-php-main
echo "<h3>📦 Verifica Uso email-octopus-php-main/</h3>";

$emailOctopusUsage = findReferences('email-octopus-php-main', ['.']);
$emailOctopusUsage = array_merge($emailOctopusUsage, findReferences('EmailOctopus', ['.']));

echo "<div style='margin: 15px 0; padding: 10px; border-left: 4px solid #f59e0b; background: #fffbeb;'>";
if (empty($emailOctopusUsage)) {
    echo "✅ <strong>email-octopus-php-main/</strong> - SICURO DA RIMUOVERE (SDK non utilizzato)<br>";
    echo "<span style='color: #6b7280;'>Il progetto usa implementazione custom EmailOctopus</span>";
} else {
    echo "⚠️ <strong>email-octopus-php-main/</strong> - Trovati possibili riferimenti:<br>";
    foreach ($emailOctopusUsage as $ref) {
        echo "<span style='margin-left: 20px;'>→ $ref</span><br>";
    }
}
echo "</div>";

// Riepilogo asset utilizzati
echo "<hr>";
echo "<h3>📊 Riepilogo Asset Utilizzati</h3>";

$allUsedAssets = array_unique(array_merge($includePatterns, $linkedAssets));
echo "<div style='background: #f0fdf4; padding: 15px; border-radius: 8px;'>";
echo "<strong>🔗 Asset referenziati nel codice:</strong><br>";
foreach ($allUsedAssets as $asset) {
    $exists = file_exists($asset) ? '✅' : '❌';
    echo "<span style='color: #059669;'>$exists $asset</span><br>";
}
echo "</div>";

echo "<br><strong>🎯 Prossimo step:</strong><br>";
echo "• <a href='safe-cleanup.php'>safe-cleanup.php</a> - Esegui pulizia sicura<br>";

?>
