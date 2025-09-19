/**
 * Newsletter Popup Manager
 * Gestisce l'apparizione automatica del modal newsletter
 */

class NewsletterPopup {
    constructor() {
        this.cookieName = 'newsletter_popup_shown';
        this.cookieExpireDays = 30;
        this.showDelay = 30000; // 30 secondi
        this.isShown = false;
        
        this.init();
    }
    
    init() {
        // Crea il modal se non esiste
        this.createModal();
        
        // Controlla se deve essere mostrato
        if (!this.hasBeenShown()) {
            this.scheduleShow();
        }
        
        // Setup event listeners
        this.setupEventListeners();
    }
    
    createModal() {
        // Controlla se il modal esiste già
        if (document.getElementById('newsletter-popup')) {
            return;
        }
        
        const modal = document.createElement('div');
        modal.id = 'newsletter-popup';
        modal.className = 'newsletter-popup';
        
        modal.innerHTML = `
            <div class="newsletter-popup-content">
                <div class="newsletter-popup-header">
                    <button class="newsletter-popup-close" id="newsletter-popup-close">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <line x1="18" y1="6" x2="6" y2="18"></line>
                            <line x1="6" y1="6" x2="18" y2="18"></line>
                        </svg>
                    </button>
                    <h2 class="newsletter-popup-title">📧 Resta Aggiornato!</h2>
                    <p class="newsletter-popup-subtitle">
                        Ricevi le ultime notizie su bandi, normative ed eventi direttamente nella tua email
                    </p>
                </div>
                <div class="newsletter-popup-body">
                    <form class="newsletter-popup-form" id="newsletter-popup-form">
                        <input 
                            type="email" 
                            class="newsletter-popup-input" 
                            id="newsletter-popup-email"
                            placeholder="Inserisci la tua email"
                            required
                        >
                        <button type="submit" class="newsletter-popup-submit">
                            Iscriviti Gratuitamente
                        </button>
                    </form>
                    <div class="newsletter-popup-footer">
                        Accettando, riceverai aggiornamenti settimanali da FederComTur.<br>
                        <a href="#privacy">Privacy Policy</a> | 
                        <a href="#" id="newsletter-popup-later">Ricordamelo più tardi</a>
                    </div>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
    }
    
    setupEventListeners() {
        // Close button
        document.addEventListener('click', (e) => {
            if (e.target.id === 'newsletter-popup-close') {
                this.closeModal(true);
            }
        });
        
        // Later button
        document.addEventListener('click', (e) => {
            if (e.target.id === 'newsletter-popup-later') {
                e.preventDefault();
                this.closeModal(false); // Non imposta cookie, riapparirà
            }
        });
        
        // Close on outside click
        document.addEventListener('click', (e) => {
            if (e.target.id === 'newsletter-popup') {
                this.closeModal(true);
            }
        });
        
        // Close on Escape key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.isShown) {
                this.closeModal(true);
            }
        });
        
        // Form submission
        document.addEventListener('submit', (e) => {
            if (e.target.id === 'newsletter-popup-form') {
                e.preventDefault();
                this.handleSubmit();
            }
            
            // Footer newsletter form
            if (e.target.id === 'footer-newsletter-form') {
                e.preventDefault();
                this.handleFooterSubmit(e);
            }
        });
    }
    
    scheduleShow() {
        console.log(`📧 Newsletter popup programmato per apparire tra ${this.showDelay/1000} secondi`);
        
        setTimeout(() => {
            this.showModal();
        }, this.showDelay);
    }
    
    showModal() {
        const modal = document.getElementById('newsletter-popup');
        if (modal && !this.isShown) {
            modal.classList.add('active');
            document.body.style.overflow = 'hidden';
            this.isShown = true;
            
            console.log('📧 Newsletter popup mostrato');
            
            // Focus sull'input email
            setTimeout(() => {
                const emailInput = document.getElementById('newsletter-popup-email');
                if (emailInput) {
                    emailInput.focus();
                }
            }, 500);
        }
    }
    
    closeModal(setCookie = true) {
        const modal = document.getElementById('newsletter-popup');
        if (modal) {
            modal.classList.remove('active');
            document.body.style.overflow = '';
            this.isShown = false;
            
            if (setCookie) {
                this.setCookie();
                console.log('📧 Newsletter popup chiuso - cookie impostato');
            } else {
                console.log('📧 Newsletter popup chiuso - riapparirà in futuro');
            }
        }
    }
    
    async handleSubmit() {
        const emailInput = document.getElementById('newsletter-popup-email');
        const submitBtn = document.querySelector('.newsletter-popup-submit');
        
        if (!emailInput || !submitBtn) return;
        
        const email = emailInput.value.trim();
        
        if (!this.isValidEmail(email)) {
            this.showError('Inserisci un indirizzo email valido');
            return;
        }
        
        // Mostra loading
        const originalText = submitBtn.textContent;
        submitBtn.textContent = 'Iscrizione in corso...';
        submitBtn.disabled = true;
        
        try {
            // Chiamata API EmailOctopus
            const response = await fetch('/FEDERCOMTUR/api/newsletter-subscribe.php', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    email: email,
                    source: 'popup',
                    page: window.location.pathname
                })
            });
            
            const result = await response.json();
            
            if (result.success) {
                // Successo
                this.showSuccess(`🎉 ${result.message}`);
                
                // Chiudi modal dopo successo
                setTimeout(() => {
                    this.closeModal(true);
                }, 2000);
                
            } else {
                throw new Error(result.error || 'Errore sconosciuto');
            }
            
        } catch (error) {
            console.error('Errore iscrizione newsletter popup:', error);
            this.showError('Errore durante l\'iscrizione. Riprova più tardi.');
            submitBtn.textContent = originalText;
            submitBtn.disabled = false;
        }
    }
    
    async handleFooterSubmit(e) {
        const emailInput = e.target.querySelector('#footer-email');
        const submitBtn = e.target.querySelector('.btn-footer');
        
        if (!emailInput || !submitBtn) return;
        
        const email = emailInput.value.trim();
        
        if (!this.isValidEmail(email)) {
            this.showFooterError(emailInput, 'Inserisci un indirizzo email valido');
            return;
        }
        
        // Mostra loading
        const originalText = submitBtn.textContent;
        submitBtn.textContent = 'Iscrizione...';
        submitBtn.disabled = true;
        
        try {
            // Chiamata API EmailOctopus
            const response = await fetch('/FEDERCOMTUR/api/newsletter-subscribe.php', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    email: email,
                    source: 'footer',
                    page: window.location.pathname
                })
            });
            
            const result = await response.json();
            
            if (result.success) {
                this.showFooterSuccess(emailInput, result.message);
                e.target.reset();
            } else {
                throw new Error(result.error || 'Errore sconosciuto');
            }
            
        } catch (error) {
            console.error('Errore iscrizione newsletter footer:', error);
            this.showFooterError(emailInput, 'Errore durante l\'iscrizione. Riprova più tardi.');
        } finally {
            submitBtn.textContent = originalText;
            submitBtn.disabled = false;
        }
    }
    
    showFooterError(inputElement, message) {
        // Rimuovi errore precedente
        const existingError = inputElement.parentNode.querySelector('.footer-error');
        if (existingError) {
            existingError.remove();
        }
        
        // Aggiungi nuovo errore
        const errorDiv = document.createElement('div');
        errorDiv.className = 'footer-error';
        errorDiv.style.cssText = 'color: #ef4444; font-size: 0.8rem; margin-top: 8px; text-align: center;';
        errorDiv.textContent = message;
        
        inputElement.parentNode.appendChild(errorDiv);
        inputElement.style.borderColor = '#ef4444';
        
        // Rimuovi errore dopo 5 secondi
        setTimeout(() => {
            if (errorDiv.parentNode) {
                errorDiv.remove();
                inputElement.style.borderColor = '';
            }
        }, 5000);
    }
    
    showFooterSuccess(inputElement, message) {
        // Rimuovi errore precedente
        const existingError = inputElement.parentNode.querySelector('.footer-error');
        if (existingError) {
            existingError.remove();
        }
        
        // Aggiungi messaggio successo
        const successDiv = document.createElement('div');
        successDiv.className = 'footer-success';
        successDiv.style.cssText = 'color: #16a34a; font-size: 0.8rem; margin-top: 8px; text-align: center; font-weight: 600;';
        successDiv.textContent = '✅ ' + message;
        
        inputElement.parentNode.appendChild(successDiv);
        
        // Rimuovi messaggio dopo 5 secondi
        setTimeout(() => {
            if (successDiv.parentNode) {
                successDiv.remove();
            }
        }, 5000);
    }
    
    showSuccess(message) {
        const form = document.getElementById('newsletter-popup-form');
        form.innerHTML = `
            <div style="text-align: center; padding: 20px; color: var(--secondary-emerald); font-weight: 600;">
                ${message}
            </div>
        `;
    }
    
    showError(message) {
        const emailInput = document.getElementById('newsletter-popup-email');
        
        // Rimuovi errore precedente
        const existingError = document.querySelector('.popup-error-message');
        if (existingError) {
            existingError.remove();
        }
        
        // Aggiungi nuovo errore
        const errorDiv = document.createElement('div');
        errorDiv.className = 'popup-error-message';
        errorDiv.style.cssText = 'color: #ef4444; font-size: 0.85rem; margin-top: 8px; text-align: center;';
        errorDiv.textContent = message;
        
        emailInput.parentNode.appendChild(errorDiv);
        emailInput.style.borderColor = '#ef4444';
        
        // Rimuovi errore dopo 5 secondi
        setTimeout(() => {
            if (errorDiv.parentNode) {
                errorDiv.remove();
                emailInput.style.borderColor = '';
            }
        }, 5000);
    }
    
    isValidEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }
    
    hasBeenShown() {
        return this.getCookie(this.cookieName) !== null;
    }
    
    setCookie() {
        const date = new Date();
        date.setTime(date.getTime() + (this.cookieExpireDays * 24 * 60 * 60 * 1000));
        const expires = "expires=" + date.toUTCString();
        document.cookie = `${this.cookieName}=true;${expires};path=/`;
    }
    
    getCookie(name) {
        const nameEQ = name + "=";
        const ca = document.cookie.split(';');
        for(let i = 0; i < ca.length; i++) {
            let c = ca[i];
            while (c.charAt(0) === ' ') c = c.substring(1, c.length);
            if (c.indexOf(nameEQ) === 0) return c.substring(nameEQ.length, c.length);
        }
        return null;
    }
    
    // Metodo pubblico per mostrare il modal manualmente
    show() {
        this.showModal();
    }
    
    // Metodo pubblico per resettare il cookie (per testing)
    reset() {
        document.cookie = `${this.cookieName}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
        console.log('📧 Cookie newsletter reset - popup riapparirà');
    }
}

// Inizializza il popup newsletter quando il DOM è caricato
document.addEventListener('DOMContentLoaded', () => {
    // Aspetta un po' per assicurarsi che la pagina sia completamente caricata
    setTimeout(() => {
        window.newsletterPopup = new NewsletterPopup();
    }, 1000);
});

// Esponi metodi globali per debugging/testing
window.showNewsletterPopup = () => {
    if (window.newsletterPopup) {
        window.newsletterPopup.show();
    }
};

window.resetNewsletterPopup = () => {
    if (window.newsletterPopup) {
        window.newsletterPopup.reset();
    }
};
