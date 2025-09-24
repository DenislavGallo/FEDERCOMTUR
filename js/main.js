/**
 * FederComTur - Main JavaScript
 * =============================
 */

'use strict';

// Global App Object
const FederComTur = {
    // Configuration
    config: {
        animationDuration: 0.6,
        mobileBreakpoint: 768,
        newsApiUrl: '/api/news.json', // Placeholder for future API
        emailApiUrl: '/api/subscribe.php' // Placeholder for future API
    },
    
    // State management
    state: {
        isMobileMenuOpen: false,
        isNewsletterDarkMode: false
    },
    
    // DOM elements cache
    elements: {},
    
    // Initialize the application
    init() {
        console.log('🚀 FederComTur initializing...');
        
        this.cacheElements();
        this.bindEvents();
        this.initComponents();
        this.loadNewsData();
        this.initServicesCarousel();
        
        console.log('✅ FederComTur initialized successfully');
    },
    
    // Cache frequently used DOM elements
    cacheElements() {
        this.elements = {
            // Navigation
            navbar: document.getElementById('navbar'),
            mobileMenuToggle: document.querySelector('.mobile-menu-toggle'),
            navbarMenu: document.querySelector('.navbar-menu'),
            
            // Hero section
            heroTitle: document.getElementById('hero-title'),
            heroIllustration: document.getElementById('hero-illustration'),
            newsletterCta: document.getElementById('newsletter-cta'),
            
            // News feed
            newsCards: document.getElementById('news-cards'),
            
            // Newsletter section
            newsletterSection: document.getElementById('newsletter-section'),
            newsletterForm: document.getElementById('newsletter-form'),
            
            // General
            body: document.body,
            window: window
        };
    },
    
    // Bind event listeners
    bindEvents() {
        // Rimossi gli eventi di scroll per la navbar
        
        // Mobile menu toggle
        if (this.elements.mobileMenuToggle) {
            this.elements.mobileMenuToggle.addEventListener('click', this.toggleMobileMenu.bind(this));
        }
        
        // Close mobile menu on link click
        if (this.elements.navbarMenu) {
            this.elements.navbarMenu.addEventListener('click', (e) => {
                if (e.target.tagName === 'A') {
                    this.closeMobileMenu();
                }
            });
        }
        
        // Newsletter CTA smooth scroll
        if (this.elements.newsletterCta) {
            this.elements.newsletterCta.addEventListener('click', this.scrollToNewsletter.bind(this));
        }
        
        // Resize events
        window.addEventListener('resize', this.throttle(this.handleResize.bind(this), 250));
        
        // Form submission - Gestito da newsletter.js (rimuovo duplicato)
        // if (this.elements.newsletterForm) {
        //     this.elements.newsletterForm.addEventListener('submit', this.handleNewsletterSubmit.bind(this));
        // }
        
        // Keyboard navigation
        document.addEventListener('keydown', this.handleKeyboard.bind(this));
        
        // Focus management for accessibility
        document.addEventListener('focusin', this.handleFocusIn.bind(this));
        document.addEventListener('focusout', this.handleFocusOut.bind(this));
    },
    
    // Initialize components
    initComponents() {
        // Rimossa l'inizializzazione della navbar sticky
        this.initNewsletterSection();
        this.initSmoothScrolling();
        this.initAccessibility();
    },
    
    // Toggle mobile menu
    toggleMobileMenu() {
        this.state.isMobileMenuOpen = !this.state.isMobileMenuOpen;
        
        if (this.state.isMobileMenuOpen) {
            this.openMobileMenu();
        } else {
            this.closeMobileMenu();
        }
    },
    
    // Open mobile menu
    openMobileMenu() {
        this.elements.mobileMenuToggle.classList.add('active');
        this.elements.mobileMenuToggle.setAttribute('aria-expanded', 'true');
        this.elements.navbarMenu.classList.add('active');
        
        // Prevent body scroll
        this.elements.body.style.overflow = 'hidden';
        
        // Focus first menu item
        const firstMenuItem = this.elements.navbarMenu.querySelector('a');
        if (firstMenuItem) {
            firstMenuItem.focus();
        }
    },
    
    // Close mobile menu
    closeMobileMenu() {
        this.state.isMobileMenuOpen = false;
        this.elements.mobileMenuToggle.classList.remove('active');
        this.elements.mobileMenuToggle.setAttribute('aria-expanded', 'false');
        this.elements.navbarMenu.classList.remove('active');
        
        // Restore body scroll
        this.elements.body.style.overflow = '';
    },
    
    // Initialize newsletter section
    initNewsletterSection() {
        if (!this.elements.newsletterSection) return;
        
        // Set up intersection observer for background transition
        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach(entry => {
                    if (entry.intersectionRatio > 0.5) {
                        this.elements.newsletterSection.classList.add('dark-mode');
                        this.state.isNewsletterDarkMode = true;
                    } else {
                        this.elements.newsletterSection.classList.remove('dark-mode');
                        this.state.isNewsletterDarkMode = false;
                    }
                });
            },
            { threshold: 0.5 }
        );
        
        observer.observe(this.elements.newsletterSection);
    },
    
    // Update newsletter section based on scroll
    updateNewsletterSection() {
        if (!this.elements.newsletterSection) return;
        
        const rect = this.elements.newsletterSection.getBoundingClientRect();
        const windowHeight = window.innerHeight;
        const triggerPoint = windowHeight * 0.5;
        
        const shouldBeDark = rect.top < triggerPoint && rect.bottom > triggerPoint;
        
        if (shouldBeDark !== this.state.isNewsletterDarkMode) {
            this.state.isNewsletterDarkMode = shouldBeDark;
            
            if (shouldBeDark) {
                this.elements.newsletterSection.classList.add('dark-mode');
            } else {
                this.elements.newsletterSection.classList.remove('dark-mode');
            }
        }
    },
    
    // Scroll to newsletter section
    scrollToNewsletter(e) {
        e.preventDefault();
        
        if (this.elements.newsletterSection) {
            this.elements.newsletterSection.scrollIntoView({
                behavior: 'smooth',
                block: 'center'
            });
        }
    },
    
    // Initialize smooth scrolling for anchor links
    initSmoothScrolling() {
        document.querySelectorAll('a[href^="#"]').forEach(anchor => {
            anchor.addEventListener('click', (e) => {
                const href = anchor.getAttribute('href');
                if (href === '#') return;
                
                const target = document.querySelector(href);
                if (target) {
                    e.preventDefault();
                    target.scrollIntoView({
                        behavior: 'smooth',
                        block: 'start'
                    });
                }
            });
        });
    },
    
    // Initialize magnetic button effects
    initMagneticButtons() {
        const magneticElements = document.querySelectorAll('.magnetic');
        
        magneticElements.forEach(element => {
            element.addEventListener('mousemove', (e) => {
                const rect = element.getBoundingClientRect();
                const x = e.clientX - rect.left - rect.width / 2;
                const y = e.clientY - rect.top - rect.height / 2;
                
                const distance = Math.sqrt(x * x + y * y);
                const maxDistance = 50;
                
                if (distance < maxDistance) {
                    const strength = (maxDistance - distance) / maxDistance;
                    const translateX = x * strength * 0.3;
                    const translateY = y * strength * 0.3;
                    
                    element.style.transform = `translate(${translateX}px, ${translateY}px)`;
                }
            });
            
            element.addEventListener('mouseleave', () => {
                element.style.transform = '';
            });
        });
    },
    
    // Load news data (mock for now)
    async loadNewsData() {
        try {
            // Carica le notizie in evidenza dall'API
            const response = await fetch('http://localhost:8000/api/news-data.php?featured=true&limit=6');
            const data = await response.json();
            
            if (data.success && data.data.length > 0) {
                // Converte i dati dall'API nel formato atteso
                const newsData = data.data.map(item => ({
                    id: item.id,
                    title: item.title,
                    category: item.category.name,
                    date: item.date_formatted.split(' ').reverse().join('-'),
                    dateFormatted: item.date_formatted,
                    excerpt: item.excerpt,
                    readTime: item.read_time
                }));
                
                this.renderNewsCards(newsData);
                console.log('Notizie caricate dall\'API:', newsData.length);
                
            } else {
                // Fallback con dati mock se l'API non restituisce notizie
                console.log('API non disponibile o nessuna notizia, uso dati mock');
                this.loadMockNewsData();
            }
            
        } catch (error) {
            console.error('Error loading news from API:', error);
            console.log('Fallback: caricamento dati mock');
            this.loadMockNewsData();
        }
    },
    
    // Dati mock come fallback
    loadMockNewsData() {
        const mockNews = [
            {
                id: 1,
                title: "Decreto Credito d'Imposta: Nuove Opportunità per PMI del Turismo",
                category: "normative",
                date: "2024-12-18",
                dateFormatted: "18 Dicembre 2024",
                excerpt: "Il Ministero del Turismo ha pubblicato i dettagli operativi per il credito d'imposta del 65% per investimenti in digitalizzazione e sostenibilità. Risorse per 200 milioni nel biennio 2025-2026.",
                readTime: "6 min"
            },
            {
                id: 2,
                title: "Bando PNRR Competitività PMI: 850 Milioni per Commercio e Servizi",
                category: "bandi",
                date: "2024-12-15",
                dateFormatted: "15 Dicembre 2024",
                excerpt: "Aperto il bando del MiSE per progetti di innovazione e competitività. Contributi a fondo perduto fino a 500.000 euro per impresa. Scadenza presentazione domande: 28 febbraio 2025.",
                readTime: "8 min"
            },
            {
                id: 3,
                title: "Forum Nazionale PMI 2025: 'Innovazione e Crescita Sostenibile'",
                category: "eventi",
                date: "2024-12-12",
                dateFormatted: "12 Dicembre 2024",
                excerpt: "Il 20-21 marzo 2025 a Milano si terrà il Forum Nazionale PMI organizzato da FederComTur. Attesi 500 imprenditori e 50 relatori internazionali.",
                readTime: "5 min"
            },
            {
                id: 4,
                title: "Osservatorio Mercato: Commercio +7,2% nel 2024, Turismo +15,8%",
                category: "mercato",
                date: "2024-12-10",
                dateFormatted: "10 Dicembre 2024",
                excerpt: "I dati dell'Osservatorio FederComTur confermano la crescita sostenuta dei settori rappresentati. Il turismo traina la ripresa con performance superiori al periodo pre-pandemia.",
                readTime: "7 min"
            },
            {
                id: 5,
                title: "Accordo Quadro Confturismo-FederComTur per Rappresentanza Unitaria",
                category: "normative",
                date: "2024-12-08",
                dateFormatted: "8 Dicembre 2024",
                excerpt: "Siglato accordo strategico per rafforzare la rappresentanza delle imprese turistiche presso le istituzioni nazionali ed europee.",
                readTime: "4 min"
            },
            {
                id: 6,
                title: "Webinar Gratuito: 'Export Digitale per PMI del Made in Italy'",
                category: "eventi",
                date: "2024-12-05",
                dateFormatted: "5 Dicembre 2024",
                excerpt: "Il 16 gennaio 2025 webinar gratuito con ICE-Agenzia e Google per scoprire strumenti e strategie per l'internazionalizzazione digitale delle PMI italiane.",
                readTime: "3 min"
            }
        ];
        
        this.renderNewsCards(mockNews.slice(0, 6));
    },
    
    // Render news cards
    renderNewsCards(newsData) {
        if (!this.elements.newsCards || !newsData) return;
        
        const cardsHTML = newsData.map((news, index) => `
            <article class="news-card card-stagger" style="animation-delay: ${index * 0.1}s">
                <div class="news-card-header">
                    <span class="news-badge ${news.category}">${this.getCategoryLabel(news.category)}</span>
                    <time class="news-date" datetime="${news.date}">${news.dateFormatted}</time>
                </div>
                
                <h3 class="news-title">${news.title}</h3>
                <p class="news-excerpt">${news.excerpt}</p>
                
                <div class="news-footer">
                    <a href="notizie.html?id=${news.id}" class="news-link" aria-label="Leggi l'articolo: ${news.title}">
                        <span>Leggi tutto</span>
                        <svg class="btn-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="m9 18 6-6-6-6"/>
                        </svg>
                    </a>
                    <div class="news-meta">
                        <span class="read-time">${news.readTime}</span>
                    </div>
                </div>
            </article>
        `).join('');
        
        this.elements.newsCards.innerHTML = cardsHTML;
        
        // Animate cards in
        setTimeout(() => {
            document.querySelectorAll('.card-stagger').forEach(card => {
                card.classList.add('animate-in');
            });
        }, 100);
    },
    
    // Get category label in Italian
    getCategoryLabel(category) {
        const labels = {
            normative: 'Normative',
            bandi: 'Bandi',
            eventi: 'Eventi',
            mercato: 'Mercato'
        };
        return labels[category] || category;
    },
    
    // DEPRECATED: Newsletter form handling spostato in newsletter.js
    // handleNewsletterSubmit() - RIMOSSO per evitare conflitti
    
    // DEPRECATED: Newsletter validation spostato in newsletter.js
    // validateNewsletterForm() - RIMOSSO per evitare conflitti
    
    // DEPRECATED: Newsletter submission spostato in newsletter.js  
    // submitNewsletter() - RIMOSSO per evitare conflitti
    
    // DEPRECATED: Form error/success handlers spostati in newsletter.js
    // clearFormErrors(), showFieldError(), showFormError(), showFormSuccess() - RIMOSSI
    
    // Handle resize events
    handleResize() {
        // Close mobile menu on resize to desktop
        if (window.innerWidth > this.config.mobileBreakpoint && this.state.isMobileMenuOpen) {
            this.closeMobileMenu();
        }
    },
    
    // Handle keyboard navigation
    handleKeyboard(e) {
        // ESC key closes mobile menu
        if (e.key === 'Escape' && this.state.isMobileMenuOpen) {
            this.closeMobileMenu();
            this.elements.mobileMenuToggle.focus();
        }
        
        // Tab navigation in mobile menu
        if (this.state.isMobileMenuOpen && e.key === 'Tab') {
            const focusableElements = this.elements.navbarMenu.querySelectorAll('a');
            const firstElement = focusableElements[0];
            const lastElement = focusableElements[focusableElements.length - 1];
            
            if (e.shiftKey && document.activeElement === firstElement) {
                e.preventDefault();
                lastElement.focus();
            } else if (!e.shiftKey && document.activeElement === lastElement) {
                e.preventDefault();
                firstElement.focus();
            }
        }
    },
    
    // Initialize accessibility features
    initAccessibility() {
        // Skip link functionality
        const skipLink = document.querySelector('.skip-link');
        if (skipLink) {
            skipLink.addEventListener('click', (e) => {
                e.preventDefault();
                const target = document.getElementById('main-content');
                if (target) {
                    target.focus();
                    target.scrollIntoView({ behavior: 'smooth' });
                }
            });
        }
        
        // Ensure main content is focusable for skip link
        const mainContent = document.getElementById('main-content');
        if (mainContent) {
            mainContent.setAttribute('tabindex', '-1');
        }
    },
    
    // Handle focus in events
    handleFocusIn(e) {
        // Add focus-visible class for keyboard navigation
        if (e.target.matches('button, a, input, textarea, select')) {
            e.target.classList.add('focus-visible');
        }
    },
    
    // Handle focus out events
    handleFocusOut(e) {
        e.target.classList.remove('focus-visible');
    },
    
    // Utility: Throttle function
    throttle(func, limit) {
        let inThrottle;
        return function() {
            const args = arguments;
            const context = this;
            if (!inThrottle) {
                func.apply(context, args);
                inThrottle = true;
                setTimeout(() => inThrottle = false, limit);
            }
        }
    },
    
    // Services Grid functionality
    initServicesCarousel() {
        this.loadServicesData();
    },

    // Load services data and render grid
    loadServicesData() {
        const servicesData = [
            {
                id: 1,
                title: "Consulenza Fiscale",
                description: "Supporto completo per la gestione fiscale delle PMI con consulenti specializzati nel settore commercio, turismo e servizi.",
                icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
                </svg>`,
                link: "#consulenza-fiscale"
            },
            {
                id: 2,
                title: "Formazione Professionale",
                description: "Corsi di aggiornamento e specializzazione per imprenditori e dipendenti del settore, con certificazioni riconosciute.",
                icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M22 10v6M2 10l10-5 10 5-10 5z"/>
                    <path d="M6 12v5c3 3 9 3 12 0v-5"/>
                </svg>`,
                link: "#formazione"
            },
            {
                id: 3,
                title: "Rappresentanza Sindacale",
                description: "Tutela degli interessi delle imprese associate presso istituzioni nazionali ed europee con attività di lobbying mirata.",
                icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M3 21h18"/>
                    <path d="M5 21V7l8-4v18"/>
                    <path d="M19 21V11l-6-4"/>
                </svg>`,
                link: "#rappresentanza"
            },
            {
                id: 4,
                title: "Networking Business",
                description: "Eventi, incontri e opportunità di networking per favorire partnership e collaborazioni tra imprese associate.",
                icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/>
                    <circle cx="9" cy="7" r="4"/>
                    <path d="M22 21v-2a4 4 0 0 0-3-3.87"/>
                    <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
                </svg>`,
                link: "#networking"
            }
        ];

        this.renderServicesGrid(servicesData);
    },

    // Render services grid
    renderServicesGrid(servicesData) {
        const servicesGrid = document.getElementById('services-grid');
        if (!servicesGrid || !servicesData) return;

        const backgroundImages = [
            'img/scrollstack1.png',
            'img/scrollstack2.png', 
            'img/scrollstack3.png',
            'img/scrollstack4.png'
        ];

        const serviceTitles = [
            "Consulenza Fiscale",
            "Formazione Professionale", 
            "Rappresentanza Sindacale",
            "Networking Business"
        ];

        const serviceDescriptions = [
            "Supporto fiscale completo per PMI del settore commercio, turismo e servizi",
            "Corsi di aggiornamento e certificazioni per imprenditori e dipendenti",
            "Tutela interessi presso istituzioni nazionali ed europee",
            "Eventi e networking per partnership e collaborazioni business"
        ];

        const cardsHTML = servicesData.map((service, index) => `
            <div class="service-card" style="animation-delay: ${index * 0.1}s; background-image: url('${backgroundImages[index]}');">
                <div class="service-section service-section-1">
                    <div class="service-header">
                        <h3 class="service-title">${serviceTitles[index]}</h3>
                        <div class="service-arrow">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <path d="m7 17 10-10"/>
                                <path d="M7 7h10v10"/>
                            </svg>
                        </div>
                    </div>
                </div>
                <div class="service-section service-section-2"></div>
                <div class="service-section service-section-3">
                    <div class="service-inner-div">
                        <p class="service-description">${serviceDescriptions[index]}</p>
                    </div>
                </div>
            </div>
        `).join('');

        servicesGrid.innerHTML = cardsHTML;

        // Animate cards in after a short delay
        setTimeout(() => {
            const cards = servicesGrid.querySelectorAll('.service-card');
            cards.forEach(card => {
                card.style.opacity = '1';
                card.style.transform = 'translateY(0)';
            });
        }, 100);
    },

    // Utility: Debounce function
    debounce(func, wait, immediate) {
        let timeout;
        return function() {
            const context = this;
            const args = arguments;
            const later = function() {
                timeout = null;
                if (!immediate) func.apply(context, args);
            };
            const callNow = immediate && !timeout;
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
            if (callNow) func.apply(context, args);
        };
    },
    
}; // Chiusura dell'oggetto FederComTur

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    FederComTur.init();
});

// Export for potential module usage
if (typeof module !== 'undefined' && module.exports) {
    module.exports = FederComTur;
}
