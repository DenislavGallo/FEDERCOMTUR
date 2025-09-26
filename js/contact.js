/**
 * Contact Form Handler
 * Gestisce il form di contatto con validazione client-side e invio al backend
 */
class ContactFormHandler {
    constructor() {
        this.form = document.getElementById('contact-form');
        this.submitButton = document.getElementById('contact-submit');
        this.rateLimitKey = 'contact_form_last_submission';
        this.rateLimitDelay = 30000; // 30 secondi
        
        if (this.form) {
            this.init();
        }
    }
    
    init() {
        this.setupEventListeners();
        this.setupRequestTypeHandlers();
        this.setupFormValidation();
    }
    
    setupEventListeners() {
        // Form submission
        this.form.addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleSubmit();
        });
        
        // Real-time validation
        const inputs = this.form.querySelectorAll('input, textarea');
        inputs.forEach(input => {
            input.addEventListener('blur', () => {
                this.validateField(input);
            });
            
            input.addEventListener('input', () => {
                this.clearFieldError(input);
            });
        });
    }
    
    setupRequestTypeHandlers() {
        // Gestione selezione tipo richiesta
        const requestOptions = this.form.querySelectorAll('.request-type-option');
        
        requestOptions.forEach(option => {
            option.addEventListener('click', () => {
                // Rimuovi selezione da tutte le opzioni
                requestOptions.forEach(opt => opt.classList.remove('selected'));
                
                // Aggiungi selezione all'opzione cliccata
                option.classList.add('selected');
                
                // Seleziona il radio button
                const radio = option.querySelector('.request-type-radio');
                if (radio) {
                    radio.checked = true;
                }
                
                // Clear error se presente
                this.clearFieldError(radio);
            });
        });
    }
    
    setupFormValidation() {
        // Validazione email
        const emailInput = document.getElementById('email');
        if (emailInput) {
            emailInput.addEventListener('input', (e) => {
                const email = e.target.value;
                if (email && !this.isValidEmail(email)) {
                    this.showFieldError('email', 'Inserisci un indirizzo email valido');
                } else {
                    this.clearFieldError(emailInput);
                }
            });
        }
        
        // Validazione nome completo
        const fullnameInput = document.getElementById('fullname');
        if (fullnameInput) {
            fullnameInput.addEventListener('input', (e) => {
                const name = e.target.value.trim();
                if (name && name.split(' ').length < 2) {
                    this.showFieldError('fullname', 'Inserisci nome e cognome completi');
                } else {
                    this.clearFieldError(fullnameInput);
                }
            });
        }
        
        // Validazione messaggio
        const messageInput = document.getElementById('message');
        if (messageInput) {
            messageInput.addEventListener('input', (e) => {
                const message = e.target.value.trim();
                if (message && message.length < 10) {
                    this.showFieldError('message', 'Il messaggio deve contenere almeno 10 caratteri');
                } else {
                    this.clearFieldError(messageInput);
                }
            });
        }
    }
    
    async handleSubmit() {
        // Controllo rate limiting
        if (this.isRateLimited()) {
            this.showFormError('Attendi 30 secondi prima di inviare un\'altra richiesta.');
            return;
        }
        
        // Validazione form completa
        if (!this.validateForm()) {
            return;
        }
        
        // Honeypot check
        const honeypot = this.form.querySelector('input[name="website"]');
        if (honeypot && honeypot.value.trim() !== '') {
            console.log('🚫 Spam detected - honeypot filled');
            return;
        }
        
        try {
            this.startSubmission();
            
            const formData = this.collectFormData();
            const response = await this.submitToBackend(formData);
            
            if (response.ok) {
                const result = await response.json();
                this.handleSuccess(result);
            } else {
                const error = await response.json().catch(() => ({}));
                this.handleError(new Error(error.message || 'Errore del server'), error);
            }
            
        } catch (error) {
            this.handleError(error);
        } finally {
            this.endSubmission();
        }
    }
    
    validateForm() {
        let isValid = true;
        
        // Validazione campi obbligatori
        const requiredFields = [
            { id: 'fullname', name: 'Nome e Cognome' },
            { id: 'email', name: 'Email' },
            { id: 'message', name: 'Messaggio' }
        ];
        
        requiredFields.forEach(field => {
            const input = document.getElementById(field.id);
            if (!input || !input.value.trim()) {
                this.showFieldError(field.id, `${field.name} è obbligatorio`);
                isValid = false;
            }
        });
        
        // Validazione email
        const emailInput = document.getElementById('email');
        if (emailInput && emailInput.value && !this.isValidEmail(emailInput.value)) {
            this.showFieldError('email', 'Inserisci un indirizzo email valido');
            isValid = false;
        }
        
        // Validazione tipo richiesta
        const requestType = this.form.querySelector('input[name="request_type"]:checked');
        if (!requestType) {
            this.showFieldError('request_type', 'Seleziona il tipo di richiesta');
            isValid = false;
        }
        
        // Validazione privacy consent
        const privacyConsent = document.getElementById('privacy_consent');
        if (!privacyConsent || !privacyConsent.checked) {
            this.showFieldError('privacy_consent', 'È necessario accettare la privacy policy');
            isValid = false;
        }
        
        return isValid;
    }
    
    validateField(input) {
        const fieldId = input.id || input.name;
        const value = input.value.trim();
        
        switch (fieldId) {
            case 'email':
                if (value && !this.isValidEmail(value)) {
                    this.showFieldError(fieldId, 'Inserisci un indirizzo email valido');
                    return false;
                }
                break;
                
            case 'fullname':
                if (value && value.split(' ').length < 2) {
                    this.showFieldError(fieldId, 'Inserisci nome e cognome completi');
                    return false;
                }
                break;
                
            case 'message':
                if (value && value.length < 10) {
                    this.showFieldError(fieldId, 'Il messaggio deve contenere almeno 10 caratteri');
                    return false;
                }
                break;
        }
        
        this.clearFieldError(input);
        return true;
    }
    
    collectFormData() {
        const formData = new FormData();
        
        // Campi del form
        const fields = [
            'fullname', 'email', 'company', 'message', 'request_type', 'privacy_consent'
        ];
        
        fields.forEach(field => {
            const input = this.form.querySelector(`[name="${field}"]`);
            if (input) {
                if (input.type === 'checkbox') {
                    formData.append(field, input.checked ? '1' : '0');
                } else {
                    formData.append(field, input.value);
                }
            }
        });
        
        // Aggiungi timestamp
        formData.append('timestamp', new Date().toISOString());
        
        return formData;
    }
    
    async submitToBackend(formData) {
        const response = await fetch('api/real-email-contact.php', {
            method: 'POST',
            body: formData,
            headers: {
                'X-Requested-With': 'XMLHttpRequest'
            }
        });
        
        return response;
    }
    
    handleSuccess(result) {
        // Salva timestamp per rate limiting
        this.setRateLimit();
        
        // Mostra messaggio di successo
        this.showFormSuccess('La tua richiesta è stata inviata con successo! Ti risponderemo al più presto.');
        
        // Reset form
        this.form.reset();
        document.querySelectorAll('.request-type-option').forEach(opt => {
            opt.classList.remove('selected');
        });
        
        // Clear tutti gli errori
        this.clearAllErrors();
        
        // Scroll to success message
        const successMessage = document.getElementById('form-success');
        if (successMessage) {
            successMessage.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
        
        console.log('✅ Contact form submitted successfully:', result);
    }
    
    handleError(error, result = null) {
        let errorMessage = 'Si è verificato un errore durante l\'invio. Riprova più tardi.';
        
        // Messaggi di errore specifici
        if (result) {
            if (result.error === 'validation') {
                errorMessage = 'Verifica i dati inseriti e riprova.';
            } else if (result.error === 'spam') {
                errorMessage = 'Richiesta non valida. Riprova.';
            } else if (result.message) {
                errorMessage = result.message;
            }
        } else if (error.message.includes('network') || error.message.includes('fetch')) {
            errorMessage = 'Problema di connessione. Verifica la tua connessione internet e riprova.';
        }
        
        this.showFormError(errorMessage);
        
        // Gestione stato visuale bottone errore
        this.submitButton.classList.remove('loading', 'success');
        this.submitButton.classList.add('error');
        this.submitButton.innerHTML = '<span class="btn-text" style="color: #ffffff !important;">Riprova</span>';
        
        // Reset bottone dopo 4 secondi
        setTimeout(() => {
            if (this.submitButton.classList.contains('error')) {
                this.submitButton.classList.remove('error');
                this.submitButton.innerHTML = '<span class="btn-text">Invia Richiesta</span><span class="btn-loading"><svg class="spinner" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" fill="none" stroke-dasharray="31.4" stroke-dashoffset="31.4"/></svg></span>';
            }
        }, 4000);
        
        console.error('❌ Contact form submission failed:', error);
    }
    
    startSubmission() {
        this.submitButton.classList.add('loading');
        this.submitButton.disabled = true;
        
        // Disabilita tutti gli input
        const inputs = this.form.querySelectorAll('input, textarea, button');
        inputs.forEach(input => {
            input.disabled = true;
        });
    }
    
    endSubmission() {
        this.submitButton.classList.remove('loading');
        this.submitButton.disabled = false;
        
        // Riabilita tutti gli input
        const inputs = this.form.querySelectorAll('input, textarea, button');
        inputs.forEach(input => {
            input.disabled = false;
        });
    }
    
    showFieldError(fieldId, message) {
        const errorElement = document.getElementById(`${fieldId}-error`);
        if (errorElement) {
            errorElement.textContent = message;
            errorElement.classList.add('show');
        }
        
        // Highlight input field
        const input = document.getElementById(fieldId);
        if (input) {
            input.style.borderColor = '#ef4444';
        }
    }
    
    clearFieldError(input) {
        const fieldId = input.id || input.name;
        const errorElement = document.getElementById(`${fieldId}-error`);
        
        if (errorElement) {
            errorElement.classList.remove('show');
        }
        
        // Remove input highlight
        input.style.borderColor = '';
    }
    
    clearAllErrors() {
        // Clear field errors
        const errorElements = this.form.querySelectorAll('.field-error');
        errorElements.forEach(error => {
            error.classList.remove('show');
        });
        
        // Clear input highlights
        const inputs = this.form.querySelectorAll('input, textarea');
        inputs.forEach(input => {
            input.style.borderColor = '';
        });
        
        // Clear form messages
        this.clearFormMessages();
    }
    
    showFormSuccess(message) {
        const successElement = document.getElementById('form-success');
        const errorElement = document.getElementById('form-error');
        
        if (successElement) {
            successElement.textContent = message;
            successElement.style.display = 'block';
        }
        
        if (errorElement) {
            errorElement.style.display = 'none';
        }
        
        // Update button state
        this.submitButton.classList.remove('loading', 'error');
        this.submitButton.classList.add('success');
        this.submitButton.innerHTML = '<span class="btn-text" style="color: #ffffff !important;">✓ Inviato</span>';
        
        // Reset button after 3 seconds
        setTimeout(() => {
            this.submitButton.classList.remove('success');
            this.submitButton.innerHTML = '<span class="btn-text">Invia Richiesta</span><span class="btn-loading"><svg class="spinner" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" fill="none" stroke-dasharray="31.4" stroke-dashoffset="31.4"/></svg></span>';
        }, 3000);
    }
    
    showFormError(message) {
        const errorElement = document.getElementById('form-error');
        const successElement = document.getElementById('form-success');
        
        if (errorElement) {
            errorElement.textContent = message;
            errorElement.style.display = 'block';
        }
        
        if (successElement) {
            successElement.style.display = 'none';
        }
    }
    
    clearFormMessages() {
        const successElement = document.getElementById('form-success');
        const errorElement = document.getElementById('form-error');
        
        if (successElement) {
            successElement.style.display = 'none';
        }
        
        if (errorElement) {
            errorElement.style.display = 'none';
        }
    }
    
    isValidEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }
    
    isRateLimited() {
        const lastSubmission = localStorage.getItem(this.rateLimitKey);
        if (!lastSubmission) return false;
        
        const timeDiff = Date.now() - parseInt(lastSubmission);
        return timeDiff < this.rateLimitDelay;
    }
    
    setRateLimit() {
        localStorage.setItem(this.rateLimitKey, Date.now().toString());
    }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    new ContactFormHandler();
});
