# EmailOctopus Implementation Guide - FederComTur

## Panoramica Generale

EmailOctopus è una piattaforma di email marketing che offre API robuste per l'integrazione con siti web custom. Per il progetto FederComTur, rappresenta la soluzione ideale per gestire le iscrizioni alla newsletter tramite form web e inviare comunicazioni periodiche agli iscritti.

### Vantaggi per FederComTur
- Piano gratuito fino a 2.500 iscritti e 10.000 email/mese
- Costi ridotti del 40-60% rispetto a Mailchimp
- API v2 moderna con autenticazione Bearer token
- Double opt-in automatico per conformità GDPR
- Dashboard intuitiva per gestione contenuti

## Setup Account e Configurazione Iniziale

### 1. Registrazione Account
- Creare account gratuito su emailoctopus.com
- Verificare indirizzo email aziendale FederComTur
- Completare configurazione profilo organizzazione

### 2. Creazione Lista Newsletter
- Accedere alla sezione "Lists" nel dashboard
- Creare nuova lista: "Newsletter FederComTur - Commercio Turismo Servizi"
- Configurare double opt-in (raccomandato per GDPR)
- Personalizzare email di benvenuto e conferma
- Copiare List ID (formato UUID) per configurazione API

### 3. Generazione API Key
- Navigare su: Settings → API Keys
- Creare nuova chiave: "FederComTur Website Integration"
- Scaricare e salvare immediatamente la chiave (visualizzazione unica)
- Configurare chiavi separate per sviluppo e produzione

## Architettura Integrazione Sito Web

### Flusso Utente Consigliato
1. Utente compila form iscrizione su sito FederComTur
2. Dati vengono validati lato client (JavaScript)
3. Richiesta AJAX inviata a script PHP server-side
4. Script PHP comunica con API EmailOctopus
5. EmailOctopus invia email di conferma (double opt-in)
6. Utente conferma iscrizione cliccando link nell'email
7. Status cambia automaticamente da "pending" a "subscribed"

### Struttura File Progetto
```
FEDERCOMTUR/
├── api/
│   ├── newsletter-subscribe.php    # Endpoint iscrizione
│   └── emailoctopus-service.php   # Classe wrapper API
├── config/
│   └── emailoctopus-config.php    # Configurazione chiavi
└── assets/js/
    └── newsletter-form.js          # Validazione frontend
```

## Configurazione Tecnica

### Variabili Ambiente
Creare file `.env` nella root del progetto (mai committare in git):
```
EMAILOCTOPUS_API_KEY=your_api_key_here
EMAILOCTOPUS_LIST_ID=your_list_id_here
EMAILOCTOPUS_API_URL=https://api.emailoctopus.com
```

### Headers API Richiesti
- `Authorization: Bearer {api_key}`
- `Content-Type: application/json`
- `User-Agent: FederComTur-Website/1.0`

### Endpoint Principali
- **Aggiungere contatto**: `POST /lists/{list_id}/contacts`
- **Aggiornare contatto**: `PUT /lists/{list_id}/contacts/{contact_id}`
- **Verificare lista**: `GET /lists/{list_id}`

## Gestione Errori e Sicurezza

### Codici Risposta API
- **200/201**: Operazione riuscita
- **400**: Dati form non validi
- **401**: API key errata o scaduta
- **409**: Email già presente nella lista
- **422**: Errori validazione campi
- **429**: Rate limit superato (max 10 req/sec)

### Best Practices Sicurezza
- Mai esporre API key nel codice frontend
- Utilizzare HTTPS per tutte le comunicazioni
- Implementare rate limiting nell'applicazione
- Validare input sia lato client che server
- Loggare errori per debugging senza esporre dettagli sensibili

### Gestione GDPR
- Implementare checkbox consenso esplicito
- Fornire link alla privacy policy nel form
- Configurare double opt-in obbligatorio
- Offrire processo di disiscrizione semplice

## Implementazione Form Newsletter

### Struttura HTML Raccomandata
Il form dovrebbe includere:
- Campo email (obbligatorio)
- Campo nome (opzionale)
- Campo cognome (opzionale)
- Checkbox consenso privacy (obbligatorio)
- Pulsante submit con stati loading
- Area feedback per messaggi successo/errore

### Validazione Client-Side
- Controllo formato email real-time
- Verifica consenso privacy
- Feedback visivo immediato
- Prevenzione doppi submit

### Logica Server-Side
- Sanitizzazione input ricevuti
- Validazione server-side rigorosa
- Chiamata API EmailOctopus con retry logic
- Gestione response e feedback utente
- Logging operazioni per troubleshooting

## Strategie di Retry e Resilienza

### Gestione Rate Limiting
Implementare exponential backoff quando si riceve errore 429:
- Prima retry: attesa 1 secondo
- Seconda retry: attesa 2 secondi
- Terza retry: attesa 4 secondi
- Oltre terza: considera errore permanente

### Gestione Errori Temporanei
- Timeout di rete: retry automatico
- Errori 5xx server: retry con backoff
- Errori 4xx client: non ritentare, loggare per debug

## Monitoraggio e Manutenzione

### Metriche da Tracciare
- Numero iscrizioni giornaliere/settimanali
- Tasso di conferma double opt-in
- Errori API e cause
- Tempo risposta chiamate API
- Bounce rate email inviate

### Maintenance Tasks
- Controllo mensile validità API key
- Verifica configurazione double opt-in
- Review log errori per pattern problematici
- Backup periodico configurazione liste
- Test funzionalità dopo aggiornamenti EmailOctopus

## Istruzioni per Cursor AI

### Riferimenti Codice
Per implementare l'integrazione, analizzare la cartella `email-octopus-php-main` come riferimento per:
- Pattern di connessione API
- Struttura classi di servizio
- Gestione errori e response
- Metodologie di testing

### Principi Sviluppo
- Non copiare codice letteralmente dalla cartella di riferimento
- Adattare pattern e strutture al contesto FederComTur
- Mantenere codice semplice e leggibile per future modifiche
- Implementare error handling robusto
- Seguire PSR standards per codice PHP
- Documentare funzioni principali con PHPDoc

### Considerazioni Specifiche Progetto
- Rispettare budget di 200€ totali
- Prioritizzare funzionalità core vs features avanzate
- Mantenere compatibilità con hosting Superhosting
- Ottimizzare per facilità di manutenzione post-consegna
- Testare accuratamente su ambiente XAMPP locale

## Piano di Testing

### Test Funzionali
- Iscrizione con email valida
- Gestione email duplicata
- Validazione input malformati
- Processo double opt-in completo
- Disiscrizione tramite link email

### Test Non-Funzionali
- Performance sotto carico medio
- Gestione timeout di rete
- Comportamento con API key invalida
- Rate limiting e recovery
- Compatibilità browser principali

### Test di Integrazione
- Flusso completo: form → API → email → conferma
- Sincronizzazione dati tra sito e EmailOctopus
- Gestione errori end-to-end
- Fallback per servizi non disponibili

## Conclusioni e Raccomandazioni

L'integrazione EmailOctopus per FederComTur dovrebbe privilegiare semplicità e affidabilità rispetto a funzionalità avanzate. Il piano gratuito è adeguato per iniziare, con possibilità di upgrade futuro basato su crescita della base iscritti.

La chiave del successo è implementare correttamente il double opt-in per conformità normativa e mantenere un'architettura pulita che faciliti future espansioni del sistema newsletter.