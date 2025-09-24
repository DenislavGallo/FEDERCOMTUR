<!DOCTYPE html>
<html lang="it">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Dashboard Admin - FederComTur</title>
    
    <!-- CSS -->
    <link rel="stylesheet" href="css/main.css">
    <link rel="stylesheet" href="css/components.css">
    
    <!-- Fonts -->
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Figtree:wght@300;400;500;600;700;800&display=swap" rel="stylesheet">
    
    <?php 
    require_once 'api/admin-middleware.php';
    $user = protectAdminPage('admin');
    includeAdminHead();
    ?>
    
    <style>
        /* Stili Admin Dashboard */
        body {
            background: #f8fafc;
            font-family: 'Figtree', sans-serif;
            margin: 0;
            padding: 0;
        }
        
        .admin-layout {
            display: grid;
            grid-template-columns: 280px 1fr;
            min-height: 100vh;
        }
        
        /* Sidebar */
        .admin-sidebar {
            background: white;
            border-right: 1px solid #e5e7eb;
            display: flex;
            flex-direction: column;
        }
        
        .admin-sidebar-header {
            padding: 1.5rem;
            border-bottom: 1px solid #e5e7eb;
        }
        
        .admin-logo {
            display: flex;
            align-items: center;
            gap: 0.75rem;
        }
        
        .admin-logo-icon {
            width: 40px;
            height: 40px;
            background: linear-gradient(135deg, var(--primary-navy) 0%, var(--secondary-emerald) 100%);
            border-radius: 8px;
            display: flex;
            align-items: center;
            justify-content: center;
            color: white;
            font-weight: 700;
            font-size: 1.1rem;
        }
        
        .admin-logo-text {
            font-weight: 700;
            color: var(--primary-navy);
            font-size: 1.1rem;
        }
        
        .admin-nav {
            flex: 1;
            padding: 1rem 0;
        }
        
        .admin-nav-section {
            margin-bottom: 2rem;
        }
        
        .admin-nav-title {
            padding: 0 1.5rem;
            font-size: 0.75rem;
            font-weight: 600;
            text-transform: uppercase;
            color: #6b7280;
            margin-bottom: 0.5rem;
        }
        
        .admin-nav-item {
            display: flex;
            align-items: center;
            padding: 0.75rem 1.5rem;
            color: #374151;
            text-decoration: none;
            transition: all 0.2s ease;
            border-left: 3px solid transparent;
        }
        
        .admin-nav-item:hover {
            background: #f3f4f6;
            color: var(--secondary-emerald);
        }
        
        .admin-nav-item.active {
            background: #ecfdf5;
            color: var(--secondary-emerald);
            border-left-color: var(--secondary-emerald);
        }
        
        .admin-nav-icon {
            width: 20px;
            height: 20px;
            margin-right: 0.75rem;
        }
        
        .admin-sidebar-footer {
            padding: 1.5rem;
            border-top: 1px solid #e5e7eb;
        }
        
        .admin-user-info {
            display: flex;
            align-items: center;
            gap: 0.75rem;
            margin-bottom: 1rem;
        }
        
        .admin-user-avatar {
            width: 40px;
            height: 40px;
            background: var(--secondary-emerald);
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            color: white;
            font-weight: 600;
        }
        
        .admin-user-details h4 {
            margin: 0;
            font-size: 0.9rem;
            color: var(--primary-navy);
        }
        
        .admin-user-details p {
            margin: 0;
            font-size: 0.8rem;
            color: #6b7280;
        }
        
        .admin-logout-btn {
            width: 100%;
            padding: 0.5rem;
            background: #f3f4f6;
            border: 1px solid #d1d5db;
            border-radius: 6px;
            color: #374151;
            font-size: 0.85rem;
            cursor: pointer;
            transition: all 0.2s ease;
        }
        
        .admin-logout-btn:hover {
            background: #e5e7eb;
        }
        
        /* Main Content */
        .admin-main {
            padding: 2rem;
            overflow-y: auto;
        }
        
        .admin-header {
            margin-bottom: 2rem;
        }
        
        .admin-page-title {
            font-size: 2rem;
            font-weight: 700;
            color: var(--primary-navy);
            margin: 0 0 0.5rem 0;
        }
        
        .admin-page-subtitle {
            color: #6b7280;
            margin: 0;
        }
        
        /* Dashboard Cards */
        .dashboard-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
            gap: 1.5rem;
            margin-bottom: 2rem;
        }
        
        .dashboard-card {
            background: white;
            border-radius: 12px;
            padding: 1.5rem;
            box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
            border: 1px solid #e5e7eb;
        }
        
        .dashboard-card-header {
            display: flex;
            align-items: center;
            justify-content: between;
            margin-bottom: 1rem;
        }
        
        .dashboard-card-title {
            font-size: 1.1rem;
            font-weight: 600;
            color: var(--primary-navy);
            margin: 0;
        }
        
        .dashboard-card-icon {
            width: 24px;
            height: 24px;
            color: var(--secondary-emerald);
        }
        
        .dashboard-stat {
            font-size: 2.5rem;
            font-weight: 700;
            color: var(--primary-navy);
            margin: 0;
        }
        
        .dashboard-stat-label {
            color: #6b7280;
            font-size: 0.9rem;
            margin: 0.5rem 0 0 0;
        }
        
        /* Quick Actions */
        .quick-actions {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
            gap: 1rem;
        }
        
        .quick-action-btn {
            background: white;
            border: 2px solid #e5e7eb;
            border-radius: 12px;
            padding: 1.5rem;
            text-decoration: none;
            color: var(--primary-navy);
            transition: all 0.2s ease;
            display: flex;
            align-items: center;
            gap: 1rem;
        }
        
        .quick-action-btn:hover {
            border-color: var(--secondary-emerald);
            background: #f0fdf4;
            transform: translateY(-2px);
        }
        
        .quick-action-icon {
            width: 40px;
            height: 40px;
            background: linear-gradient(135deg, var(--primary-navy) 0%, var(--secondary-emerald) 100%);
            border-radius: 8px;
            display: flex;
            align-items: center;
            justify-content: center;
            color: white;
        }
        
        .quick-action-content h3 {
            margin: 0 0 0.25rem 0;
            font-size: 1.1rem;
            font-weight: 600;
        }
        
        .quick-action-content p {
            margin: 0;
            color: #6b7280;
            font-size: 0.9rem;
        }
        
        /* Responsive */
        @media (max-width: 1024px) {
            .admin-layout {
                grid-template-columns: 1fr;
            }
            
            .admin-sidebar {
                display: none;
            }
        }
    </style>
