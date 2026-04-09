# Newsroom — Mappa tecnica completa

## File coinvolti

| File | Tipo | Ruolo |
|---|---|---|
| `apps/web/src/app/newsroom/page.tsx` | Pagina (Client Component) | Struttura principale, fetch dati, filtri, render lista comunicazioni |
| `apps/web/src/app/newsroom/Newsroom.module.css` | CSS Module | Tutti gli stili della Newsroom |
| `apps/web/src/app/communications/page.tsx` | Pagina (Client Component) | Pagina separata comunicazioni — da **unificare** con Newsroom |
| `apps/web/src/app/communications/Communications.module.css` | CSS Module | Stili della pagina comunicazioni separata |
| `apps/web/src/app/communications-events/page.tsx` | Pagina (Client Component) | Variante con filtri per sezione (NEWS/EVENTS/PRESS/RULES) |
| `apps/web/src/context/AuthContext.tsx` | Context React | Fornisce `token` per le chiamate autenticate |
| `apps/web/src/styles/globals.css` | Design system | Variabili CSS globali |

---

## Flusso dei dati

```
newsroom/page.tsx (Client Component)
   │
   ├── useAuth() → { token }
   │
   └── useEffect [token] → fetch unica:
         GET /announcements  (con Bearer token se autenticato)
         └── setItems([])
               └── array { id, title, body, type, publishedAt,
                           isPinned, read, bannerUrl, content }
```

**Logica filtri (useMemo):**
```ts
// 1. filtro per tipo
let out = items
if (filter !== 'ALL') out = out.filter(a => a.type === filter)

// 2. ricerca testuale
if (q) out = out.filter(a =>
  a.title.includes(ql) || a.body.includes(ql)
)

// 3. ordinamento
if (sortBy === 'type') out.sort(...)
```

**Statistiche KPI (calcolate dai dati):**
```ts
stats.total   = items.length
stats.unread  = items.filter(a => !a.read).length
stats.pinned  = items.filter(a => a.type === 'NEW_COURSE').length
stats.upcoming = items.filter(a => a.type === 'WEBINAR').length
```

---

## Struttura attuale della pagina

```
┌───────────────────────────────────────────────────────────┐
│  SUBHEADER (breadcrumb + titolo "Comunicazione & Eventi") │
├───────────────────────────────────────────────────────────┤
│  HERO ("In evidenza oggi, [data]")                        │
├───────────────────────────────────────────────────────────┤
│  KPI ROW (4 card: da leggere, in primo piano, webinar, tot│
├───────────────────────────────────────────────────────────┤
│  TOOLBAR (titolo sezione + ricerca + ordinamento)         │
├───────────────────────────────────────────────────────────┤
│  FILTRI TIPO (chip: Tutte / NEWS / NEW_COURSE / ...)      │
├───────────────────────────────────────────────────────────┤
│  LISTA COMUNICAZIONI (stile articolo orizzontale)         │
│  [tipo] │ [titolo] [descrizione]            │ [data]      │
└───────────────────────────────────────────────────────────┘
```

---

## Gestione filtri

| Filtro | Stato | Comportamento attuale |
|---|---|---|
| Tipo | `filter` (string, default `'ALL'`) | filtra per `a.type` |
| Ricerca | `q` (string) | filtra per titolo o corpo |
| Ordinamento | `sortBy` (`'date'` \| `'type'`) | ordina array `filtered` |

I tipi vengono generati dinamicamente:
```ts
const types = ['ALL', ...new Set(items.map(a => a.type))]
```

---

## Punti di modifica

| Cosa modificare | File | Dove |
|---|---|---|
| Titolo pagina | `page.tsx` | `.pageTitle` nel JSX |
| Testo hero | `page.tsx` | `.heroTitle` e `.heroDesc` |
| Etichette KPI | `page.tsx` | array nel `kpiRow` |
| Logica filtri KPI | `page.tsx` | calcoli `stats.*` e click handler |
| Tipi e colori comunicazioni | `page.tsx` | `TYPE_LABELS`, `TYPE_COLORS` |
| Layout lista comunicazioni | `Newsroom.module.css` | `.articleList`, `.article`, `.articleBody` |
| Aggiungere modale anteprima | `page.tsx` | aggiungere stato `selected` + componente modal |
| Eliminare sezione `/communications` | filesystem | rimuovere `apps/web/src/app/communications/` |
| Unificare con `/communications-events` | — | vedi sezione "Revisione" sotto |

---

## Revisione richiesta — implementazione dettagliata

---

### 1 — Click su comunicazione apre direttamente l'anteprima

**Problema attuale:** gli articoli nella Newsroom non sono cliccabili (nessun `onClick`, nessun modale).

**Soluzione:** aggiungere stato + modale in `newsroom/page.tsx`.

**Step A** — Importare/creare il modale. Il `DetailModal` esiste già in `communications/page.tsx`. Copiarlo come componente condiviso:
```
apps/web/src/components/ui/AnnouncementModal.tsx
```

**Step B** — In `newsroom/page.tsx` aggiungere:
```tsx
const [selected, setSelected] = useState<any>(null)
```

**Step C** — Rendere ogni articolo cliccabile:
```tsx
// In articleList.map():
<article key={a.id} className={styles.article}
  onClick={() => setSelected(a)}
  style={{ cursor: 'pointer' }}>
  ...
</article>
```

**Step D** — Aggiungere il modale in fondo al JSX:
```tsx
{selected && (
  <AnnouncementModal ann={selected} onClose={() => setSelected(null)} />
)}
```

---

