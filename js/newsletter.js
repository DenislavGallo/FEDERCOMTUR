/**
 * FederComTur - Newsletter Management
 * ==================================
 */

'use strict';

// Newsletter management system
const FederNewsletter = {
    // Configuration
    config: {
        apiEndpoint: 'api/newsletter-subscribe.php',
        emailOctopusApiKey: 'YOUR_API_KEY_HERE', // Replace with actual key
        listId: 'YOUR_LIST_ID_HERE', // Replace with actual list ID
        maxRetries: 3,
        retryDelay: 1000,
        rateLimitTime: 60000, // 1 minute
        maxRequestsPerMinute: 3
    },
    
    // State
    state: {
        isSubmitting: false,
        submissionCount: 0,
        lastSubmissionTime: 0,
        retryCount: 0
    },
    
    // Rate limiting storage (use localStorage for persistence)
    rateLimitKey: 'federcomtur_newsletter_requests',
    
    // Initialize newsletter functionality
    init() {
        console.log('📧 Initializing newsletter system...');
        
        this.bindEvents();
        this.setupValidation();
        this.checkRateLimit();
        
        console.log('✅ Newsletter system initialized');
    },
    
    // Bind event listeners
    bindEvents() {
        const form = document.getElementById('newsletter-form');
        if (!form) return;
        
        // Form submission
        form.addEventListener('submit', this.handleSubmit.bind(this));
        
        // Real-time validation
        const emailInput = document.getElementById('email');
        if (emailInput) {
            emailInput.addEventListener('blur', this.validateEmail.bind(this));
            emailInput.addEventListener('input', this.clearEmailError.bind(this));
        }
        
        // Consent checkbox
        const consentCheckbox = document.getElementById('consent');
        if (consentCheckbox) {
            consentCheckbox.addEventListener('change', this.validateConsent.bind(this));
        }
        
        // Prevent multiple submissions
        form.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && this.state.isSubmitting) {
                e.preventDefault();
            }
        });
    },
    
    // Setup advanced validation
    setupValidation() {
        const emailInput = document.getElementById('email');
        if (!emailInput) return;
        
        // Add input attributes for better UX
        emailInput.setAttribute('autocomplete', 'email');
        emailInput.setAttribute('inputmode', 'email');
        emailInput.setAttribute('spellcheck', 'false');
    },
    
    // Handle form submission
    async handleSubmit(e) {
        e.preventDefault();
        
        // Prevent double submissions
        if (this.state.isSubmitting) {
            console.log('⏳ Form already submitting, ignoring...');
            return;
        }
        
        // Check rate limiting
        if (!this.checkRateLimit()) {
            this.showError('Hai fatto troppe richieste. Riprova tra qualche minuto.');
            return;
        }
        
        const formData = new FormData(e.target);
        const email = formData.get('email')?.trim().toLowerCase();
        const consent = formData.get('consent');
        const honeypot = formData.get('website');
        
        // Validate form
        if (!this.validateForm(email, consent, honeypot)) {
            return;
        }
        
        // Update rate limiting
        this.updateRateLimit();
        
        // Submit newsletter subscription
        await this.submitSubscription(email);
    },
    
    // Comprehensive form validation
    validateForm(email, consent, honeypot) {
        let isValid = true;
        
        // Clear previous errors
        this.clearAllErrors();
        
        // Honeypot check (spam protection)
        if (honeypot) {
            console.warn('🤖 Spam attempt detected via honeypot');
            // Don't show error to avoid revealing spam protection
            return false;
        }
        
        // Email validation
        if (!this.validateEmailField(email)) {
            isValid = false;
        }
        
        // Consent validation
        if (!this.validateConsentField(consent)) {
            isValid = false;
        }
        
        return isValid;
    },
    
    // Validate email field
    validateEmailField(email) {
        const emailError = document.getElementById('email-error');
        
        if (!email) {
            this.showFieldError('email', 'L\'indirizzo email è obbligatorio');
            return false;
        }
        
        if (!this.isValidEmail(email)) {
            this.showFieldError('email', 'Inserisci un indirizzo email valido');
            return false;
        }
        
        if (this.isTemporaryEmail(email)) {
            this.showFieldError('email', 'Non sono accettati indirizzi email temporanei');
            return false;
        }
        
        if (email.length > 254) {
            this.showFieldError('email', 'L\'indirizzo email è troppo lungo');
            return false;
        }
        
        return true;
    },
    
    // Validate consent field
    validateConsentField(consent) {
        if (!consent) {
            this.showError('Devi accettare la privacy policy per iscriverti alla newsletter');
            return false;
        }
        
        return true;
    },
    
    // Advanced email validation
    isValidEmail(email) {
        // RFC 5322 compliant regex (simplified)
        const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
        
        if (!emailRegex.test(email)) {
            return false;
        }
        
        // Additional checks
        const parts = email.split('@');
        if (parts.length !== 2) return false;
        
        const [localPart, domain] = parts;
        
        // Local part checks
        if (localPart.length > 64) return false;
        if (localPart.startsWith('.') || localPart.endsWith('.')) return false;
        if (localPart.includes('..')) return false;
        
        // Domain checks
        if (domain.length > 253) return false;
        if (domain.startsWith('-') || domain.endsWith('-')) return false;
        if (domain.includes('..')) return false;
        
        return true;
    },
    
    // Check for temporary/disposable email services
    isTemporaryEmail(email) {
        const tempDomains = [
            '10minutemail.com', 'tempmail.org', 'guerrillamail.com',
            'mailinator.com', 'yopmail.com', 'temp-mail.org',
            'getairmail.com', 'maildrop.cc', 'throwaway.email'
        ];
        
        const domain = email.split('@')[1];
        return tempDomains.includes(domain.toLowerCase());
    },
    
    // Submit newsletter subscription
    async submitSubscription(email) {
        this.startSubmission();
        
        try {
            // Attempt submission with retry logic
            const result = await this.submitWithRetry(email);
            
            if (result.success) {
                this.handleSuccessfulSubmission(email);
            } else {
                throw new Error(result.error || 'Submission failed');
            }
            
        } catch (error) {
            console.error('❌ Newsletter subscription error:', error);
            // Estrai apiResult se disponibile nell'error object
            const apiResult = error.apiResult || null;
            this.handleFailedSubmission(error, apiResult);
        } finally {
            this.endSubmission();
        }
    },
    
    // Submit with retry logic
    async submitWithRetry(email, attempt = 1) {
        try {
            return await this.performSubmission(email);
        } catch (error) {
            if (attempt < this.config.maxRetries) {
                console.log(`⏳ Retry attempt ${attempt + 1} for email subscription...`);
                
                // Exponential backoff
                const delay = this.config.retryDelay * Math.pow(2, attempt - 1);
                await this.sleep(delay);
                
                return await this.submitWithRetry(email, attempt + 1);
            }
            
            throw error;
        }
    },
    
    // Perform actual submission
    async performSubmission(email) {
        // Chiamata API EmailOctopus reale
        const response = await fetch(this.config.apiEndpoint, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                email: email,
                source: 'main_form',
                page: window.location.pathname
            })
        });
        
        const result = await response.json();
        
        if (!result.success) {
            const error = new Error(result.error || 'Errore durante l\'iscrizione');
            error.apiResult = result; // Passa il result per analisi errore
            throw error;
        }
        
        return result;
    },
    
    // Simulate API call (replace with actual implementation)
    async simulateApiCall(email) {
        // Simulate network delay
        await this.sleep(1500 + Math.random() * 1000);
        
        // Simulate occasional failures for testing
        const shouldFail = Math.random() < 0.1; // 10% failure rate
        
        if (shouldFail) {
            return {
                ok: false,
                json: () => Promise.resolve({
                    success: false,
                    error: 'Server temporaneamente non disponibile'
                })
            };
        }
        
        // Simulate duplicate email check
        if (this.isDuplicateEmail(email)) {
            return {
                ok: false,
                json: () => Promise.resolve({
                    success: false,
                    error: 'Questo indirizzo email è già iscritto alla newsletter'
                })
            };
        }
        
        return {
            ok: true,
            json: () => Promise.resolve({
                success: true,
                message: 'Iscrizione completata con successo',
                email: email,
                id: Math.random().toString(36).substr(2, 9)
            })
        };
    },
    
    // Check for duplicate emails (simple localStorage check)
    isDuplicateEmail(email) {
        const subscribedEmails = JSON.parse(localStorage.getItem('federcomtur_subscribed') || '[]');
        return subscribedEmails.includes(email);
    },
    
    // Handle successful submission
    handleSuccessfulSubmission(email) {
        // Store email to prevent duplicates
        const subscribedEmails = JSON.parse(localStorage.getItem('federcomtur_subscribed') || '[]');
        subscribedEmails.push(email);
        localStorage.setItem('federcomtur_subscribed', JSON.stringify(subscribedEmails));
        
        // Show success message
        this.showSuccess('Grazie! Ti sei iscritto con successo alla newsletter. Controlla la tua email per confermare l\'iscrizione.');
        
        // Aggiorna stato bottone a successo
        const submitButton = document.getElementById('newsletter-submit');
        if (submitButton) {
            submitButton.classList.remove('loading');
            submitButton.classList.add('success');
            submitButton.textContent = '✅ Iscritto!';
        }
        
        // Reset form
        document.getElementById('newsletter-form').reset();
        
        // Animate success if GSAP is available
        if (typeof FederAnimations !== 'undefined') {
            FederAnimations.animateFormSuccess();
        }
        
        // Track conversion (Google Analytics, etc.)
        this.trackConversion(email);
        
        // Reset form after 5 seconds
        setTimeout(() => {
            this.resetFormToInitialState();
        }, 5000);
        
        console.log('✅ Newsletter subscription successful for:', email);
    },
    
    // Handle failed submission
    handleFailedSubmission(error, result = null) {
        let errorMessage = 'Si è verificato un errore durante l\'iscrizione. Riprova più tardi.';
        
        // Controlla response API per errore specifico
        if (result && result.already_subscribed) {
            errorMessage = 'Questa email è già registrata alla newsletter.';
        } else if (error.message.includes('già registrata') || error.message.includes('duplicate') || error.message.includes('già iscritto')) {
            errorMessage = 'Questa email è già registrata alla newsletter.';
        } else if (error.message.includes('invalid') || error.message.includes('non valido')) {
            errorMessage = 'L\'indirizzo email non è valido.';
        } else if (error.message.includes('network') || error.message.includes('failed to fetch')) {
            errorMessage = 'Problema di connessione. Verifica la tua connessione internet e riprova.';
        }
        
        this.showFieldError('email', errorMessage);
        
        // Gestione stato visuale bottone errore
        const submitButton = document.getElementById('newsletter-submit');
        if (submitButton) {
            submitButton.classList.remove('loading', 'success');
            submitButton.classList.add('error');
            submitButton.innerHTML = '<span class="btn-text" style="color: #ffffff !important;">Riprova</span>';
            
            // Reset bottone dopo 4 secondi
            setTimeout(() => {
                if (submitButton.classList.contains('error')) {
                    submitButton.classList.remove('error');
                    submitButton.innerHTML = '<span class="btn-text">Subscribe</span><span class="btn-loading"><svg class="spinner" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" fill="none" stroke-dasharray="31.4" stroke-dashoffset="31.4"/></svg></span>';
                }
            }, 4000);
        }
        
        // Animate error if GSAP is available
        if (typeof FederAnimations !== 'undefined') {
            FederAnimations.animateFormError();
        }
        
        console.error('❌ Newsletter subscription failed:', error);
    },
    
    // Start submission state
    startSubmission() {
        this.state.isSubmitting = true;
        const submitButton = document.getElementById('newsletter-submit');
        
        if (submitButton) {
            submitButton.classList.add('loading');
            submitButton.disabled = true;
            submitButton.setAttribute('aria-busy', 'true');
        }
        
        // Animate submission if GSAP is available
        if (typeof FederAnimations !== 'undefined') {
            FederAnimations.animateFormSubmission();
        }
    },
    
    // End submission state
    endSubmission() {
        this.state.isSubmitting = false;
        this.state.retryCount = 0;
        const submitButton = document.getElementById('newsletter-submit');
        
        if (submitButton) {
            // Non rimuovere classi success/error in endSubmission
            // Vengono gestite dai rispettivi handler o reset automatico
            submitButton.classList.remove('loading');
            submitButton.disabled = false;
            submitButton.removeAttribute('aria-busy');
        }
    },
    
    // Rate limiting functions
    checkRateLimit() {
        const now = Date.now();
        const requests = this.getRateLimitData();
        
        // Clean old requests (older than rate limit time)
        const validRequests = requests.filter(timestamp => 
            now - timestamp < this.config.rateLimitTime
        );
        
        // Check if under limit
        if (validRequests.length >= this.config.maxRequestsPerMinute) {
            console.warn('⚠️ Rate limit exceeded');
            return false;
        }
        
        return true;
    },
    
    updateRateLimit() {
        const now = Date.now();
        const requests = this.getRateLimitData();
        
        requests.push(now);
        localStorage.setItem(this.rateLimitKey, JSON.stringify(requests));
    },
    
    getRateLimitData() {
        try {
            return JSON.parse(localStorage.getItem(this.rateLimitKey) || '[]');
        } catch (error) {
            console.warn('Error parsing rate limit data:', error);
            return [];
        }
    },
    
    // Validation helper methods
    validateEmail() {
        const email = document.getElementById('email').value.trim().toLowerCase();
        this.validateEmailField(email);
    },
    
    validateConsent() {
        const consent = document.getElementById('consent').checked;
        this.validateConsentField(consent);
    },
    
    // Error handling
    clearAllErrors() {
        const errorElements = document.querySelectorAll('.error-message');
        errorElements.forEach(el => {
            el.classList.remove('show');
            el.textContent = '';
        });
        
        const formStatus = document.getElementById('form-status');
        if (formStatus) {
            formStatus.className = 'form-status';
            formStatus.style.display = 'none';
        }
    },
    
    clearEmailError() {
        const emailError = document.getElementById('email-error');
        if (emailError) {
            emailError.classList.remove('show');
            emailError.textContent = '';
        }
    },
    
    showFieldError(fieldName, message) {
        const errorElement = document.getElementById(`${fieldName}-error`);
        if (errorElement) {
            errorElement.textContent = message;
            errorElement.classList.add('show');
        }
    },
    
    showError(message) {
        const formStatus = document.getElementById('form-status');
        if (formStatus) {
            formStatus.className = 'form-status error';
            formStatus.textContent = message;
            formStatus.style.display = 'block';
            formStatus.setAttribute('role', 'alert');
        }
    },
    
    showSuccess(message) {
        const formStatus = document.getElementById('form-status');
        if (formStatus) {
            formStatus.className = 'form-status success';
            formStatus.textContent = message;
            formStatus.style.display = 'block';
            formStatus.setAttribute('role', 'status');
        }
    },
    
    // Analytics tracking
    trackConversion(email) {
        // Google Analytics 4
        if (typeof gtag !== 'undefined') {
            gtag('event', 'newsletter_signup', {
                event_category: 'engagement',
                event_label: 'newsletter_form',
                value: 1
            });
        }
        
        // Facebook Pixel
        if (typeof fbq !== 'undefined') {
            fbq('track', 'Subscribe', {
                content_category: 'newsletter'
            });
        }
        
        console.log('📊 Conversion tracked for email:', email);
    },
    
    // Utility functions
    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    },
    
    // Reset form to initial state
    resetFormToInitialState() {
        // Reset form status
        const formStatus = document.getElementById('form-status');
        if (formStatus) {
            formStatus.style.display = 'none';
            formStatus.className = 'form-status';
            formStatus.textContent = '';
        }
        
        // Reset button state
        const submitButton = document.getElementById('newsletter-submit');
        if (submitButton) {
            submitButton.classList.remove('loading', 'success', 'error');
            submitButton.disabled = false;
            submitButton.removeAttribute('aria-busy');
            submitButton.innerHTML = '<span class="btn-text">Subscribe</span><span class="btn-loading"><svg class="spinner" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" fill="none" stroke-dasharray="31.4" stroke-dashoffset="31.4"/></svg></span>';
        }
        
        // Clear any error states
        const emailInput = document.getElementById('email');
        if (emailInput) {
            emailInput.classList.remove('error');
        }
        
        // Reset internal state
        this.state.isSubmitting = false;
        this.state.retryCount = 0;
        
        console.log('🔄 Form reset to initial state');
    },
    
    // Cleanup function
    destroy() {
        this.state.isSubmitting = false;
        // Remove event listeners if needed
        console.log('🧹 Newsletter system cleaned up');
    }
};

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    FederNewsletter.init();
});

// Handle page visibility changes
document.addEventListener('visibilitychange', () => {
    if (document.hidden && FederNewsletter.state.isSubmitting) {
        console.log('⚠️ Page hidden during submission');
    }
}); 

// Cleanup on page unload
window.addEventListener('beforeunload', () => {
    FederNewsletter.destroy();
});

// Export for potential module usage
if (typeof module !== 'undefined' && module.exports) {
    module.exports = FederNewsletter;
}
