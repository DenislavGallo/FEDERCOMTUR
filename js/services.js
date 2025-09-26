class ServicesPage {
    constructor() {
        this.grid = document.getElementById('services-grid');
        this.services = [];
        this.carousel = null;
        this.init();
    }

    async init() {
        try {
            await this.loadServices();
            this.renderServices();
        } catch (e) {
            console.error('Errore caricamento servizi:', e);
        }
    }

    async loadServices() {
        const res = await fetch('data/services.json', { cache: 'no-cache' });
        this.services = await res.json();
    }

    renderServices() {
        if (!this.grid) return;
        
        // Controlla se siamo nella pagina servizi.html
        const isServicesPage = window.location.pathname.includes('servizi.html');
        
        // Immagini per i servizi
        const serviceImages = [
            "img/scrollstack1.png",
            "img/scrollstack2.png", 
            "img/scrollstack3.png",
            "img/scrollstack4.png"
        ];

        if (isServicesPage) {
            // Layout carousel per pagina servizi.html
            this.renderCarousel(serviceImages);
        } else {
            // Layout card originale per homepage
            this.renderGrid(serviceImages);
        }
    }

    renderCarousel(serviceImages) {
        this.grid.innerHTML = `
            <div class="services-carousel-container">
                <div class="services-carousel-wrapper" id="carousel-wrapper">
                    <div class="services-carousel-track" id="carousel-track">
                        ${this.services.map((service, index) => `
                            <div class="service-carousel-card" data-slug="${service.slug}">
                                <div class="service-icon-wrapper">
                                    ${this.getIcon(service.icon)}
                                </div>
                                <h3>${service.name}</h3>
                                <p>${service.description}</p>
                                <div class="service-carousel-highlights">
                                    <ul>
                                        ${service.highlights.map(highlight => `
                                            <li>${highlight}</li>
                                        `).join('')}
                                    </ul>
                                </div>
                                <div class="service-carousel-actions">
                                    <a href="servizio.html?slug=${encodeURIComponent(service.slug)}" class="service-carousel-cta">
                                        ${service.cta.label}
                                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                            <path d="m9 18 6-6-6-6"/>
                                        </svg>
                                    </a>
                                    <a href="tel:+39123456789" class="service-carousel-call-btn">
                                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="18" height="18">
                                            <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/>
                                        </svg>
                                        Chiamaci ora
                                    </a>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                </div>
                <button class="carousel-nav prev" id="carousel-prev">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="m15 18-6-6 6-6"/>
                    </svg>
                </button>
                <button class="carousel-nav next" id="carousel-next">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="m9 18 6-6-6-6"/>
                    </svg>
                </button>
                <div class="carousel-progress" id="carousel-progress">
                    <div class="carousel-progress-bar" id="carousel-progress-bar">
                        <div class="carousel-progress-fill" id="carousel-progress-fill"></div>
                    </div>
                </div>
            </div>
        `;

        // Inizializza carousel
        this.initCarousel();
    }

    renderGrid(serviceImages) {
        this.grid.innerHTML = this.services.map((s, index) => `
            <div class="service-card" style="animation-delay: ${index * 0.1}s; background-image: url('${serviceImages[index % serviceImages.length]}');" data-slug="${s.slug}">
                <div class="service-section service-section-1">
                    <div class="service-header">
                        <h3 class="service-title">${s.name}</h3>
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
                        <p class="service-description">${s.shortDescription}</p>
                    </div>
                </div>
            </div>
        `).join('');

        // Link alle pagine dettaglio
        this.grid.querySelectorAll('.service-card').forEach(card => {
            card.addEventListener('click', () => {
                const slug = card.getAttribute('data-slug');
                window.location.href = `servizio.html?slug=${encodeURIComponent(slug)}`;
            });
            card.style.cursor = 'pointer';
        });

        // Animate cards in after a short delay
        setTimeout(() => {
            const cards = this.grid.querySelectorAll('.service-card');
            cards.forEach(card => {
                card.style.opacity = '1';
                card.style.transform = 'translateY(0)';
            });
        }, 100);
    }

    initCarousel() {
        const wrapper = document.getElementById('carousel-wrapper');
        const track = document.getElementById('carousel-track');
        const prevBtn = document.getElementById('carousel-prev');
        const nextBtn = document.getElementById('carousel-next');
        const progressBar = document.getElementById('carousel-progress-bar');
        const progressFill = document.getElementById('carousel-progress-fill');

        // Verifica che tutti gli elementi esistano
        if (!wrapper || !track || !prevBtn || !nextBtn || !progressBar || !progressFill) {
            console.error('Elementi carousel non trovati:', {
                wrapper: !!wrapper,
                track: !!track,
                prevBtn: !!prevBtn,
                nextBtn: !!nextBtn,
                progressBar: !!progressBar,
                progressFill: !!progressFill
            });
            console.log('Tutti gli elementi con ID carousel:', document.querySelectorAll('[id*="carousel"]'));
            return;
        }

        let currentIndex = 0;
        let isDragging = false;
        let startX = 0;
        let currentX = 0;
        let initialTransform = 0;

        const cardWidth = 350 + 32; // card width + gap
        const visibleCards = 4; // Mostra sempre 4 servizi
        const maxIndex = Math.max(0, this.services.length - visibleCards);

        const updateCarousel = () => {
            const translateX = -currentIndex * cardWidth;
            track.style.transform = `translateX(${translateX}px)`;
            
            // Update progress bar
            const progressPercentage = (currentIndex / maxIndex) * 100;
            progressFill.style.width = `${progressPercentage}%`;
        };

        const nextSlide = () => {
            if (currentIndex < maxIndex) {
                currentIndex++;
            } else {
                // Scroll infinito: torna alla prima
                currentIndex = 0;
            }
            updateCarousel();
        };

        const prevSlide = () => {
            if (currentIndex > 0) {
                currentIndex--;
            } else {
                // Scroll infinito: vai all'ultima
                currentIndex = maxIndex;
            }
            updateCarousel();
        };

        const snapToNearestCard = () => {
            // Calcola la posizione attuale del track
            const currentTransform = track.style.transform;
            const currentTranslateX = parseFloat(currentTransform.match(/-?\d+/) || 0);
            
            // Calcola l'indice più vicino
            const nearestIndex = Math.round(-currentTranslateX / cardWidth);
            
            // Limita l'indice ai bounds
            const clampedIndex = Math.max(0, Math.min(nearestIndex, maxIndex));
            
            currentIndex = clampedIndex;
            updateCarousel();
        };

        // Event listeners
        nextBtn.addEventListener('click', nextSlide);
        prevBtn.addEventListener('click', prevSlide);

        // Progress bar navigation
        progressBar.addEventListener('click', (e) => {
            const rect = progressBar.getBoundingClientRect();
            const clickX = e.clientX - rect.left;
            const clickPercentage = clickX / rect.width;
            currentIndex = Math.round(clickPercentage * maxIndex);
            updateCarousel();
        });

        // Drag functionality
        track.addEventListener('mousedown', (e) => {
            isDragging = true;
            startX = e.clientX;
            initialTransform = -currentIndex * cardWidth;
            track.style.cursor = 'grabbing';
            e.preventDefault();
        });

        track.addEventListener('mousemove', (e) => {
            if (!isDragging) return;
            
            currentX = e.clientX;
            const diffX = currentX - startX;
            const newTransform = initialTransform + diffX;
            
            track.style.transform = `translateX(${newTransform}px)`;
            track.style.transition = 'none';
        });

        track.addEventListener('mouseup', () => {
            if (!isDragging) return;
            
            isDragging = false;
            track.style.cursor = 'grab';
            track.style.transition = 'transform 0.3s ease';
            
            // Snap alla card più vicina senza scroll infinito
            snapToNearestCard();
        });

        track.addEventListener('mouseleave', () => {
            if (isDragging) {
                isDragging = false;
                track.style.cursor = 'grab';
                track.style.transition = 'transform 0.3s ease';
                snapToNearestCard();
            }
        });

        // Touch support
        track.addEventListener('touchstart', (e) => {
            isDragging = true;
            startX = e.touches[0].clientX;
            initialTransform = -currentIndex * cardWidth;
        });

        track.addEventListener('touchmove', (e) => {
            if (!isDragging) return;
            
            currentX = e.touches[0].clientX;
            const diffX = currentX - startX;
            const newTransform = initialTransform + diffX;
            
            track.style.transform = `translateX(${newTransform}px)`;
            track.style.transition = 'none';
        });

        track.addEventListener('touchend', () => {
            if (!isDragging) return;
            
            isDragging = false;
            track.style.transition = 'transform 0.3s ease';
            
            // Snap alla card più vicina senza scroll infinito
            snapToNearestCard();
        });

        // Keyboard navigation
        document.addEventListener('keydown', (e) => {
            if (e.key === 'ArrowLeft') {
                prevSlide();
            } else if (e.key === 'ArrowRight') {
                nextSlide();
            }
        });

        // Auto-play (opzionale)
        // setInterval(() => {
        //     if (currentIndex < maxIndex) {
        //         nextSlide();
        //     } else {
        //         currentIndex = 0;
        //         updateCarousel();
        //     }
        // }, 5000);
    }

    getIcon(key) {
        const map = {
            tax: `<svg viewBox="0 0 64 64" fill="currentColor" width="48" height="48">
                <path d="M32 4c-1.1 0-2 .9-2 2v6H18c-3.3 0-6 2.7-6 6v36c0 3.3 2.7 6 6 6h28c3.3 0 6-2.7 6-6V18c0-3.3-2.7-6-6-6H34V6c0-1.1-.9-2-2-2zm0 4v6h2c1.1 0 2-.9 2-2s-.9-2-2-2h-2zm-8 12h16c1.1 0 2 .9 2 2s-.9 2-2 2H24c-1.1 0-2-.9-2-2s.9-2 2-2zm0 8h12c1.1 0 2 .9 2 2s-.9 2-2 2H24c-1.1 0-2-.9-2-2s.9-2 2-2zm0 8h8c1.1 0 2 .9 2 2s-.9 2-2 2h-8c-1.1 0-2-.9-2-2s.9-2 2-2z"/>
                <circle cx="44" cy="36" r="3" fill="#10b981"/>
                <path d="M44 32l-8 8 2.8 2.8L44 37.6l5.2 5.2L52 40l-8-8z" fill="#10b981"/>
            </svg>`,
            training: `<svg viewBox="0 0 64 64" fill="currentColor" width="48" height="48">
                <path d="M8 16h48c2.2 0 4 1.8 4 4v28c0 2.2-1.8 4-4 4H8c-2.2 0-4-1.8-4-4V20c0-2.2 1.8-4 4-4z"/>
                <rect x="12" y="24" width="40" height="2" fill="white"/>
                <rect x="12" y="30" width="32" height="2" fill="white"/>
                <rect x="12" y="36" width="24" height="2" fill="white"/>
                <circle cx="32" cy="8" r="6" fill="#10b981"/>
                <path d="M32 54c-4.4 0-8 3.6-8 8h16c0-4.4-3.6-8-8-8z" fill="#10b981"/>
                <path d="M24 48h16v6H24z" fill="#10b981"/>
            </svg>`,
            funding: `<svg viewBox="0 0 64 64" fill="currentColor" width="48" height="48">
                <circle cx="32" cy="32" r="28" fill="#059669"/>
                <path d="M32 12c-1.1 0-2 .9-2 2v7c-5.5.5-10 5.2-10 11 0 1.1.9 2 2 2s2-.9 2-2c0-3.3 2.7-6 6-6h4c3.3 0 6 2.7 6 6s-2.7 6-6 6h-4c-6.6 0-12 5.4-12 12s5.4 12 12 12h4v7c0 1.1.9 2 2 2s2-.9 2-2v-7c5.5-.5 10-5.2 10-11 0-1.1-.9-2-2-2s-2 .9-2 2c0 3.3-2.7 6-6 6h-4c-3.3 0-6-2.7-6-6s2.7-6 6-6h4c6.6 0 12-5.4 12-12s-5.4-12-12-12h-4v-7c0-1.1-.9-2-2-2z" fill="white"/>
            </svg>`,
            union: `<svg viewBox="0 0 64 64" fill="currentColor" width="48" height="48">
                <path d="M32 4L16 16v32c0 2.2 1.8 4 4 4h24c2.2 0 4-1.8 4-4V16L32 4z"/>
                <rect x="24" y="24" width="16" height="2" fill="white"/>
                <rect x="24" y="30" width="16" height="2" fill="white"/>
                <rect x="24" y="36" width="16" height="2" fill="white"/>
                <circle cx="32" cy="42" r="3" fill="#10b981"/>
                <path d="M20 56h24c2.2 0 4 1.8 4 4v4H16v-4c0-2.2 1.8-4 4-4z" fill="#10b981"/>
                <path d="M28 18h8v4h-8z" fill="#10b981"/>
                <circle cx="26" cy="20" r="2" fill="white"/>
                <circle cx="38" cy="20" r="2" fill="white"/>
            </svg>`,
            digital: `<svg viewBox="0 0 64 64" fill="currentColor" width="48" height="48">
                <rect x="8" y="12" width="48" height="32" rx="4" fill="#10b981"/>
                <rect x="12" y="16" width="40" height="24" rx="2" fill="white"/>
                <circle cx="20" cy="20" r="2" fill="#10b981"/>
                <circle cx="28" cy="20" r="2" fill="#10b981"/>
                <circle cx="36" cy="20" r="2" fill="#10b981"/>
                <rect x="12" y="26" width="40" height="2" fill="#10b981"/>
                <rect x="12" y="32" width="32" height="2" fill="#10b981"/>
                <rect x="12" y="38" width="24" height="2" fill="#10b981"/>
                <path d="M32 8c-2.2 0-4 1.8-4 4v4h8v-4c0-2.2-1.8-4-4-4z" fill="#10b981"/>
                <path d="M32 52c-2.2 0-4-1.8-4-4v-4h8v4c0 2.2-1.8 4-4 4z" fill="#10b981"/>
            </svg>`,
            hr: `<svg viewBox="0 0 64 64" fill="currentColor" width="48" height="48">
                <circle cx="32" cy="16" r="8" fill="#10b981"/>
                <path d="M16 32c0-8.8 7.2-16 16-16s16 7.2 16 16v16H16V32z" fill="#10b981"/>
                <rect x="20" y="48" width="24" height="8" rx="2" fill="#10b981"/>
                <rect x="24" y="52" width="16" height="2" fill="white"/>
                <circle cx="20" cy="20" r="2" fill="white"/>
                <circle cx="44" cy="20" r="2" fill="white"/>
                <path d="M20 24h24v2H20z" fill="white"/>
                <path d="M20 28h20v2H20z" fill="white"/>
            </svg>`,
            environment: `<svg viewBox="0 0 64 64" fill="currentColor" width="48" height="48">
                <path d="M32 4c-8.8 0-16 7.2-16 16 0 8 6 14.5 14 15.8V56h4V35.8c8-.3 14-7.8 14-15.8 0-8.8-7.2-16-16-16z" fill="#10b981"/>
                <circle cx="24" cy="20" r="3" fill="white"/>
                <circle cx="40" cy="20" r="3" fill="white"/>
                <circle cx="32" cy="28" r="2" fill="white"/>
                <path d="M20 32c0-6.6 5.4-12 12-12s12 5.4 12 12" stroke="white" stroke-width="2" fill="none"/>
                <path d="M16 48h32v4H16z" fill="#10b981"/>
                <rect x="20" y="52" width="24" height="4" rx="1" fill="#10b981"/>
            </svg>`,
            international: `<svg viewBox="0 0 64 64" fill="currentColor" width="48" height="48">
                <circle cx="32" cy="32" r="24" fill="#10b981"/>
                <path d="M32 8c-13.3 0-24 10.7-24 24s10.7 24 24 24 24-10.7 24-24S45.3 8 32 8z" fill="none" stroke="white" stroke-width="2"/>
                <path d="M8 32h48M32 8v48" stroke="white" stroke-width="1"/>
                <path d="M20 20c8-8 16-8 24 0M20 44c8 8 16 8 24 0M44 20c-8-8-16-8-24 0M44 44c-8 8-16 8-24 0" stroke="white" stroke-width="1" fill="none"/>
                <circle cx="32" cy="32" r="4" fill="white"/>
                <path d="M28 28l8 8M36 28l-8 8" stroke="white" stroke-width="2"/>
            </svg>`
        };
        return map[key] || '';
    }
}

document.addEventListener('DOMContentLoaded', () => new ServicesPage());


