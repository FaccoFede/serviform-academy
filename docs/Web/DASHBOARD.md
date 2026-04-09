# Dashboard Utente — Mappa tecnica completa

## File coinvolti

| File | Tipo | Ruolo |
|---|---|---|
| `apps/web/src/app/dashboard/page.tsx` | Pagina (Client Component) | Struttura, fetch dati, logica KPI, render corsi e comunicazioni |
| `apps/web/src/app/dashboard/DashboardPage.module.css` | CSS Module | Tutti gli stili della dashboard |
| `apps/web/src/context/AuthContext.tsx` | Context React | Fornisce `user`, `token`, `isLoading` |
| `apps/web/src/lib/brands.ts` | Configurazione | Mappa slug software → colori per le card corsi |
| `apps/web/src/components/layout/Topbar.tsx` | Layout | Barra superiore — montata in `layout.tsx` |
| `apps/web/src/app/layout.tsx` | Layout root | Wrappa con Topbar, Shell, AuthProvider |
| `apps/web/src/styles/globals.css` | Design system | Variabili CSS globali |

---

## Flusso dei dati

```
page.tsx (Client Component)
   │
   ├── useAuth() → { user, token }
   │
   └── useEffect [token] → 3 fetch parallele:
         │
         ├── GET /progress/all        → setProgress([])
         │     └── array corsi con { courseSlug, courseTitle, softwareSlug,
         │                           percent, completed, total }
         │
         ├── GET /progress/last-viewed → setLastViewed({})
         │     └── { courseSlug, unitSlug, courseTitle, unitTitle }
         │
         └── GET /announcements       → setAnnouncements([])
               └── array { id, title, body, type, publishedAt, isPinned }
```

**Calcoli derivati dai dati:**
```ts
const started   = progress.filter(c => c.completed > 0)
const completed = progress.filter(c => c.percent >= 100)
const inProgress = started.filter(c => c.percent < 100)
const avgPct    = media delle percentuali dei corsi iniziati
const totalDone = totale unità completate
```

---

## Componenti interni

### `ProgressRing` (definito in page.tsx)
Cerchio SVG che mostra la percentuale di completamento di un corso.
```tsx
<ProgressRing pct={c.percent} />
```
- raggio `r = 20`, viewBox `52x52`
- usa `strokeDasharray` per il fill proporzionale
- mostra la percentuale come `<text>` al centro

---

## Struttura visiva della pagina

```
┌─────────────────────────────────────────────────────────────┐
│  HERO (saluto + resume card)                                │
│  "Buongiorno, [Nome]"    │  [Continua da dove eri rimasto]  │
├──────────────────────────┴────────────────────────────────── │
│  KPI ROW                                                    │
│  Corsi assegnati │ Iniziati │ Completati │ Unità │ Avg%     │
├─────────────────────────────────────────────────────────────┤
│  GRID (2 colonne)                                           │
│  ┌────────────────────┐  ┌─────────────────────────────┐   │
│  │ Corsi in corso     │  │ Comunicazioni               │   │
│  │  [card] [ring]     │  │  [ann1] [ann2] [ann3]       │   │
│  │  [card] [ring]     │  │                             │   │
│  │                    │  │ CTA: Esplora il catalogo    │   │
│  │ Completati         │  └─────────────────────────────┘   │
│  │  [card completato] │                                     │
│  └────────────────────┘                                     │
└─────────────────────────────────────────────────────────────┘
```

---

## Punti di modifica

| Cosa modificare | File | Dove |
|---|---|---|
| Saluto (Buongiorno/pomeriggio/sera) | `page.tsx` | costante `greet` calcolata da `h` (ora) |
| Nome visualizzato | `page.tsx` | `displayName = user.firstName \|\| user.name.split(' ')[0] \|\| user.email` |
| Numero e tipo di KPI | `page.tsx` | array `.kpiRow` nel JSX |
| Sezione "In corso" (card corsi) | `page.tsx` | `inProgress.map(...)` |
| Sezione "Completati" | `page.tsx` | `completed.map(...)` |
| Sezione "Comunicazioni" | `page.tsx` | `announcements.slice(0, 4).map(...)` |
| Link "Tutte →" comunicazioni | `page.tsx` | `<Link href="/communications">` → cambia in `/newsroom` |
| Resume card ("Continua da dove eri rimasto") | `page.tsx` | blocco `{lastViewed && ...}` |
| Stili card corsi | `DashboardPage.module.css` | `.courseCard`, `.courseCardTop`, `.courseTitle` |
| Stili KPI | `DashboardPage.module.css` | `.kpiCard`, `.kpiValue`, `.kpiLabel` |
| Colori brand nelle card | `lib/brands.ts` | `getBrand(softwareSlug)` |

