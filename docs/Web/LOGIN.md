# Pagina di Login — Mappa tecnica completa

## File coinvolti

| File | Tipo | Ruolo |
|---|---|---|
| `apps/web/src/app/auth/login/page.tsx` | Pagina (Client Component) | Logica del form, chiamata API, redirect post-login |
| `apps/web/src/app/auth/login/Login.module.css` | CSS Module | Tutti gli stili della pagina login (layout 2 colonne) |
| `apps/web/src/context/AuthContext.tsx` | Context React | Fornisce `login()`, `user`, `isLoading` — gestisce token JWT e stato globale |
| `apps/web/src/app/layout.tsx` | Layout root | Monta Topbar, Shell, AuthProvider che wrappano anche la pagina login |
| `apps/web/src/lib/api.ts` | Client API | Espone `api.auth.login()` e `api.auth.profile()` usati dall'AuthContext |
| `apps/web/src/styles/globals.css` | Design system | Variabili CSS (`--font-display`, `--red`, `--ink`, `--border`, ecc.) |
| `apps/web/src/app/auth/login/LoginPage.module.css` | CSS Module (legacy) | File CSS alternativo non usato dalla pagina attuale — può essere rimosso |

---

## Cosa fa ogni file

### `page.tsx`
Componente Client (`'use client'`). Gestisce:
- stato locale del form (`email`, `password`, `loading`, `error`)
- fetch pubblica delle statistiche per popolare la colonna sinistra (`/software`, `/courses`)
- **redirect automatico** se l'utente è già loggato → `router.replace('/dashboard')`
- submit del form → chiama `login()` da `AuthContext` → in caso di successo `router.push('/dashboard')`

### `Login.module.css`
Layout a **due colonne** (`grid-template-columns: 1fr 1fr`):
- **Colonna sinistra** (`.brand`): sfondo scuro `#0A0A0A`, logo, titolo, statistiche dinamiche
- **Colonna destra** (`.formPanel`): card bianca con form email + password

Su mobile (<900px) la colonna sinistra sparisce (`display: none`) e rimane solo il form.

### `AuthContext.tsx`
Gestisce l'intera sessione utente:
- salva il JWT in `localStorage` con chiave `TOKEN_KEY`
- al bootstrap (avvio app) controlla se esiste un token salvato → chiama `GET /auth/profile` per recuperare i dati utente
- espone: `user`, `token`, `login()`, `logout()`, `register()`, `isLoading`
- il `globalLogoutHandler` intercetta i 401 su `/auth/profile` e fa logout automatico

### `lib/api.ts`
Funzioni per le chiamate auth:
```ts
api.auth.login(email, password)   // POST /auth/login
api.auth.profile()                // GET /auth/profile
api.auth.register(...)            // POST /auth/register
api.auth.updateProfile(...)       // PATCH /auth/profile
api.auth.changePassword(...)      // PATCH /auth/change-password
```

---

## Flusso dei dati — Login

```
Utente compila form
        │
        ▼
handleSubmit() in page.tsx
        │
        ▼
login(email, password) da AuthContext
        │
        ▼
POST /auth/login  →  { accessToken, user }
        │
        ├── OK: salva token in localStorage
        │         setToken(token)
        │         setUser(user)
        │         router.push('/dashboard')
        │
        └── Errore: setError(err.message)
                    mostra messaggio rosso nel form
```

**Caricamento statistiche (sinistra):**
```
useEffect al mount
        │
        ▼
GET /software  (senza auth)
GET /courses   (senza auth)
        │
        ▼
setStats({ software, courses, units })
        → aggiorna i 3 numeri nella colonna sinistra
```

---

## Gestione stato e autenticazione

