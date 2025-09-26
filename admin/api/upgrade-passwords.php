<?php
/**
 * Script per aggiornare password esistenti a Argon2ID
 * ==================================================
 * Esegui questo script una volta per aggiornare le password esistenti
 */

require_once __DIR__ . '/config/database.php';

try {
    $db = Database::getInstance();
    $conn = $db->getConnection();
    
    echo "🔄 Aggiornamento password a Argon2ID...\n";
    
    // Ottieni tutti gli utenti
    $stmt = $conn->prepare("SELECT id, username, password_hash FROM admin_users");
    $stmt->execute();
    $users = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    $updated = 0;
    foreach ($users as $user) {
        // Controlla se la password è già Argon2ID
        if (strpos($user['password_hash'], '$argon2id$') === 0) {
            echo "✅ Password già aggiornata per utente: {$user['username']}\n";
            continue;
        }
        
        // Genera una password temporanea sicura
        $tempPassword = bin2hex(random_bytes(16)); // 32 caratteri hex
        $newHash = password_hash($tempPassword, PASSWORD_ARGON2ID, [
            'memory_cost' => 65536, // 64 MB
            'time_cost' => 4,       // 4 iterazioni
            'threads' => 3          // 3 thread
        ]);
        
        // Aggiorna password nel database
        $updateStmt = $conn->prepare("
            UPDATE admin_users 
            SET password_hash = ?, updated_at = NOW()
            WHERE id = ?
        ");
        $updateStmt->execute([$newHash, $user['id']]);
        
        echo "🔑 Password aggiornata per utente: {$user['username']}\n";
        echo "   Nuova password temporanea: {$tempPassword}\n";
        echo "   ⚠️  IMPORTANTE: Cambia questa password al primo login!\n\n";
        
        $updated++;
    }
    
    echo "✅ Aggiornamento completato!\n";
    echo "📊 Password aggiornate: {$updated}\n";
    echo "🔐 Tutte le password ora utilizzano Argon2ID\n";
    
} catch (Exception $e) {
    echo "❌ Errore durante l'aggiornamento: " . $e->getMessage() . "\n";
    exit(1);
}
?>
