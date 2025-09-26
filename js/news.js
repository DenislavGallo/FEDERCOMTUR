/**
 * News Page JavaScript - Versione Pulita
 * Gestisce caricamento dati, visualizzazione card e modal articoli
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
        this.categories = {};
        
        this.init();
    }
    
    async init() {
        try {
            await this.loadNewsData();
            this.setupEventListeners();
            this.displayNews();
            this.handleUrlParameters();
        } catch (error) {
            console.error('Error initializing news manager:', error);
            this.showError('Errore nel caricamento delle notizie');
        }
    }
    
    async loadNewsData() {
        try {
            // Carica le categorie dall'API
            const categoriesResponse = await fetch('api/news-data.php?action=categories');
            const categoriesData = await categoriesResponse.json();
            
            if (categoriesData.success) {
            // Converte le categorie nel formato atteso dal frontend
            this.categories = {};
            categoriesData.data.forEach(cat => {
                this.categories[cat.name] = {
                    label: cat.label,
                    color: cat.color,
                    description: cat.description
                };
            });
            }
            
            // Carica tutte le notizie dall'API
            const newsResponse = await fetch('api/news-data.php?limit=100');
            const newsData = await newsResponse.json();
            
            if (newsData.success) {
            // Converte i dati nel formato atteso dal frontend
            this.newsData = newsData.data.map(item => ({
                id: item.id,
                title: item.title,
                category: item.category.name,
                    date: item.date_formatted.split(' ').reverse().join('-'),
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
                console.log('✅ Dati caricati dall\'API:', this.newsData.length, 'notizie');
            } else {
                throw new Error(newsData.error || 'Errore nel caricamento notizie');
            }
            
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
                console.log('✅ Dati caricati da file JSON di fallback');
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
                // Fix bug pallini colorati: usa currentTarget invece di target
                // currentTarget = bottone cliccato, target = elemento specifico (pallino o testo)
                const button = e.currentTarget;
                const category = button.dataset.category;
                
                if (category) {
                    this.filterNews(category);
                    this.updateActiveFilter(button);
                } else {
                    console.error('❌ No category found for filter button');
                }
            });
        });
        
        // Load more button
        const loadMoreBtn = document.getElementById('load-more-btn');
        if (loadMoreBtn) {
            loadMoreBtn.addEventListener('click', () => {
                this.loadMoreNews();
            });
        }
        
        // Modal event listeners
        this.setupModalEventListeners();
        
        // Read more buttons (delegated event)
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('read-more-btn')) {
                e.preventDefault();
                const newsId = parseInt(e.target.getAttribute('data-news-id'));
                this.openArticleModal(newsId);
            }
        });
    }
    
    setupModalEventListeners() {
        // Back button (return to news page)
        const backBtn = document.getElementById('article-back-button');
        if (backBtn) {
            backBtn.addEventListener('click', () => this.closeArticleModal());
        }
        
        // Close modal when clicking outside or on header
        const modal = document.getElementById('article-modal');
        if (modal) {
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    this.closeArticleModal();
                }
            });
            
            // Close modal when clicking on header
            const header = modal.querySelector('.article-modal-header');
            if (header) {
                header.addEventListener('click', () => this.closeArticleModal());
            }
        }
        
        // Close modal with ESC key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                const modal = document.getElementById('article-modal');
                if (modal && modal.classList.contains('active')) {
                    this.closeArticleModal();
                }
            }
        });
        
    }
    
    handleUrlParameters() {
        const urlParams = new URLSearchParams(window.location.search);
        const newsId = urlParams.get('id');
        
        if (newsId) {
            // Aspetta che i dati siano caricati prima di aprire il modal
            setTimeout(() => {
                this.openArticleModal(parseInt(newsId));
            }, 500);
        }
    }
    
    filterNews(category) {
        this.currentFilter = category;
        this.currentPage = 1;
        
        // Feedback visivo filtro in corso
        this.showFilteringFeedback();
        
        if (category === 'all') {
            this.filteredNews = [...this.newsData];
        } else {
            this.filteredNews = this.newsData.filter(news => news.category === category);
        }
        
        this.displayNews();
        
        // Scroll automatico al top della sezione notizie
        this.scrollToNewsSection();
    }
    
    /**
     * Feedback visivo durante filtrazione
     */
    showFilteringFeedback() {
        const newsGrid = document.getElementById('news-grid');
        if (newsGrid) {
            newsGrid.style.opacity = '0.7';
            newsGrid.style.transform = 'translateY(10px)';
            
            // Reset feedback dopo scroll
            setTimeout(() => {
                newsGrid.style.opacity = '1';
                newsGrid.style.transform = 'translateY(0)';
            }, 400);
        }
    }
    
    /**
     * Scroll automatico alla sezione notizie
     */
    scrollToNewsSection() {
        // Piccolo delay per permettere al DOM di aggiornarsi dopo il filtro
        setTimeout(() => {
            const newsSection = document.querySelector('.news-content');
            
            if (newsSection) {
                // Calcola offset per compensare elementi sticky
                const navbar = document.querySelector('.navbar');
                const filtersSection = document.querySelector('.news-filters');
                
                let totalOffset = 0; // Inizia da 0
                
                // Aggiungi altezza navbar se presente
                if (navbar) {
                    const navbarRect = navbar.getBoundingClientRect();
                    totalOffset += navbarRect.height;
                }
                
                // Aggiungi altezza filtri (sticky)
                if (filtersSection) {
                    const filtersRect = filtersSection.getBoundingClientRect();
                    totalOffset += filtersRect.height;
                }
                
                // Padding extra per visibilità migliore
                totalOffset += 20;
                
                const targetPosition = newsSection.offsetTop - totalOffset;
                const clampedPosition = Math.max(0, targetPosition);
                
                // Smooth scroll
                window.scrollTo({
                    top: clampedPosition,
                    behavior: 'smooth'
                });
            } else {
                console.warn('⚠️ News section not found for auto-scroll');
            }
        }, 100); // 100ms delay per stabilità
    }
    
    /**
     * Smooth scroll fallback per browser senza supporto nativo
     */
    smoothScrollTo(targetY, duration) {
        const startY = window.pageYOffset;
        const distance = targetY - startY;
        const startTime = performance.now();
        
        const easeInOutCubic = (t) => {
            return t < 0.5 ? 4 * t * t * t : (t - 1) * (2 * t - 2) * (2 * t - 2) + 1;
        };
        
        const animateScroll = (currentTime) => {
            const timeElapsed = currentTime - startTime;
            const progress = Math.min(timeElapsed / duration, 1);
            const easedProgress = easeInOutCubic(progress);
            
            window.scrollTo(0, startY + distance * easedProgress);
            
            if (progress < 1) {
                requestAnimationFrame(animateScroll);
            }
        };
        
        requestAnimationFrame(animateScroll);
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
        
        // Display news cards with staggered animation
        newsToDisplay.forEach((news, index) => {
            const newsCard = this.createNewsCard(news, index);
            newsGrid.appendChild(newsCard);
        });
        
        // Update load more button
        this.updateLoadMoreButton(newsToDisplay.length, this.filteredNews.length);
    }
    
    createNewsCard(news, index = 0) {
        const card = document.createElement('article');
        card.className = 'news-card';
        card.setAttribute('data-category', news.category);
        
        // Aggiungi animazione scaglionata
        setTimeout(() => {
            card.classList.add('animate-in');
        }, 100 + (index * 50));
        
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
                    <button class="read-more-btn" data-news-id="${news.id}">
                        Leggi tutto
                    </button>
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
    
    openArticleModal(newsId) {
        const news = this.newsData.find(item => item.id === newsId);
                if (!news) {
            console.error('Notizia non trovata:', newsId);
                    return;
        }
        
        const modal = document.getElementById('article-modal');
        const categoryBadge = document.getElementById('article-category-badge');
        const title = document.getElementById('article-title');
        const meta = document.getElementById('article-meta');
        const content = document.getElementById('article-content');
        const headerIcon = document.getElementById('article-header-icon');
        const tags = document.getElementById('article-tags');
        const tagsList = document.getElementById('article-tags-list');
        
        // Get category info
        const categoryInfo = this.categories[news.category] || {
            label: news.category,
            color: '#6b7280'
        };
        
        // Set category badge
        categoryBadge.innerHTML = `<span>${categoryInfo.label}</span>`;
        categoryBadge.style.backgroundColor = categoryInfo.color;
        
        // Set header icon
        const categoryIcon = this.getCategoryIcon(news.category);
        headerIcon.innerHTML = `
            <div style="width: 120px; height: 120px; color: rgba(255,255,255,0.8);">
                ${categoryIcon}
                    </div>
        `;
        
        // Set title
        title.textContent = news.title;
        
        // Set meta information
        meta.innerHTML = `
            <div class="article-meta-item">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
                                <line x1="16" y1="2" x2="16" y2="6"/>
                                <line x1="8" y1="2" x2="8" y2="6"/>
                                <line x1="3" y1="10" x2="21" y2="10"/>
                            </svg>
                            ${news.dateFormatted}
                        </div>
            <div class="article-meta-item">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <circle cx="12" cy="12" r="10"/>
                                <polyline points="12,6 12,12 16,14"/>
                            </svg>
                            ${news.readTime}
                        </div>
            <div class="article-meta-item">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                                <circle cx="12" cy="7" r="4"/>
                            </svg>
                            ${news.author}
                        </div>
        `;
        
        // Set content
        const fullContent = this.getFullArticleContent(newsId);
        content.innerHTML = `
            <p style="font-size: 1.2rem; font-weight: 500; margin-bottom: 24px; color: var(--text-primary);">
                ${news.excerpt}
            </p>
            ${fullContent}
        `;
        
        // Set tags
        if (news.tags && news.tags.length > 0) {
            tagsList.innerHTML = news.tags.map(tag => 
                `<span class="article-tag">${tag}</span>`
            ).join('');
            tags.style.display = 'block';
        } else {
            tags.style.display = 'none';
        }
        
        // Show modal with slide animation
        modal.style.display = 'block';
        document.body.style.overflow = 'hidden';
        
        // Trigger reflow
        modal.offsetHeight;
        
        // Add active class for slide animation
        modal.classList.add('active');
        
        // Scroll to top
        modal.scrollTop = 0;
    }
    
    closeArticleModal() {
        const modal = document.getElementById('article-modal');
        modal.classList.remove('active');
        document.body.style.overflow = '';
        
        // Hide modal after animation completes
        setTimeout(() => {
            if (!modal.classList.contains('active')) {
                modal.style.display = 'none';
            }
        }, 300);
    }
    
    getFullArticleContent(newsId) {
        const fullArticles = {
            1: `
                <h3>Dettagli del Decreto</h3>
                <p>Il Ministero del Turismo, in collaborazione con l'Agenzia delle Entrate, ha finalmente definito le modalità operative per accedere al credito d'imposta destinato alle PMI del settore turistico. Questo importante strumento di sostegno rappresenta un'opportunità concreta per modernizzare e rendere più sostenibili le attività ricettive e di servizio.</p>
                
                <h3>Come Funziona il Credito d'Imposta</h3>
                <p>Il credito d'imposta copre fino al 65% delle spese sostenute per:</p>
                <ul>
                    <li><strong>Digitalizzazione:</strong> Sistemi di prenotazione online, app mobili, sistemi di gestione clienti (CRM), soluzioni di pagamento digitale</li>
                    <li><strong>Efficientamento energetico:</strong> Impianti fotovoltaici, sistemi di riscaldamento/raffreddamento ad alta efficienza, illuminazione LED</li>
                    <li><strong>Sostenibilità ambientale:</strong> Sistemi di raccolta differenziata, riduzione sprechi alimentari, mobilità elettrica</li>
                </ul>
                
                <h3>Requisiti e Scadenze</h3>
                <p>Possono accedere al beneficio le imprese turistiche con fatturato annuo non superiore a 5 milioni di euro. Il credito massimo ottenibile è di 150.000 euro per impresa. Le domande devono essere presentate entro il 31 marzo 2025 attraverso la piattaforma online del Ministero del Turismo.</p>
            `,
            2: `
                <h3>Obiettivi del Bando PNRR</h3>
                <p>Il nuovo bando rappresenta una delle iniziative più ambiziose del Piano Nazionale di Ripresa e Resilienza per sostenere la competitività delle piccole e medie imprese italiane. Con una dotazione di 850 milioni di euro, l'iniziativa punta a modernizzare il tessuto imprenditoriale nazionale attraverso innovazione tecnologica e sostenibilità.</p>
                
                <h3>Settori Ammissibili</h3>
                <p>Il bando si rivolge principalmente a:</p>
                <ul>
                    <li><strong>Commercio al dettaglio:</strong> Modernizzazione punti vendita, e-commerce, omnicanalità</li>
                    <li><strong>Servizi alle imprese:</strong> Consulenza, marketing digitale, servizi IT</li>
                    <li><strong>Turismo e ristorazione:</strong> Digitalizzazione processi, sostenibilità ambientale</li>
                    <li><strong>Artigianato:</strong> Automazione produttiva, design digitale</li>
                </ul>
                
                <h3>Procedura di Presentazione</h3>
                <p>Le domande devono essere presentate esclusivamente online tramite la piattaforma dedicata del MiSE. È richiesta la presentazione di un business plan dettagliato che dimostri la sostenibilità economica e l'impatto innovativo del progetto.</p>
            `,
            3: `
                <h3>Il Programma dell'Evento</h3>
                <p>Il Forum Nazionale PMI 2025 si articola in due giornate intense di confronto e networking. La prima giornata sarà dedicata alle tendenze macroeconomiche e alle opportunità di crescita per le PMI italiane, mentre la seconda giornata si concentrerà su workshop pratici e sessioni di networking settoriali.</p>
                
                <h3>Relatori di Prestigio</h3>
                <p>Tra i relatori confermati:</p>
                <ul>
                    <li><strong>Prof. Mario Draghi:</strong> "L'Europa e il futuro delle PMI"</li>
                    <li><strong>Dott.ssa Christine Lagarde:</strong> Keynote sulla politica monetaria europea</li>
                    <li><strong>CEO di Intesa Sanpaolo:</strong> "Finanza e innovazione per le PMI"</li>
                    <li><strong>Ministro delle Imprese:</strong> "Le nuove politiche industriali italiane"</li>
                </ul>
                
                <h3>Workshop Tematici</h3>
                <p>Sono previsti 12 workshop paralleli su transizione digitale, sostenibilità ambientale, internazionalizzazione, accesso al credito, innovazione e competenze digitali.</p>
            `
        };
        
        return fullArticles[newsId] || '<p><em>Contenuto completo in fase di aggiornamento...</em></p>';
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

// Handle mobile menu
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