---

## Modifiche richieste — implementazione

---

### Step 1 — Aggiungere "Newsroom" nella Topbar

**File:** `apps/web/src/components/layout/Topbar.tsx`

La voce è **già presente** nell'array `NAV`:
```ts
const NAV = [
  { href: '/catalog',  label: 'Corsi' },
  { href: '/newsroom', label: 'Newsroom' },  // ← già qui
]
```
Nessuna modifica necessaria al Topbar. ✓

---

### Step 2 — Logo e testo reindirizzano alla Dashboard (non alla homepage)

**File:** `apps/web/src/components/layout/Topbar.tsx`

Riga attuale:
```tsx
<Link href="/" className={styles.logoWrap}>
```

**Modifica:** per gli utenti loggati il click deve andare a `/dashboard`, per gli utenti non loggati a `/`.

```tsx
// In Topbar.tsx, sostituisci:
<Link href="/" className={styles.logoWrap}>

// Con:
<Link href={user ? '/dashboard' : '/'} className={styles.logoWrap}>
```

`user` è già disponibile tramite `useAuth()` che è già importato nel componente.

---

### Step 3 — Progress circle nelle card corsi

Il componente `ProgressRing` **esiste già** in `dashboard/page.tsx`. È già usato nelle card "In corso".

Se il cerchio non appare nella sezione "Completati", la modifica è nella card completata. Attualmente mostra solo il badge `✓ Completato`.

**Modifica in `page.tsx`** — nella sezione "Completati":
```tsx
// PRIMA:
<Link key={c.courseId || c.courseSlug} href={`/courses/${c.courseSlug}`}
  className={[styles.courseCard, styles.courseCardDone].join(' ')}>
  <div className={styles.courseCardTop}>
    <span className={styles.courseTag} ...>{brand.name}</span>
    <span className={styles.doneBadge}>✓ Completato</span>  {/* ← rimuovi */}
  </div>
  <div className={styles.courseTitle}>{c.courseTitle}</div>
</Link>

// DOPO:
<Link key={c.courseId || c.courseSlug} href={`/courses/${c.courseSlug}`}
  className={[styles.courseCard, styles.courseCardDone].join(' ')}>
  <div className={styles.courseCardTop}>
    <span className={styles.courseTag} ...>{brand.name}</span>
  </div>
  <div className={styles.courseCardBody}>
    <div className={styles.courseTitle}>{c.courseTitle}</div>
    <ProgressRing pct={100} />   {/* ← aggiunto */}
  </div>
</Link>
```

Stile da aggiungere in `DashboardPage.module.css`:
```css
.courseCardBody {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}
```

---

### Step 4 — Click comunicazione apre direttamente l'anteprima

**Problema attuale:** il click sulle comunicazioni in dashboard porta a `/communications` (pagina separata).

**Soluzione:** portare la `DetailModal` dalla pagina `/communications/page.tsx` direttamente nella dashboard.

**File da modificare:** `apps/web/src/app/dashboard/page.tsx`

**Step A** — Aggiungere lo stato per il modale:
```tsx
const [selectedAnn, setSelectedAnn] = useState<any>(null)
```

**Step B** — Rendere le card comunicazioni cliccabili:
```tsx
// PRIMA:
<div key={a.id} className={styles.annCard}>
  ...
</div>

// DOPO:
<div key={a.id} className={styles.annCard}
  onClick={() => setSelectedAnn(a)}
  style={{ cursor: 'pointer' }}>
  ...
</div>
```

**Step C** — Cambiare il link "Tutte →" per puntare alla Newsroom:
```tsx
// PRIMA:
<Link href="/communications" className={styles.sectionLink}>Tutte →</Link>

// DOPO:
<Link href="/newsroom" className={styles.sectionLink}>Tutte →</Link>
```

**Step D** — Aggiungere il modale in fondo al JSX (copiare `DetailModal` da `communications/page.tsx` o creare un componente condiviso):
```tsx
{selectedAnn && (
  <AnnouncementModal ann={selectedAnn} onClose={() => setSelectedAnn(null)} />
)}
```

> Il componente `DetailModal` è già implementato in `apps/web/src/app/communications/page.tsx`. Puoi spostarlo in `apps/web/src/components/ui/AnnouncementModal.tsx` per condividerlo tra Dashboard e Newsroom.
