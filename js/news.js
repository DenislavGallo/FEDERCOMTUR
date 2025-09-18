/**
 * News Page JavaScript
 * Handles news display, filtering, and pagination
 */

class NewsManager {
    constructor() {
        this.newsData = [];
        this.filteredNews = [];
        this.currentFilter = 'all';
        this.currentPage = 1;
        this.newsPerPage = 12;
        this.additionalNewsPerLoad = 9;
        this.isLoading = false;
        
        this.init();
    }
    
    async init() {
        try {
            await this.loadNewsData();
            this.setupEventListeners();
            this.displayNews();
        } catch (error) {
            console.error('Error initializing news manager:', error);
            this.showError('Errore nel caricamento delle notizie');
        }
    }
    
    async loadNewsData() {
        try {
            // Carica le categorie dall'API
            const categoriesResponse = await fetch('http://localhost:8000/api/news-data.php?action=categories');
            const categoriesData = await categoriesResponse.json();
            
            if (!categoriesData.success) {
                throw new Error(categoriesData.error || 'Errore nel caricamento categorie');
            }
            
            // Converte le categorie nel formato atteso dal frontend
            this.categories = {};
            categoriesData.data.forEach(cat => {
                this.categories[cat.name] = {
                    label: cat.label,
                    color: cat.color,
                    description: cat.description
                };
            });
            
            // Carica tutte le notizie dall'API
            const newsResponse = await fetch('http://localhost:8000/api/news-data.php?limit=100');
            const newsData = await newsResponse.json();
            
            if (!newsData.success) {
                throw new Error(newsData.error || 'Errore nel caricamento notizie');
            }
            
            // Converte i dati nel formato atteso dal frontend
            this.newsData = newsData.data.map(item => ({
                id: item.id,
                title: item.title,
                category: item.category.name,
                date: item.date_formatted.split(' ').reverse().join('-'), // Converte formato data
                dateFormatted: item.date_formatted,
                excerpt: item.excerpt,
                readTime: item.read_time,
                author: item.author,
                featured: item.featured,
                tags: item.tags || [],
                views: item.views,
                deadline: item.special_date_label === 'Scadenza' ? item.special_date : null,
                eventDate: item.special_date_label === 'Data evento' ? item.special_date : null,
                location: item.location,
                eventType: item.event_type
            }));
            
            this.filteredNews = [...this.newsData];
            
        } catch (error) {
            console.error('Error loading news data from API:', error);
            
            // Fallback: prova a caricare dal file JSON
            console.log('Fallback: caricamento da file JSON...');
            try {
                const response = await fetch('data/news-mock.json');
                const data = await response.json();
                this.newsData = data.news;
                this.categories = data.categories;
                this.filteredNews = [...this.newsData];
                console.log('Dati caricati da file JSON di fallback');
            } catch (fallbackError) {
                console.error('Errore anche nel fallback:', fallbackError);
                throw error;
            }
        }
    }
    
    setupEventListeners() {
        // Filter buttons
        const filterButtons = document.querySelectorAll('.filter-btn');
        filterButtons.forEach(btn => {
            btn.addEventListener('click', (e) => {
                const category = e.target.dataset.category;
                this.filterNews(category);
                this.updateActiveFilter(e.target);
            });
        });
        
        // Load more button
        const loadMoreBtn = document.getElementById('load-more-btn');
        if (loadMoreBtn) {
            loadMoreBtn.addEventListener('click', () => {
                this.loadMoreNews();
            });
        }
        
        // Handle URL parameters for single news view
        this.handleUrlParameters();
    }
    
    handleUrlParameters() {
        const urlParams = new URLSearchParams(window.location.search);
        const newsId = urlParams.get('id');
        
        if (newsId) {
            this.displaySingleNews(parseInt(newsId));
        }
    }
    
    filterNews(category) {
        this.currentFilter = category;
        this.currentPage = 1;
        
        if (category === 'all') {
            this.filteredNews = [...this.newsData];
        } else {
            this.filteredNews = this.newsData.filter(news => news.category === category);
        }
        
        this.displayNews();
    }
    
