class ServiceDetailPage {
    constructor() {
        this.titleEl = document.getElementById('service-title');
        this.subtitleEl = document.getElementById('service-short-description');
        this.descEl = document.getElementById('service-long-description');
        this.highlightsEl = document.getElementById('service-highlights-list');
        this.iconEl = document.getElementById('service-header-icon');
        this.breadcrumbEl = document.getElementById('breadcrumb-service-name');
        this.descTitleEl = document.getElementById('service-long-description-title');
        this.init();
    }

    async init() {
        const slug = new URLSearchParams(window.location.search).get('slug');
        if (!slug) return;
        try {
            const res = await fetch('data/services.json', { cache: 'no-cache' });
            const all = await res.json();
            const svc = all.find(s => s.slug === slug);
            if (!svc) return;
            this.render(svc);
        } catch (e) {
            console.error('Errore caricamento dettaglio servizio:', e);
        }
    }

    render(svc) {
        this.titleEl.textContent = svc.name;
        this.subtitleEl.textContent = svc.shortDescription;
        this.descEl.innerHTML = `<p>${svc.description}</p>`;
        this.highlightsEl.innerHTML = (svc.highlights || []).map(h => `
            <li>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <polyline points="20 6 9 17 4 12"/>
                </svg>
                <span>${h}</span>
            </li>
        `).join('');
        this.iconEl.innerHTML = this.getIcon(svc.icon);
        this.breadcrumbEl.textContent = svc.name;
        this.descTitleEl.textContent = `Dettagli del servizio: ${svc.name}`;
        document.title = `${svc.name} - FederComTur`;
        this.setMetaDescription(svc.shortDescription || svc.description);
        this.injectSchema(svc);
        this.prefillForm(svc);
    }

    injectSchema(svc) {
        const ld = {
            '@context': 'https://schema.org',
            '@type': 'Service',
            'name': svc.name,
            'description': svc.description,
            'areaServed': 'Italia',
            'provider': { '@type': 'Organization', 'name': 'FederComTur' }
        };
        const tag = document.createElement('script');
        tag.type = 'application/ld+json';
        tag.textContent = JSON.stringify(ld);
        document.head.appendChild(tag);
    }

    setMetaDescription(text) {
        const meta = document.querySelector('meta[name="description"]') || (() => {
            const m = document.createElement('meta');
            m.name = 'description';
            document.head.appendChild(m);
            return m;
        })();
        meta.content = text.slice(0, 155);
    }

    prefillForm(svc) {
        const input = document.getElementById('service-subject');
        if (input) input.value = svc.name;
        const form = document.getElementById('service-request-form');
        if (!form) return;
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            const feedback = document.getElementById('form-message');
            const valid = this.validate();
            if (!valid.ok) {
                feedback.style.color = '#dc2626';
                feedback.textContent = valid.message;
                return;
            }
            // invio via fetch
            try {
                const formData = new FormData();
                formData.append('website', document.querySelector('input[name="website"]').value);
                formData.append('name', document.getElementById('name').value.trim());
                formData.append('email', document.getElementById('email').value.trim());
                formData.append('company', document.getElementById('company').value.trim());
                formData.append('service_subject', document.getElementById('service-subject').value.trim());
                formData.append('message', document.getElementById('message').value.trim());
                const res = await fetch('api/service-request.php', { method: 'POST', body: formData });
                const data = await res.json();
                if (data.success) {
                    feedback.style.color = 'var(--secondary-emerald)';
                    feedback.textContent = 'Richiesta inviata! Ti contatteremo a breve.';
                    form.reset();
                    document.getElementById('req-service').value = svc.name;
                } else {
                    feedback.style.color = '#dc2626';
                    feedback.textContent = data.error || 'Errore durante l\'invio. Riprova.';
                }
            } catch (_) {
                feedback.style.color = '#dc2626';
                feedback.textContent = 'Errore di connessione. Riprova.';
            }
        });
    }

    validate() {
        const name = document.getElementById('name').value.trim();
        const email = document.getElementById('email').value.trim();
        const message = document.getElementById('message').value.trim();
        const privacy = document.getElementById('privacy-consent').checked;
        if (!name) return { ok: false, message: 'Inserisci il nome.' };
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return { ok: false, message: 'Email non valida.' };
        if (message.length < 10) return { ok: false, message: 'Descrivi meglio la richiesta.' };
        if (!privacy) return { ok: false, message: 'Accetta la privacy.' };
        return { ok: true };
    }

    getIcon(key) {
        const map = {
            tax: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 4h16v16H4z"/><path d="m9 9 6 6"/><path d="m15 9-6 6"/></svg>',
            training: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="4" width="20" height="14" rx="2"/><path d="M12 8v6"/></svg>',
            funding: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 1v22"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7H14a3.5 3.5 0 0 1 0 7H6"/></svg>'
        };
        return map[key] || '';
    }
}

document.addEventListener('DOMContentLoaded', () => new ServiceDetailPage());


