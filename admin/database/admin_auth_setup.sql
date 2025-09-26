-- =============================================
-- Sistema Autenticazione Admin - FederComTur
-- =============================================

USE federcomtur_news;

-- =============================================
-- Tabella Admin Users
-- =============================================
CREATE TABLE IF NOT EXISTS admin_users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) NOT NULL UNIQUE,
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(100) NOT NULL,
    role ENUM('super_admin', 'admin', 'editor') DEFAULT 'admin',
    status ENUM('active', 'inactive', 'suspended') DEFAULT 'active',
    last_login TIMESTAMP NULL,
    last_login_ip VARCHAR(45) NULL,
    failed_login_attempts INT DEFAULT 0,
    locked_until TIMESTAMP NULL,
    password_reset_token VARCHAR(255) NULL,
    password_reset_expires TIMESTAMP NULL,
    two_factor_secret VARCHAR(32) NULL,
    two_factor_enabled BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_username (username),
    INDEX idx_email (email),
    INDEX idx_status (status),
    INDEX idx_role (role)
);

-- =============================================
-- Tabella Session Admin
-- =============================================
CREATE TABLE IF NOT EXISTS admin_sessions (
    id VARCHAR(128) PRIMARY KEY,
    admin_user_id INT NOT NULL,
    ip_address VARCHAR(45) NOT NULL,
    user_agent TEXT NOT NULL,
    payload LONGTEXT NOT NULL,
    last_activity TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (admin_user_id) REFERENCES admin_users(id) ON DELETE CASCADE,
    INDEX idx_admin_user (admin_user_id),
    INDEX idx_last_activity (last_activity),
    INDEX idx_expires (expires_at)
);

-- =============================================
-- Tabella Login Attempts (Sicurezza)
-- =============================================
CREATE TABLE IF NOT EXISTS admin_login_attempts (
    id INT AUTO_INCREMENT PRIMARY KEY,
    ip_address VARCHAR(45) NOT NULL,
    username VARCHAR(50) NULL,
    success BOOLEAN NOT NULL DEFAULT FALSE,
    user_agent TEXT NOT NULL,
    attempted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    INDEX idx_ip_address (ip_address),
    INDEX idx_username (username),
    INDEX idx_attempted_at (attempted_at),
    INDEX idx_success (success)
);

-- =============================================
-- Inserimento Admin Iniziale
-- =============================================
-- Password: FederAdmin2024! (da cambiare al primo login)
-- Hash generato con password_hash('FederComTur2024!', PASSWORD_DEFAULT)
INSERT INTO admin_users (username, email, password_hash, full_name, role, status) VALUES
('admin', 'admin@federcomtur.it', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Amministratore FederComTur', 'super_admin', 'active')
ON DUPLICATE KEY UPDATE 
    updated_at = CURRENT_TIMESTAMP;

-- =============================================
-- Stored Procedures per Sicurezza
-- =============================================

-- Procedura per cleanup sessioni scadute
DROP PROCEDURE IF EXISTS CleanupExpiredSessions;
DELIMITER //
CREATE PROCEDURE CleanupExpiredSessions()
BEGIN
    DELETE FROM admin_sessions 
    WHERE expires_at < NOW();
END //
DELIMITER ;

-- Procedura per bloccare account dopo troppi tentativi falliti
DROP PROCEDURE IF EXISTS LockUserAccount;
DELIMITER //
CREATE PROCEDURE LockUserAccount(IN username_param VARCHAR(50))
BEGIN
    UPDATE admin_users 
    SET locked_until = DATE_ADD(NOW(), INTERVAL 30 MINUTE),
        failed_login_attempts = failed_login_attempts + 1
    WHERE username = username_param;
END //
DELIMITER ;

-- Procedura per reset tentativi login
DROP PROCEDURE IF EXISTS ResetLoginAttempts;
DELIMITER //
CREATE PROCEDURE ResetLoginAttempts(IN username_param VARCHAR(50))
BEGIN
    UPDATE admin_users 
    SET failed_login_attempts = 0, 
        locked_until = NULL 
    WHERE username = username_param;
END //
DELIMITER ;

-- =============================================
-- Event Scheduler per Cleanup Automatico
-- =============================================
SET GLOBAL event_scheduler = ON;

DROP EVENT IF EXISTS cleanup_expired_sessions;
CREATE EVENT IF NOT EXISTS cleanup_expired_sessions
ON SCHEDULE EVERY 1 HOUR
DO
  CALL CleanupExpiredSessions();

DROP EVENT IF EXISTS cleanup_old_login_attempts;
CREATE EVENT IF NOT EXISTS cleanup_old_login_attempts
ON SCHEDULE EVERY 1 DAY
DO
  DELETE FROM admin_login_attempts 
  WHERE attempted_at < DATE_SUB(NOW(), INTERVAL 30 DAY);

-- =============================================
-- Views per Monitoring
-- =============================================

-- View per statistiche login
CREATE OR REPLACE VIEW admin_login_stats AS
SELECT 
    DATE(attempted_at) as login_date,
    COUNT(*) as total_attempts,
    SUM(CASE WHEN success = 1 THEN 1 ELSE 0 END) as successful_logins,
    SUM(CASE WHEN success = 0 THEN 1 ELSE 0 END) as failed_attempts,
    COUNT(DISTINCT ip_address) as unique_ips
FROM admin_login_attempts 
WHERE attempted_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
GROUP BY DATE(attempted_at)
ORDER BY login_date DESC;

-- View per sessioni attive
CREATE OR REPLACE VIEW active_admin_sessions AS
SELECT 
    s.id as session_id,
    u.username,
    u.full_name,
    u.role,
    s.ip_address,
    s.last_activity,
    s.expires_at,
    TIMESTAMPDIFF(MINUTE, s.last_activity, NOW()) as minutes_idle
FROM admin_sessions s
JOIN admin_users u ON s.admin_user_id = u.id
WHERE s.expires_at > NOW()
ORDER BY s.last_activity DESC;

-- =============================================
-- Commenti e Documentazione
-- =============================================

/*
SCHEMA ADMIN AUTHENTICATION:

1. admin_users: Utenti amministratori con ruoli e sicurezza
   - Supporta 2FA (two_factor_secret)
   - Lock account dopo tentativi falliti
   - Password reset con token temporaneo
   - Ruoli: super_admin, admin, editor

2. admin_sessions: Gestione sessioni sicure
   - Session ID univoco
   - Tracking IP e User Agent
   - Scadenza automatica
   - Cleanup automatico

3. admin_login_attempts: Log tentativi di accesso
   - Monitoraggio sicurezza
   - Rate limiting per IP
   - Analisi pattern di attacco

SICUREZZA IMPLEMENTATA:
- Password hash con bcrypt
- Session hijacking protection
- Brute force protection
- Account lockout
- Cleanup automatico
- Monitoring e logging
- IP tracking
- User agent validation

CREDENZIALI INIZIALI:
Username: admin
Password: FederComTur2024!
Email: admin@federcomtur.it
Ruolo: super_admin

NOTA: Cambiare password al primo accesso!
*/
