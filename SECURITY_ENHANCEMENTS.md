# 🔒 Security Enhancements - FederComTur Admin System

## Vulnerabilità Risolte

### 1. CSRF Protection Completa
- **Implementato**: Token CSRF generation e verification
- **Endpoint**: `GET /api/admin-auth.php?action=csrf-token`
- **Protezione**: Tutte le operazioni POST tranne login
- **Utilizzo**: Includere `csrf_token` in tutte le richieste POST

### 2. HSTS Header per HTTPS Enforcement
- **Header**: `Strict-Transport-Security: max-age=31536000; includeSubDomains; preload`
- **Attivazione**: Solo quando HTTPS è rilevato
- **Beneficio**: Forza connessioni sicure per 1 anno

### 3. Session Fixation Prevention
- **Fix**: Distruzione completa sessione prima di crearne una nuova
- **Implementazione**: `session_destroy()` + `session_start()` + `session_regenerate_id(true)`
- **Beneficio**: Previene attacchi di session fixation

### 4. Timing Attack Protection
- **Implementazione**: Normalizzazione tempo di risposta a 100ms
- **Metodo**: `getUserByUsername()` con `usleep()` per delay costante
- **Beneficio**: Previene enumerazione utenti via timing

### 5. Error Information Disclosure Reduction
- **Prima**: Messaggi specifici ("Account bloccato", "Rate limit exceeded")
- **Dopo**: Messaggio generico ("Credenziali non valide")
- **Beneficio**: Riduce informazioni disponibili agli attaccanti

## Nuovi Security Headers

```http
X-Content-Type-Options: nosniff
X-Frame-Options: DENY
X-XSS-Protection: 1; mode=block
Referrer-Policy: strict-origin-when-cross-origin
Permissions-Policy: geolocation=(), microphone=(), camera=()
Content-Security-Policy: default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data:;
Strict-Transport-Security: max-age=31536000; includeSubDomains; preload (HTTPS only)
```

## Configurazioni di Sicurezza

### Session Security
- **Lifetime**: 15 minuti (900s)
- **Idle Timeout**: 5 minuti (300s)
- **Cookie Security**: HttpOnly, Secure, SameSite=Strict

### Password Policy
- **Lunghezza minima**: 12 caratteri
- **Requisiti**: Maiuscole, minuscole, numeri, simboli
- **Hashing**: Argon2ID (64MB memory, 4 iterazioni, 3 thread)

### Rate Limiting
- **Soglia**: 10 tentativi in 15 minuti per IP
- **Lockout**: 30 minuti dopo 5 tentativi falliti per utente

## Utilizzo CSRF Protection

### Frontend JavaScript
```javascript
// Ottieni token CSRF
const response = await fetch('api/admin-auth.php?action=csrf-token');
const data = await response.json();
const csrfToken = data.csrf_token;

// Invia con token CSRF
fetch('api/admin-auth.php?action=logout', {
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
        'X-CSRF-Token': csrfToken
    },
    body: JSON.stringify({ csrf_token: csrfToken })
});
```

### Backend PHP
```php
// Verifica token CSRF
if (!$auth->verifyCSRFToken($_POST['csrf_token'])) {
    sendErrorResponse('Token CSRF non valido', 403);
    return;
}
```

## Note di Deployment

1. **HTTPS Obbligatorio**: HSTS header attivo solo su HTTPS
2. **Debug Disabilitato**: Error reporting ridotto in produzione
3. **Password Upgrade**: Eseguire `api/upgrade-passwords.php` per migrare password esistenti
4. **CSRF Token**: Implementare nei form frontend per operazioni sensibili

## Testing Security

### Rate Limiting
```bash
# Test rate limiting (10 tentativi in 15 min)
for i in {1..12}; do
  curl -X POST http://localhost:8080/FEDERCOMTUR/api/admin-auth.php?action=login \
    -H "Content-Type: application/json" \
    -d '{"username":"admin","password":"wrong"}'
done
```

### CSRF Protection
```bash
# Test senza token CSRF (dovrebbe fallire)
curl -X POST http://localhost:8080/FEDERCOMTUR/api/admin-auth.php?action=logout \
  -H "Content-Type: application/json" \
  -d '{}'
```

### Session Timeout
```javascript
// Test idle timeout (5 minuti)
setTimeout(() => {
    fetch('api/admin-auth.php?action=check')
        .then(r => r.json())
        .then(data => console.log('Auth status:', data));
}, 300000); // 5 minuti
```
