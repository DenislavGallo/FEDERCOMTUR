/**
 * FederComTur - Main JavaScript
 * =============================
 */

'use strict';

// Global App Object
const FederComTur = {
    // Configuration
    config: {
        scrollThreshold: 100,
        animationDuration: 0.6,
        mobileBreakpoint: 768,
        newsApiUrl: '/api/news.json', // Placeholder for future API
        emailApiUrl: '/api/subscribe.php' // Placeholder for future API
    },
    
    // State management
    state: {
        isScrolled: false,
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
        // Scroll events
        window.addEventListener('scroll', this.throttle(this.handleScroll.bind(this), 16));
        
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
        
        // Form submission
        if (this.elements.newsletterForm) {
            this.elements.newsletterForm.addEventListener('submit', this.handleNewsletterSubmit.bind(this));
        }
        
        // Keyboard navigation
        document.addEventListener('keydown', this.handleKeyboard.bind(this));
        
        // Focus management for accessibility
        document.addEventListener('focusin', this.handleFocusIn.bind(this));
        document.addEventListener('focusout', this.handleFocusOut.bind(this));
    },
    
    // Initialize components
    initComponents() {
        this.initNavbar();
        this.initNewsletterSection();
        this.initSmoothScrolling();
        this.initAccessibility();
    },
    
    // Initialize navbar functionality
    initNavbar() {
        // Set initial state
        this.updateNavbarState();
        
        // Add magnetic effect to interactive elements
        this.initMagneticButtons();
    },
    
    // Handle scroll events
    handleScroll() {
        const scrollY = window.pageYOffset;
        const wasScrolled = this.state.isScrolled;
        
        // Update scroll state
        this.state.isScrolled = scrollY > this.config.scrollThreshold;
        
        // Only update if state changed
        if (wasScrolled !== this.state.isScrolled) {
            this.updateNavbarState();
        }
        
        // Newsletter section background transition
        this.updateNewsletterSection();
        
        // Parallax effect removed to avoid conflict with GSAP ScrollTrigger
    },
    
    // Update navbar state based on scroll
    updateNavbarState() {
        if (!this.elements.navbar) return;
        
        if (this.state.isScrolled) {
            this.elements.navbar.classList.add('scrolled');
        } else {
            this.elements.navbar.classList.remove('scrolled');
        }
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
    loadNewsData() {
        // Mock news data - più realistico per una federazione
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
        
        this.renderNewsCards(mockNews.slice(0, 6)); // Mostra le prime 6 notizie
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
                    <a href="#" class="news-link" aria-label="Leggi l'articolo: ${news.title}">
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
    
    // Handle newsletter form submission
    handleNewsletterSubmit(e) {
        e.preventDefault();
        
        const formData = new FormData(e.target);
        const email = formData.get('email');
        const consent = formData.get('consent');
        const honeypot = formData.get('website');
        
        // Basic validation
        if (!this.validateNewsletterForm(email, consent, honeypot)) {
            return;
        }
        
        this.submitNewsletter(email);
    },
    
    // Validate newsletter form
    validateNewsletterForm(email, consent, honeypot) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        let isValid = true;
        
        // Clear previous errors
        this.clearFormErrors();
        
        // Honeypot check (spam protection)
        if (honeypot) {
            console.warn('Spam attempt detected');
            return false;
        }
        
        // Email validation
        if (!email || !emailRegex.test(email)) {
            this.showFieldError('email', 'Inserisci un indirizzo email valido');
            isValid = false;
        }
        
        // Consent validation
        if (!consent) {
            this.showFormError('Devi accettare la privacy policy per continuare');
            isValid = false;
        }
        
        return isValid;
    },
    
    // Submit newsletter subscription
    async submitNewsletter(email) {
        const submitButton = document.getElementById('newsletter-submit');
        const formStatus = document.getElementById('form-status');
        
        // Show loading state
        submitButton.classList.add('loading');
        submitButton.disabled = true;
        
        try {
            // Simulate API call (replace with actual endpoint)
            await new Promise(resolve => setTimeout(resolve, 2000));
            
            // Success
            this.showFormSuccess('Grazie! Ti sei iscritto con successo alla newsletter.');
            this.elements.newsletterForm.reset();
            
        } catch (error) {
            console.error('Newsletter subscription error:', error);
            this.showFormError('Si è verificato un errore. Riprova più tardi.');
        } finally {
            // Remove loading state
            submitButton.classList.remove('loading');
            submitButton.disabled = false;
        }
    },
    
    // Form error/success handlers
    clearFormErrors() {
        document.querySelectorAll('.error-message').forEach(el => {
            el.classList.remove('show');
            el.textContent = '';
        });
        
        const formStatus = document.getElementById('form-status');
        if (formStatus) {
            formStatus.className = 'form-status';
            formStatus.style.display = 'none';
        }
    },
    
    showFieldError(fieldName, message) {
        const errorEl = document.getElementById(`${fieldName}-error`);
        if (errorEl) {
            errorEl.textContent = message;
            errorEl.classList.add('show');
        }
    },
    
    showFormError(message) {
        const formStatus = document.getElementById('form-status');
        if (formStatus) {
            formStatus.className = 'form-status error';
            formStatus.textContent = message;
            formStatus.style.display = 'block';
        }
    },
    
    showFormSuccess(message) {
        const formStatus = document.getElementById('form-status');
        if (formStatus) {
            formStatus.className = 'form-status success';
            formStatus.textContent = message;
            formStatus.style.display = 'block';
        }
    },
    
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
    
    // Services Carousel functionality
    initServicesCarousel() {
        const carousel = document.querySelector('.services-carousel');
        if (!carousel) return;
        
        const cards = carousel.querySelectorAll('.service-card');
        const dots = carousel.querySelectorAll('.dot');
        let currentIndex = 0;
        
        // Auto-rotation settings
        const ROTATION_INTERVAL = 3000; // 3 seconds
        const PAUSE_ON_HOVER = true;
        
        // Store interval reference
        this.carouselInterval = null;
        
        // Initialize carousel
        this.updateCarouselPosition(cards, dots, currentIndex);
        this.startAutoRotation(cards, dots, ROTATION_INTERVAL);
        
        // Dot navigation
        dots.forEach((dot, index) => {
            dot.addEventListener('click', () => {
                this.goToSlide(cards, dots, index);
                this.resetAutoRotation(cards, dots, ROTATION_INTERVAL);
            });
        });
        
        // Card click navigation
        cards.forEach((card, index) => {
            card.addEventListener('click', () => {
                this.goToSlide(cards, dots, index);
                this.resetAutoRotation(cards, dots, ROTATION_INTERVAL);
            });
        });
        
        // Pause on hover
        if (PAUSE_ON_HOVER) {
            carousel.addEventListener('mouseenter', () => {
                this.pauseAutoRotation();
            });
            
            carousel.addEventListener('mouseleave', () => {
                this.startAutoRotation(cards, dots, ROTATION_INTERVAL);
            });
        }
        
        // Store methods for external access
        this.servicesCarousel = {
            goToSlide: (index) => this.goToSlide(cards, dots, index),
            nextSlide: () => this.nextSlide(cards, dots),
            prevSlide: () => this.prevSlide(cards, dots),
            pause: () => this.pauseAutoRotation(),
            resume: () => this.startAutoRotation(cards, dots, ROTATION_INTERVAL)
        };
    },
    
    updateCarouselPosition(cards, dots, activeIndex) {
        cards.forEach((card, index) => {
            card.classList.remove('active', 'prev', 'next');
            
            if (index === activeIndex) {
                card.classList.add('active');
            } else if (index === (activeIndex - 1 + cards.length) % cards.length) {
                card.classList.add('prev');
            } else if (index === (activeIndex + 1) % cards.length) {
                card.classList.add('next');
            }
        });
        
        dots.forEach((dot, index) => {
            dot.classList.toggle('active', index === activeIndex);
        });
    },
    
    goToSlide(cards, dots, targetIndex) {
        const totalCards = cards.length;
        const currentIndex = Array.from(cards).findIndex(card => card.classList.contains('active'));
        
        if (targetIndex === currentIndex) return;
        
        // Update position
        this.updateCarouselPosition(cards, dots, targetIndex);
        
        // Add transition effect
        cards.forEach(card => {
            card.style.transition = 'all 0.8s cubic-bezier(0.25, 0.46, 0.45, 0.94)';
        });
        
        setTimeout(() => {
            cards.forEach(card => {
                card.style.transition = '';
            });
        }, 800);
    },
    
    nextSlide(cards, dots) {
        const currentIndex = Array.from(cards).findIndex(card => card.classList.contains('active'));
        const nextIndex = (currentIndex + 1) % cards.length;
        this.goToSlide(cards, dots, nextIndex);
    },
    
    prevSlide(cards, dots) {
        const currentIndex = Array.from(cards).findIndex(card => card.classList.contains('active'));
        const prevIndex = (currentIndex - 1 + cards.length) % cards.length;
        this.goToSlide(cards, dots, prevIndex);
    },
    
    startAutoRotation(cards, dots, interval) {
        this.pauseAutoRotation(); // Clear any existing interval
        
        this.carouselInterval = setInterval(() => {
            this.nextSlide(cards, dots);
        }, interval);
    },
    
    pauseAutoRotation() {
        if (this.carouselInterval) {
            clearInterval(this.carouselInterval);
            this.carouselInterval = null;
        }
    },
    
    resetAutoRotation(cards, dots, interval) {
        this.pauseAutoRotation();
        this.startAutoRotation(cards, dots, interval);
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
    }
};

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    FederComTur.init();
});

// Export for potential module usage
if (typeof module !== 'undefined' && module.exports) {
    module.exports = FederComTur;
}
