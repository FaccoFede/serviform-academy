# Barra Superiore — Mappa tecnica completa

## File coinvolti

| File | Tipo | Ruolo |
|---|---|---|
| `apps/web/src/components/layout/Topbar.tsx` | Componente React | Struttura, logica, stato utente |
| `apps/web/src/components/layout/Topbar.module.css` | CSS Module | Tutti gli stili della topbar |
| `apps/web/src/app/layout.tsx` | Layout root | Monta `<Topbar />` — non va toccato per questi scopi |
| `apps/web/src/styles/globals.css` | Design system | Variabile `--topbar-h` che controlla l'altezza |
| `apps/web/src/context/AuthContext.tsx` | Context React | Fornisce `user`, `logout`, `isLoading` alla topbar |
| `apps/web/public/` | Cartella statica Next.js | Dove va il logo SVG personalizzato |

---

## Cosa fa ogni file

### `Topbar.tsx`
Gestisce l'intera barra superiore. Al suo interno:
- **Logo / Brand** — mostra testo o immagine SVG in base a `USE_CUSTOM_LOGO`
- **Nav** — array `NAV` con le voci di navigazione e i rispettivi `href`
- **Area destra** — campanella annunci + menu utente con dropdown, oppure pulsante "Accedi" se non autenticato
- **Dropdown utente** — avatar, nome, email, link rapidi a Dashboard / Catalogo / Profilo, pulsante Esci
- **Integrazione auth** — usa `useAuth()` per capire se l'utente è loggato e mostrare il menu corretto

### `Topbar.module.css`
Contiene le classi per ogni sezione visiva:
- `.bar` — la barra stessa (fixed, z-index, border-bottom)
- `.logoWrap`, `.brand`, `.logoImg` — zona logo a sinistra
- `.nav`, `.navLink`, `.navActive` — link di navigazione centrali
- `.right`, `.iconBtn`, `.ctaBtn` — zona destra (icone, CTA accedi)
- `.userBtn`, `.userPanel`, `.userPanelItem` — dropdown utente
- `.annPanel`, `.annHead` — dropdown annunci

### `globals.css`
La variabile:
```css
--topbar-h: 56px;
```
Controlla l'altezza della topbar e viene letta anche da `Shell.tsx` per calcolare il `padding-top` del contenuto principale.

---

## Come modificare

### Testo "Serviform Academy"
**File:** `apps/web/src/components/layout/Topbar.tsx`

Cerca la costante in cima al file:
```ts
const BRAND_TEXT = 'Serviform Academy'
```
Cambia il valore con il testo che vuoi. Assicurati che `USE_CUSTOM_LOGO = false`.

Per modificare lo stile del testo (dimensione, peso, colore):
**File:** `apps/web/src/components/layout/Topbar.module.css`
```css
.brand {
  font-family: var(--font-display);
  font-size: 15px;      /* ← dimensione */
  font-weight: 700;     /* ← peso */
  color: var(--ink);    /* ← colore */
  letter-spacing: -.2px;
}
```

---

### Sostituire il logo con un file SVG

**Step 1 — Copia il file SVG nel progetto:**
```
apps/web/public/logo.svg
```
La cartella `public/` in Next.js è la root statica: tutto ciò che è lì è accessibile come `/logo.svg` senza importazioni.

**Step 2 — Attiva il logo SVG:**
Apri `apps/web/src/components/layout/Topbar.tsx` e modifica le costanti in cima:
```ts
const USE_CUSTOM_LOGO = true        // era false
const LOGO_PATH       = '/logo.svg' // percorso del file in public/
const LOGO_WIDTH      = 140         // larghezza desiderata in px
const LOGO_HEIGHT     = 32          // altezza desiderata in px
```

**Step 3 — Aggiusta le dimensioni se necessario:**
Nel CSS (`Topbar.module.css`) la classe `.logoImg` ha:
```css
.logoImg {
  display: block;
  max-height: 28px;   /* ← regola questa se il logo è troppo grande/piccolo */
  width: auto;
  object-fit: contain;
}
```

> La topbar ha un'altezza di 56px (`--topbar-h`). Tieni il logo sotto 32px di altezza per evitare overflow.

---

### Aggiungere/rimuovere voci di navigazione
**File:** `apps/web/src/components/layout/Topbar.tsx`

Cerca l'array `NAV`:
```ts
const NAV = [
  { href: '/catalog',  label: 'Corsi' },
  { href: '/newsroom', label: 'Newsroom' },
]
```
Aggiungi o rimuovi oggetti dall'array. Poi crea la pagina corrispondente in `apps/web/src/app/nuova-voce/page.tsx`.

---

### Cambiare l'altezza della topbar
**File:** `apps/web/src/styles/globals.css`
```css
--topbar-h: 56px;  /* ← modifica questo valore */
```
La variabile viene usata anche da `Shell.tsx` per il padding del contenuto, quindi cambiandola si aggiorna tutto automaticamente.

---

## Schema visivo della topbar

```
┌─────────────────────────────────────────────────────────────────────┐
│  [LOGO/BRAND]   [Corsi]  [Newsroom]  [Admin]      [🔔]  [Avatar ▾] │
│   logoWrap       nav                               right             │
└─────────────────────────────────────────────────────────────────────┘
         ↑                                              ↑
    brand o logoImg                          iconBtn + userBtn
    (controllato da                          (visibili solo
     USE_CUSTOM_LOGO)                         se autenticato)
```