</head>
<body>
    <div class="admin-layout">
        <!-- Sidebar -->
        <aside class="admin-sidebar">
            <div class="admin-sidebar-header">
                <div class="admin-logo">
                    <div class="admin-logo-icon">FC</div>
                    <div class="admin-logo-text">FederComTur Admin</div>
                </div>
            </div>
            
            <nav class="admin-nav">
                <div class="admin-nav-section">
                    <div class="admin-nav-title">Dashboard</div>
                    <a href="admin-dashboard.html" class="admin-nav-item active">
                        <svg class="admin-nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <rect x="3" y="3" width="7" height="7"/>
                            <rect x="14" y="3" width="7" height="7"/>
                            <rect x="14" y="14" width="7" height="7"/>
                            <rect x="3" y="14" width="7" height="7"/>
                        </svg>
                        Panoramica
                    </a>
                </div>
                
                <div class="admin-nav-section">
                    <div class="admin-nav-title">Contenuti</div>
                    <a href="#" class="admin-nav-item">
                        <svg class="admin-nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                            <polyline points="14,2 14,8 20,8"/>
                            <line x1="16" y1="13" x2="8" y2="13"/>
                            <line x1="16" y1="17" x2="8" y2="17"/>
                            <polyline points="10,9 9,9 8,9"/>
                        </svg>
                        Gestione Notizie
                    </a>
                    <a href="#" class="admin-nav-item">
                        <svg class="admin-nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
                            <polyline points="22,6 12,13 2,6"/>
                        </svg>
                        Newsletter
                    </a>
                </div>
                
                <div class="admin-nav-section">
                    <div class="admin-nav-title">Sistema</div>
                    <a href="#" class="admin-nav-item">
                        <svg class="admin-nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                            <circle cx="9" cy="7" r="4"/>
                            <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
                            <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
                        </svg>
                        Utenti Admin
                    </a>
                    <a href="#" class="admin-nav-item">
                        <svg class="admin-nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <circle cx="12" cy="12" r="3"/>
                            <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1 1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/>
                        </svg>
                        Impostazioni
                    </a>
                </div>
            </nav>
            
            <div class="admin-sidebar-footer">
                <div class="admin-user-info">
                    <div class="admin-user-avatar" id="user-avatar"></div>
                    <div class="admin-user-details">
                        <h4 id="user-name">Caricamento...</h4>
                        <p id="user-role">admin</p>
                    </div>
                </div>
                <button class="admin-logout-btn" id="logout-btn">
                    Logout
                </button>
            </div>
        </aside>
        
        <!-- Main Content -->
        <main class="admin-main">
            <div class="admin-header">
                <h1 class="admin-page-title">Dashboard</h1>
                <p class="admin-page-subtitle">Panoramica generale del sistema FederComTur</p>
            </div>
            
            <!-- Dashboard Stats -->
            <div class="dashboard-grid">
                <div class="dashboard-card">
                    <div class="dashboard-card-header">
                        <h3 class="dashboard-card-title">Newsletter Iscritti</h3>
                        <svg class="dashboard-card-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
                            <polyline points="22,6 12,13 2,6"/>
                        </svg>
                    </div>
                    <p class="dashboard-stat" id="newsletter-count">...</p>
                    <p class="dashboard-stat-label">Iscritti totali</p>
                </div>
                
                <div class="dashboard-card">
                    <div class="dashboard-card-header">
                        <h3 class="dashboard-card-title">Notizie Pubblicate</h3>
                        <svg class="dashboard-card-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                            <polyline points="14,2 14,8 20,8"/>
                        </svg>
                    </div>
                    <p class="dashboard-stat" id="news-count">...</p>
                    <p class="dashboard-stat-label">Articoli attivi</p>
                </div>
                
                <div class="dashboard-card">
                    <div class="dashboard-card-header">
                        <h3 class="dashboard-card-title">Sessioni Attive</h3>
                        <svg class="dashboard-card-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                            <circle cx="9" cy="7" r="4"/>
                        </svg>
                    </div>
                    <p class="dashboard-stat" id="active-sessions">...</p>
                    <p class="dashboard-stat-label">Admin online</p>
                </div>
            </div>
            
            <!-- Quick Actions -->
            <div class="admin-header">
                <h2 class="admin-page-title" style="font-size: 1.5rem;">Azioni Rapide</h2>
            </div>
            
            <div class="quick-actions">
                <a href="#" class="quick-action-btn">
                    <div class="quick-action-icon">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                            <polyline points="14,2 14,8 20,8"/>
                            <line x1="12" y1="11" x2="12" y2="17"/>
                            <line x1="9" y1="14" x2="15" y2="14"/>
                        </svg>
                    </div>
                    <div class="quick-action-content">
                        <h3>Nuova Notizia</h3>
                        <p>Crea e pubblica un nuovo articolo</p>
                    </div>
                </a>
                
                <a href="#" class="quick-action-btn">
                    <div class="quick-action-icon">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
                            <polyline points="22,6 12,13 2,6"/>
                        </svg>
                    </div>
                    <div class="quick-action-content">
                        <h3>Invia Newsletter</h3>
                        <p>Componi e invia newsletter</p>
                    </div>
                </a>
                
                <a href="#" class="quick-action-btn">
                    <div class="quick-action-icon">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <line x1="18" y1="6" x2="6" y2="18"/>
                            <line x1="6" y1="6" x2="18" y2="18"/>
                        </svg>
                    </div>
                    <div class="quick-action-content">
                        <h3>Backup Sistema</h3>
                        <p>Esegui backup completo</p>
                    </div>
                </a>
            </div>
        </main>
    </div>

    <script>
        class AdminDashboard {
            constructor() {
                this.init();
                this.loadUserInfo();
                this.loadDashboardStats();
                this.setupEventListeners();
            }
            
            init() {
                // Verifica autenticazione
                this.checkAuth();
            }
            
            async checkAuth() {
                try {
                    const response = await fetch('api/admin-auth.php?action=check', {
                        credentials: 'include'
                    });
                    
                    const data = await response.json();
                    
                    if (!data.success || !data.data.authenticated) {
                        window.location.href = 'admin-login.html';
                        return;
                    }
                    
                } catch (error) {
                    console.error('Auth check error:', error);
                    window.location.href = 'admin-login.html';
                }
            }
            
            async loadUserInfo() {
                try {
                    const response = await fetch('api/admin-auth.php?action=user', {
                        credentials: 'include'
                    });
                    
                    const data = await response.json();
                    
                    if (data.success && data.data.user) {
                        const user = data.data.user;
                        document.getElementById('user-name').textContent = user.full_name;
                        document.getElementById('user-role').textContent = user.role;
                        
                        // Avatar con iniziali
                        const initials = user.full_name.split(' ').map(n => n[0]).join('').toUpperCase();
                        document.getElementById('user-avatar').textContent = initials;
                    }
                    
                } catch (error) {
                    console.error('Error loading user info:', error);
                }
            }
            
            async loadDashboardStats() {
                try {
                    // Stats newsletter (mock per ora)
                    document.getElementById('newsletter-count').textContent = '1,247';
                    
                    // Stats notizie (mock per ora)
                    document.getElementById('news-count').textContent = '23';
                    
                    // Sessioni attive
                    const response = await fetch('api/admin-auth.php?action=sessions', {
                        credentials: 'include'
                    });
                    
                    if (response.ok) {
                        const data = await response.json();
                        if (data.success && data.data.sessions) {
                            document.getElementById('active-sessions').textContent = data.data.sessions.length;
                        }
                    } else {
                        document.getElementById('active-sessions').textContent = '1';
                    }
                    
                } catch (error) {
                    console.error('Error loading dashboard stats:', error);
                    // Fallback values
                    document.getElementById('active-sessions').textContent = '1';
                }
            }
            
            setupEventListeners() {
                // Logout button
                document.getElementById('logout-btn').addEventListener('click', () => {
                    this.logout();
                });
            }
            
            async logout() {
                try {
                    const response = await fetch('api/admin-auth.php?action=logout', {
                        method: 'DELETE',
                        credentials: 'include'
                    });
                    
                    // Reindirizza sempre al login, anche se la richiesta fallisce
                    window.location.href = 'admin-login.html';
                    
                } catch (error) {
                    console.error('Logout error:', error);
                    window.location.href = 'admin-login.html';
                }
            }
        }
        
        // Inizializza dashboard
        document.addEventListener('DOMContentLoaded', () => {
            new AdminDashboard();
        });
    </script>
</body>
</html>