    updateActiveFilter(activeButton) {
        // Remove active class from all buttons
        document.querySelectorAll('.filter-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        
        // Add active class to clicked button
        activeButton.classList.add('active');
    }
    
    displayNews() {
        const newsGrid = document.getElementById('news-grid');
        const loadMoreSection = document.getElementById('load-more-section');
        
        if (!newsGrid) return;
        
        // Calculate how many news to show
        const newsToShow = this.newsPerPage + (this.currentPage - 1) * this.additionalNewsPerLoad;
        const newsToDisplay = this.filteredNews.slice(0, newsToShow);
        
        // Clear current news
        newsGrid.innerHTML = '';
        
        if (newsToDisplay.length === 0) {
            newsGrid.innerHTML = `
                <div style="grid-column: 1 / -1; text-align: center; padding: 60px 20px;">
                    <h3 style="color: var(--text-muted); font-size: 1.5rem; margin-bottom: 16px;">
                        Nessuna notizia trovata
                    </h3>
                    <p style="color: var(--text-muted);">
                        Non ci sono notizie disponibili per la categoria selezionata.
                    </p>
                </div>
            `;
            loadMoreSection.style.display = 'none';
            return;
        }
        
        // Display news cards
        newsToDisplay.forEach(news => {
            const newsCard = this.createNewsCard(news);
            newsGrid.appendChild(newsCard);
        });
        
        // Update load more button
        this.updateLoadMoreButton(newsToDisplay.length, this.filteredNews.length);
    }
    
    createNewsCard(news) {
        const card = document.createElement('article');
        card.className = 'news-card';
        card.setAttribute('data-category', news.category);
        
        // Get category info
        const categoryInfo = this.categories[news.category] || {
            label: news.category,
            color: '#6b7280'
        };
        
        // Get appropriate icon based on category
        const categoryIcon = this.getCategoryIcon(news.category);
        
        card.innerHTML = `
            <div class="news-card-header">
                <div class="news-card-category ${news.category}">
                    ${categoryInfo.label}
                </div>
                <div class="news-card-icon">
                    ${categoryIcon}
                </div>
            </div>
            <div class="news-card-content">
                <div class="news-card-meta">
                    <div class="news-card-date">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
                            <line x1="16" y1="2" x2="16" y2="6"/>
                            <line x1="8" y1="2" x2="8" y2="6"/>
                            <line x1="3" y1="10" x2="21" y2="10"/>
                        </svg>
                        ${news.dateFormatted}
                    </div>
                    <div class="news-card-read-time">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <circle cx="12" cy="12" r="10"/>
                            <polyline points="12,6 12,12 16,14"/>
                        </svg>
                        ${news.readTime}
                    </div>
                </div>
                <h3 class="news-card-title">${news.title}</h3>
                <p class="news-card-excerpt">${news.excerpt}</p>
                <div class="news-card-footer">
                    <span class="news-card-author">${news.author}</span>
                    <a href="notizie.html?id=${news.id}" class="read-more-btn">
                        Leggi tutto
                    </a>
                </div>
            </div>
        `;
        
        return card;
    }
    
    getCategoryIcon(category) {
        const icons = {
            normative: `
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                    <polyline points="14,2 14,8 20,8"/>
                    <line x1="16" y1="13" x2="8" y2="13"/>
                    <line x1="16" y1="17" x2="8" y2="17"/>
                    <polyline points="10,9 9,9 8,9"/>
                </svg>
            `,
            bandi: `
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <circle cx="12" cy="12" r="10"/>
                    <path d="M12 6v6l4 2"/>
                    <path d="M16 2v4"/>
                    <path d="M8 2v4"/>
                </svg>
            `,
            eventi: `
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
                    <line x1="16" y1="2" x2="16" y2="6"/>
                    <line x1="8" y1="2" x2="8" y2="6"/>
                    <line x1="3" y1="10" x2="21" y2="10"/>
                    <path d="M8 14h.01"/>
                    <path d="M12 14h.01"/>
                    <path d="M16 14h.01"/>
                    <path d="M8 18h.01"/>
                    <path d="M12 18h.01"/>
                </svg>
            `,
            mercato: `
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <line x1="12" y1="2" x2="12" y2="22"/>
                    <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
                    <path d="M7 12h10"/>
                </svg>
            `
        };
        
        return icons[category] || icons.mercato;
    }
    
    loadMoreNews() {
        if (this.isLoading) return;
        
        this.isLoading = true;
        this.currentPage++;
        
        // Simulate loading delay
        setTimeout(() => {
            this.displayNews();
            this.isLoading = false;
        }, 500);
    }
    
    updateLoadMoreButton(displayedCount, totalCount) {
        const loadMoreBtn = document.getElementById('load-more-btn');
        const noMoreNews = document.getElementById('no-more-news');
        const loadMoreSection = document.getElementById('load-more-section');
        
        if (!loadMoreSection) return;
        
        if (displayedCount >= totalCount) {
            // All news displayed
            loadMoreBtn.style.display = 'none';
            noMoreNews.style.display = 'block';
        } else {
            // More news available
            loadMoreBtn.style.display = 'inline-flex';
            noMoreNews.style.display = 'none';
            
            const remaining = totalCount - displayedCount;
            const nextLoad = Math.min(remaining, this.additionalNewsPerLoad);
            loadMoreBtn.querySelector('span').textContent = `Carica altre ${nextLoad} notizie`;
        }
        
        loadMoreSection.style.display = 'block';
    }
    
    async displaySingleNews(newsId) {
        try {
            // Prova prima a caricare dall'API
            const response = await fetch(`http://localhost:8000/api/news-data.php?id=${newsId}`);
            const data = await response.json();
            
            let news;
            
            if (data.success) {
                // Converte i dati dall'API nel formato atteso
                news = {
                    id: data.data.id,
                    title: data.data.title,
                    category: data.data.category.name,
                    dateFormatted: data.data.date_formatted,
                    excerpt: data.data.excerpt,
                    content: data.data.content,
                    readTime: data.data.read_time,
                    author: data.data.author,
                    featured: data.data.featured,
                    tags: data.data.tags || [],
                    views: data.data.views,
                    deadline: data.data.deadline,
                    eventDate: data.data.event_date,
                    location: data.data.location,
                    eventType: data.data.event_type
                };
            } else {
                // Fallback: cerca nei dati già caricati
                news = this.newsData.find(n => n.id === newsId);
                
                if (!news) {
                    this.showError(data.error || 'Notizia non trovata');
                    return;
                }
            }
            
        } catch (error) {
            console.error('Error loading single news from API:', error);
            
            // Fallback: cerca nei dati già caricati
            const news = this.newsData.find(n => n.id === newsId);
            
            if (!news) {
                this.showError('Notizia non trovata');
                return;
            }
        }
        
        // Hide filters and load more section
        document.querySelector('.news-filters').style.display = 'none';
        document.getElementById('load-more-section').style.display = 'none';
        
        // Create single news view
        const newsGrid = document.getElementById('news-grid');
        newsGrid.style.gridTemplateColumns = '1fr';
        newsGrid.style.maxWidth = '800px';
        newsGrid.style.margin = '0 auto';
        
        const categoryInfo = this.categories[news.category] || {
            label: news.category,
            color: '#6b7280'
        };
        
        newsGrid.innerHTML = `
            <article class="single-news-article">
                <div class="single-news-header">
                    <div class="breadcrumb">
                        <a href="notizie.html">← Torna alle notizie</a>
                    </div>
                    <div class="single-news-category ${news.category}">
                        ${categoryInfo.label}
                    </div>
                    <h1 class="single-news-title">${news.title}</h1>
                    <div class="single-news-meta">
                        <div class="meta-item">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
                                <line x1="16" y1="2" x2="16" y2="6"/>
                                <line x1="8" y1="2" x2="8" y2="6"/>
                                <line x1="3" y1="10" x2="21" y2="10"/>
                            </svg>
                            ${news.dateFormatted}
                        </div>
                        <div class="meta-item">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <circle cx="12" cy="12" r="10"/>
                                <polyline points="12,6 12,12 16,14"/>
                            </svg>
                            ${news.readTime}
                        </div>
                        <div class="meta-item">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                                <circle cx="12" cy="7" r="4"/>
                            </svg>
                            ${news.author}
                        </div>
                    </div>
                </div>
                
                <div class="single-news-content">
                    <div class="single-news-excerpt">${news.excerpt}</div>
                    <div class="single-news-body">${news.content}</div>
                    
                    ${news.tags ? `
                        <div class="single-news-tags">
                            <h4>Tag:</h4>
                            <div class="tags-list">
                                ${news.tags.map(tag => `<span class="tag">#${tag}</span>`).join('')}
                            </div>
                        </div>
                    ` : ''}
                    
                    ${news.deadline ? `
                        <div class="single-news-deadline">
                            <h4>⏰ Scadenza importante:</h4>
                            <p>${new Date(news.deadline).toLocaleDateString('it-IT', { 
                                year: 'numeric', 
                                month: 'long', 
                                day: 'numeric' 
                            })}</p>
                        </div>
                    ` : ''}
                    
                    ${news.eventDate ? `
                        <div class="single-news-event">
                            <h4>📅 Data evento:</h4>
                            <p>${new Date(news.eventDate).toLocaleDateString('it-IT', { 
                                year: 'numeric', 
                                month: 'long', 
                                day: 'numeric' 
                            })}${news.location ? ` - ${news.location}` : ''}</p>
                        </div>
                    ` : ''}
                </div>
            </article>
        `;
        
        // Add single news styles
        this.addSingleNewsStyles();
        
        // Update page title
        document.title = `${news.title} - FederComTur`;
    }
    
    addSingleNewsStyles() {
        const style = document.createElement('style');
        style.textContent = `
            .single-news-article {
                background: white;
                border-radius: var(--radius-xl);
                padding: 40px;
                box-shadow: var(--shadow-lg);
                margin-bottom: 40px;
            }
            
            .breadcrumb {
                margin-bottom: 20px;
            }
            
            .breadcrumb a {
                color: var(--primary-navy);
                text-decoration: none;
                font-weight: 500;
            }
            
            .breadcrumb a:hover {
                text-decoration: underline;
            }
            
            .single-news-category {
                display: inline-block;
                padding: 8px 16px;
                border-radius: var(--radius-full);
                font-size: 0.875rem;
                font-weight: 600;
                color: white;
                text-transform: uppercase;
                letter-spacing: 0.5px;
                margin-bottom: 20px;
            }
            
            .single-news-title {
                font-size: 2.5rem;
                font-weight: 800;
                line-height: 1.2;
                margin-bottom: 24px;
                color: var(--text-primary);
            }
            
            .single-news-meta {
                display: flex;
                gap: 24px;
                margin-bottom: 32px;
                padding-bottom: 24px;
                border-bottom: 1px solid var(--neutral-200);
                flex-wrap: wrap;
            }
            
            .meta-item {
                display: flex;
                align-items: center;
                gap: 8px;
                color: var(--text-muted);
                font-size: 0.9rem;
            }
            
            .single-news-excerpt {
                font-size: 1.25rem;
                line-height: 1.7;
                color: var(--text-secondary);
                margin-bottom: 32px;
                font-weight: 500;
                padding: 24px;
                background: var(--neutral-50);
                border-radius: var(--radius-lg);
                border-left: 4px solid var(--primary-navy);
            }
            
            .single-news-body {
                font-size: 1.1rem;
                line-height: 1.8;
                color: var(--text-primary);
                margin-bottom: 32px;
            }
            
            .single-news-tags {
                margin-bottom: 24px;
            }
            
            .single-news-tags h4 {
                margin-bottom: 12px;
                color: var(--text-primary);
            }
            
            .tags-list {
                display: flex;
                gap: 8px;
                flex-wrap: wrap;
            }
            
            .tag {
                background: var(--neutral-100);
                color: var(--text-primary);
                padding: 4px 12px;
                border-radius: var(--radius-full);
                font-size: 0.875rem;
                font-weight: 500;
            }
            
            .single-news-deadline,
            .single-news-event {
                background: #fef3c7;
                border: 1px solid #fbbf24;
                border-radius: var(--radius-lg);
                padding: 20px;
                margin-bottom: 20px;
            }
            
            .single-news-deadline h4,
            .single-news-event h4 {
                margin-bottom: 8px;
                color: #92400e;
            }
            
            .single-news-deadline p,
            .single-news-event p {
                margin: 0;
                color: #92400e;
                font-weight: 500;
            }
            
            @media (max-width: 768px) {
                .single-news-article {
                    padding: 24px;
                }
                
                .single-news-title {
                    font-size: 2rem;
                }
                
                .single-news-meta {
                    flex-direction: column;
                    gap: 12px;
                }
            }
        `;
        document.head.appendChild(style);
    }
    
    showError(message) {
        const newsGrid = document.getElementById('news-grid');
        if (newsGrid) {
            newsGrid.innerHTML = `
                <div style="grid-column: 1 / -1; text-align: center; padding: 60px 20px;">
                    <h3 style="color: #ef4444; font-size: 1.5rem; margin-bottom: 16px;">
                        ${message}
                    </h3>
                    <p style="color: var(--text-muted);">
                        Si è verificato un errore. Riprova più tardi.
                    </p>
                </div>
            `;
        }
    }
}

// Initialize news manager when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new NewsManager();
});

// Handle mobile menu (reuse from main.js if needed)
document.addEventListener('DOMContentLoaded', function() {
    const mobileMenuToggle = document.querySelector('.mobile-menu-toggle');
    const navbarMenu = document.querySelector('.navbar-menu');
    
    if (mobileMenuToggle && navbarMenu) {
        mobileMenuToggle.addEventListener('click', function() {
            const isExpanded = this.getAttribute('aria-expanded') === 'true';
            
            this.setAttribute('aria-expanded', !isExpanded);
            navbarMenu.classList.toggle('active');
            document.body.classList.toggle('menu-open');
        });
    }
    
    // Close mobile menu when clicking on a link
    document.querySelectorAll('.navbar-menu a').forEach(link => {
        link.addEventListener('click', () => {
            navbarMenu?.classList.remove('active');
            mobileMenuToggle?.setAttribute('aria-expanded', 'false');
            document.body.classList.remove('menu-open');
        });
    });
});