| Stato | Dove | Persistenza |
|---|---|---|
| Token JWT | `AuthContext` → `localStorage` | Persiste tra sessioni |
| Dati utente (`user`) | `AuthContext` → state React | In memoria (ricaricato da `/auth/profile` al refresh) |
| Ruolo utente | Campo `role` in `user` (`USER`, `ADMIN`, `TEAM_ADMIN`) | Nel payload JWT e nel profilo |
| Redirect post-login | `page.tsx` → `router.push('/dashboard')` | — |
| Redirect se già loggato | `useEffect` in `page.tsx` → `router.replace('/dashboard')` | — |

---

## Dove intervenire per modificare UI e comportamento

| Cosa modificare | File | Cosa cercare/cambiare |
|---|---|---|
| Testo titolo form ("Accedi al tuo account") | `page.tsx` | `.formTitle` nel JSX |
| Sottotitolo form | `page.tsx` | `.formSub` nel JSX |
| Link "Contatta Serviform" | `page.tsx` | elemento `<a>` in `.formFooter` |
| Colori / font form | `Login.module.css` | classi `.formBox`, `.formTitle`, `.label`, `.btn` |
| Sfondo colonna sinistra | `Login.module.css` | `.brand { background: #0A0A0A }` |
| Titolo colonna sinistra | `page.tsx` | elemento `.brandTitle` nel JSX |
| Statistiche mostrate (software/corsi/unità) | `page.tsx` | array `statItems` e `useEffect` che fa fetch |
| Redirect dopo login (attualmente `/dashboard`) | `page.tsx` | `router.push('/dashboard')` in `handleSubmit` |
| Durata token / scadenza sessione | `apps/api/src/auth/auth.service.ts` | opzione `expiresIn` nel `JwtService.sign()` |

---

## Logo nella pagina di Login

### Dove si trova
Il logo nella pagina di login è gestito direttamente in `page.tsx`, nella colonna sinistra:
```tsx
<div className={styles.logo}>
  <div className={styles.logoText}>
    <span className={styles.logoName}>Serviform</span>
    <span className={styles.logoProduct}>Academy</span>
  </div>
</div>
```
È **indipendente** dalla Topbar — non usa il componente `Topbar.tsx`.

### Come sostituirlo con un SVG
1. Copia il file SVG in `apps/web/public/logo.svg`
2. In `page.tsx`, sostituisci il blocco `.logo` con:
```tsx
import Image from 'next/image'

<div className={styles.logo}>
  <Image src="/logo.svg" alt="Serviform Academy" width={140} height={36} priority />
</div>
```
3. Aggiusta `.logo` in `Login.module.css` se necessario:
```css
.logo {
  margin-bottom: 64px;
  display: flex;
  align-items: center;
}
```

### Percorso file
```
apps/web/public/logo.svg          ← metti qui il file SVG
apps/web/src/app/auth/login/page.tsx  ← modifica qui il JSX
apps/web/src/app/auth/login/Login.module.css  ← stili del logo nella login
```

---

## Schema visivo

```
┌─────────────────────────┬─────────────────────────┐
│  COLONNA SINISTRA       │  COLONNA DESTRA          │
│  (sfondo #0A0A0A)       │  (sfondo #F7F7F5)        │
│                         │                          │
│  [Logo / SVG]           │  ┌──────────────────┐    │
│                         │  │ Accedi al tuo    │    │
│  La piattaforma         │  │ account          │    │
│  di formazione          │  │                  │    │
│  professionale.         │  │ EMAIL            │    │
│                         │  │ [___________]    │    │
│  4 software             │  │                  │    │
│  6 corsi                │  │ PASSWORD         │    │
│  13 unità               │  │ [___________]    │    │
│                         │  │                  │    │
│                         │  │ [  Accedi  ]     │    │
│                         │  │                  │    │
│                         │  │ Non hai accesso? │    │
│                         │  └──────────────────┘    │
└─────────────────────────┴─────────────────────────┘
         ↑                          ↑
   page.tsx (.brand)         page.tsx (.formPanel)
   Login.module.css           Login.module.css
```
