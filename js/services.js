class ServicesPage {
    constructor() {
        this.grid = document.getElementById('services-grid');
        this.services = [];
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
            // Layout layered per pagina servizi.html
            this.grid.innerHTML = this.services.map((service, index) => `
                <div class="service-container" style="animation-delay: ${index * 0.2}s;" data-slug="${service.slug}">
                    <div class="service-inner">
                        <div class="service-content">
                            <div class="service-icon-wrapper">
                                ${this.getIcon(service.icon)}
                            </div>
                            <h3 class="service-title">${service.name}</h3>
                            <p class="service-description">${service.description}</p>
                            <div class="service-highlights">
                                <ul>
                                    ${service.highlights.map(highlight => `
                                        <li>${highlight}</li>
                                    `).join('')}
                                </ul>
                            </div>
                            <div class="service-actions">
                                <a href="servizio.html?slug=${encodeURIComponent(service.slug)}" class="service-cta">
                                    ${service.cta.label}
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                        <path d="m9 18 6-6-6-6"/>
                                    </svg>
                                </a>
                                <a href="tel:+39123456789" class="call-now-btn">
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="18" height="18">
                                        <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/>
                                    </svg>
                                    Chiamaci ora
                                </a>
                            </div>
                        </div>
                        <div class="service-image">
                            <img src="${serviceImages[index % serviceImages.length]}" alt="${service.name}" loading="lazy">
                        </div>
                    </div>
                </div>
            `).join('');

            // Animate containers in after a short delay
            setTimeout(() => {
                const containers = this.grid.querySelectorAll('.service-container');
                containers.forEach((container, index) => {
                    setTimeout(() => {
                        container.style.opacity = '1';
                        container.style.transform = 'translateY(0)';
                    }, index * 200);
                });
            }, 300);
        } else {
            // Layout card originale per homepage
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
            </svg>`
        };
        return map[key] || '';
    }
}

document.addEventListener('DOMContentLoaded', () => new ServicesPage());