### 2 — Eliminare sezione separata "Tutte le comunicazioni" e unificarla in Newsroom

Le comunicazioni sono attualmente distribuite in **3 pagine**:
- `/newsroom` — lista comunicazioni (stile articolo)
- `/communications` — griglia card con modal
- `/communications-events` — filtri per sezione (NEWS/EVENTS/PRESS)

**Azione:** unificare tutto in `/newsroom`, eliminare `/communications` e `/communications-events`.

Steps:
1. Spostare la logica di `/communications/page.tsx` (card con banner + modal) in `/newsroom/page.tsx`
2. Aggiornare tutti i link `href="/communications"` e `href="/communications-events"` nel progetto verso `href="/newsroom"`
3. Rimuovere le cartelle `apps/web/src/app/communications/` e `apps/web/src/app/communications-events/`

**File con link da aggiornare:**
- `apps/web/src/app/dashboard/page.tsx` → `href="/communications"` → `/newsroom`
- `apps/web/src/components/layout/Topbar.tsx` → se presente

---

### 3 — Visualizzazione comunicazioni come card (con immagine di anteprima)

**Struttura card richiesta:**
```
┌────────────────────────────────────────┐
│  [Banner immagine o placeholder]       │
├────────────────────────────────────────┤
│  [TIPO BADGE]           [DATA]         │
│  Titolo della comunicazione            │
│  Testo sintetico (2-3 righe)...        │
└────────────────────────────────────────┘
```

**Logica immagine:**
```tsx
{a.bannerUrl
  ? <img src={a.bannerUrl} alt="" className={styles.cardBanner} />
  : <div className={styles.cardBannerEmpty} />  // stessa altezza, nessuna immagine
}
```

CSS:
```css
.cardBanner, .cardBannerEmpty {
  width: 100%;
  height: 160px;
  object-fit: cover;
  border-radius: 8px 8px 0 0;
}
.cardBannerEmpty {
  background: var(--surface);
  border-bottom: 1px solid var(--border);
}
```

---

### 4 — Filtri KPI come filtri attivi

**Comportamento richiesto:**

| KPI cliccato | Comportamento |
|---|---|
| "Comunicati da leggere" | filtra per `!a.read` (tracking lettura) |
| "Comunicati in primo piano" | filtra per `a.isPinned === true` |
| "Webinar e eventi" | redirect a `/calendar` |
| "Totale comunicazioni" | rimuove tutti i filtri, mostra tutto |

**Tracking lettura (aperta = letta):**
Il campo `read` deve essere marcato quando l'utente apre il modale della comunicazione.

Attualmente nel backend: verificare se esiste `PATCH /announcements/:id/read` o simile.

Se non esiste, aggiungere nel backend:
```ts
// announcements.controller.ts
@Patch(':id/read')
@UseGuards(JwtAuthGuard)
markAsRead(@Param('id') id: string, @Request() req) {
  return this.announcementsService.markAsRead(id, req.user.id)
}
```

**Implementazione filtri in `page.tsx`:**
```tsx
// Aggiungere stato filtro attivo KPI
const [kpiFilter, setKpiFilter] = useState<'unread' | 'pinned' | null>(null)

// Nel calcolo filtered (useMemo):
let out = items
if (kpiFilter === 'unread') out = out.filter(a => !a.read)
if (kpiFilter === 'pinned') out = out.filter(a => a.isPinned)
// ...poi applicare i filtri normali tipo/ricerca

// Nelle card KPI — aggiungere onClick:
onClick={() => setKpiFilter(k.key === 'unread' ? 'unread' :
               k.key === 'pinned' ? 'pinned' :
               k.key === 'total' ? null : null)}
```

---

### 5 — Sezione Calendario ed eventi

**Layout richiesto (2 colonne):**
```
┌──────────────────────┬──────────────────────┐
│  Calendario          │  Prossimi eventi      │
│  (colonna principale)│  [card evento 1]      │
│  [Cal. completo]     │  [card evento 2]      │
│  Giorni con eventi   │  [card evento 3]      │
│  evidenziati         │  ...                  │
│                      │  Tutti gli eventi →   │
└──────────────────────┴──────────────────────┘
```

**File da creare/modificare:**
- `newsroom/page.tsx` → aggiungere sezione calendario in fondo
- `apps/web/src/app/calendar/page.tsx` → nuova pagina (calendario completo + lista eventi mese)

**Dati eventi:** l'endpoint `/announcements` restituisce già i record di tipo `WEBINAR` ed `EVENTS`. Per il calendario completo potrebbe essere necessario un endpoint dedicato `/events` (verificare se esiste in `apps/api/src/events/`).

**Libreria calendario consigliata:** `react-calendar` (leggera, zero dipendenze pesanti):
```bash
pnpm add react-calendar
```

**Logica evidenziazione giorni:**
```tsx
const eventDates = items
  .filter(a => ['WEBINAR', 'EVENTS'].includes(a.type))
  .map(a => new Date(a.publishedAt).toDateString())

// In <Calendar>:
tileClassName={({ date }) =>
  eventDates.includes(date.toDateString()) ? styles.hasEvent : null
}
```

**Card evento richiesta:**
```tsx
<div className={styles.eventCard}>
  <div className={styles.eventDate}>{formatDate(event.publishedAt)}</div>
  <div className={styles.eventTitle}>{event.title}</div>
  <div className={styles.eventType}>{TYPE_LABELS[event.type]}</div>
</div>
```

**Link "Tutti gli eventi":**
```tsx
<Link href="/calendar" className={styles.allEventsLink}>
  Tutti gli eventi →
</Link>
```
