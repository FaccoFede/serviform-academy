# Pagina Iniziale — Mappa tecnica completa

## File coinvolti

| File | Tipo | Ruolo |
|---|---|---|
| `apps/web/src/app/page.tsx` | Pagina Next.js (Server Component) | Struttura, fetch dati, rendering |
| `apps/web/src/app/page.module.css` | CSS Module | Tutti gli stili della homepage |
| `apps/web/src/lib/api.ts` | Client API | Recupera i corsi dal backend (`api.courses.findAll()`) |
| `apps/web/src/lib/brands.ts` | Configurazione | Mappa slug software → colori/nomi brand |
| `apps/web/src/components/layout/Topbar.tsx` | Layout | Barra superiore (montata in `layout.tsx`) |
| `apps/web/src/app/layout.tsx` | Layout root | Wrappa la pagina con Topbar, Rail, Shell |

---

## Flusso dei dati

```
page.tsx (Server Component)
   │
   ├─ api.courses.findAll()
   │     └─ GET /courses  (backend NestJS)
   │           └─ restituisce array Course con { id, slug, title,
   │                description, duration, level, software: { slug, name }, units[] }
   │
   ├─ calcola stats (courses.length, units totali, ore totali)
   │
   ├─ seleziona teaser (FEATURED_SLUGS o primi 3)
   │
   └─ legge SOFTWARE_BRANDS da lib/brands.ts
         └─ mappa slug → { name, color, light } per ogni corso
```

---

## Sezioni della pagina e dove intervenire

### 1. Hero (statistiche grandi)

**Sezione:** `/* ── HERO ──────────── */` in `page.tsx`
**Stili:** classi `.heroStats`, `.heroStat`, `.heroStatN`, `.heroStatL` in `page.module.css`

Le tre statistiche mostrate sono calcolate dinamicamente:
```ts
{ n: stats.courses + '+', l: 'corsi' }
{ n: stats.units   + '+', l: 'unità didattiche' }
{ n: stats.hours > 0 ? stats.hours + 'h+' : '—', l: 'ore di formazione' }
```

**Problema risolto — linee troppo vicine ai numeri:**
Nel CSS aggiornato (`page.module.css`) i valori corretti sono:
```css
.heroStat {
  padding: 36px 0 36px 0;   /* era 28px — aumentato */
}
.heroStatL {
  margin-top: 10px;          /* era 6px — aumentato per staccare label dal numero */
}
```

Per modificare i valori delle statistiche o aggiungerne una quarta, intervieni
sull'array inline nel JSX di `page.tsx`:
```tsx
{[
  { n: stats.courses + '+', l: 'corsi' },
  { n: stats.units   + '+', l: 'unità didattiche' },
  { n: stats.hours > 0 ? stats.hours + 'h+' : '—', l: 'ore di formazione' },
].map((s, i) => ( ... ))}
```

---

### 2. Sezione "Cosa trovi sulla piattaforma" — Teaser corsi

**Sezione:** `/* ── TEASER CORSI ──── */` in `page.tsx`
**Stili:** `.sectionDark`, `.teaserGrid`, `.teaserCard`, `.teaserFoot`, `.teaserSep` in `page.module.css`

#### Problema risolto — Tag software errato (sempre "EngView")
**Causa:** il fallback precedente era `SOFTWARE_BRANDS.engview`.

**Fix applicato** in `page.tsx`:
```tsx
const softwareSlug = c.software?.slug || ''
const brand = SOFTWARE_BRANDS[softwareSlug] || {
  name: c.software?.name || softwareSlug || 'N/D',
  color: '#4E4D4D',
  light: '#F5F5F5',
}
```
Ora il tag legge lo slug reale dal campo `software` del corso. Se lo slug non è
presente in `SOFTWARE_BRANDS`, usa il `name` del software dal database come fallback.

**Se un corso mostra ancora il tag sbagliato**, il problema è nel database:
il corso non ha il campo `software` correttamente associato. Verifica nell'admin
(`/admin/courses`) che il campo "Software" del corso sia impostato correttamente.

Se stai aggiungendo un nuovo software non ancora in `brands.ts`, aggiungilo:
**File:** `apps/web/src/lib/brands.ts`
```ts
nuovoSoftware: {
  key: 'nuovoSoftware',
  name: 'NomeSoftware',
  tagline: 'Descrizione breve',
  color: '#RRGGBB',
  light: '#RRGGBB',
  border: '#RRGGBB',
},
```

---

#### Problema risolto — Separatore visivo tra durata e numero unità

**Fix applicato** in `page.tsx`:
```tsx
<div className={styles.teaserFoot}>
  {c.duration && <span>{c.duration}</span>}
  {c.duration && c.units?.length > 0 && (
    <span className={styles.teaserSep}>·</span>  {/* ← AGGIUNTO */}
  )}
  {c.units?.length > 0 && <span>{c.units.length} unità</span>}
</div>
```

La classe `.teaserSep` in `page.module.css`:
```css
.teaserSep {
  color: rgba(255,255,255,0.15);
  font-size: 14px;
  line-height: 1;
  flex-shrink: 0;
}
```

Per cambiare il separatore (es. da `·` a `/` o `|`), modifica solo il carattere nel JSX.

---

#### Selezione manuale dei corsi in evidenza

La logica di selezione è controllata dalla costante `FEATURED_SLUGS` in cima a `page.tsx`:

```ts
// Lascia vuoto per mostrare automaticamente i primi 3 corsi:
const FEATURED_SLUGS: string[] = []

// Oppure specifica gli slug nell'ordine desiderato:
const FEATURED_SLUGS = [
  'engview-3d',
  'sysform-introduzione',
  'projecto-primi-passi',
]
```

I corsi vengono cercati per slug nell'array restituito dall'API. Se uno slug non corrisponde
a nessun corso esistente, viene semplicemente ignorato.

**Come trovare lo slug di un corso:**
- Vai su `/admin/courses`
- Lo slug è il campo "Slug" di ogni corso, oppure si vede nell'URL della pagina corso: `/courses/[slug]`

---

## Schema visivo della pagina

```
┌─────────────────────────────────────────────────────┐
│  HERO (sfondo scuro)                                │
│  Titolo principale + CTA                            │
│  ┌──────────┬──────────┬──────────┐                 │
│  │  N+ corsi│N+ unità  │  Nh+ ore │  ← heroStats   │
│  └──────────┴──────────┴──────────┘                 │
├─────────────────────────────────────────────────────┤
│  FAMIGLIE SOFTWARE (sfondo bianco)                  │
│  EngView | Sysform | ProjectO | ServiformA          │
├─────────────────────────────────────────────────────┤
│  COSA TROVI (sfondo grigio/scuro)                   │
│  ┌──────────┬──────────┬──────────┐                 │
│  │ [TAG]    │ [TAG]    │ [TAG]    │  ← teaserCard  │
│  │ Titolo   │ Titolo   │ Titolo   │                 │
│  │ Desc...  │ Desc...  │ Desc...  │                 │
│  │ 2h · 8u  │ 1h · 5u  │ 3h · 11u │  ← teaserFoot │
│  └──────────┴──────────┴──────────┘                 │
├─────────────────────────────────────────────────────┤
│  COME FUNZIONA (sfondo bianco)                      │
│  01 Esplora | 02 Studia | 03 Certifica              │
├─────────────────────────────────────────────────────┤
│  CTA FINALE (sfondo quasi-nero)                     │
│  Accedi ora → | Esplora il catalogo                 │
└─────────────────────────────────────────────────────┘
```

---

## Dove intervenire per ogni tipo di cambiamento

| Cosa modificare | File | Cosa cercare |
|---|---|---|
| Testo/CTA hero | `page.tsx` | sezione `/* ── HERO */` |
| Statistiche hero (valori) | `page.tsx` | array con `stats.courses`, `stats.units`, `stats.hours` |
| Statistiche hero (spaziatura) | `page.module.css` | `.heroStat`, `.heroStatN`, `.heroStatL` |
| Tag software dei corsi | `page.tsx` + `lib/brands.ts` | costante `softwareSlug` + oggetto `SOFTWARE_BRANDS` |
| Corsi mostrati nel teaser | `page.tsx` | costante `FEATURED_SLUGS` in cima al file |
| Separatore durata/unità | `page.tsx` + `page.module.css` | `teaserSep` |
| Ordine sezioni homepage | `page.tsx` | ordine dei blocchi `<section>` nel JSX |
| Colori sfondo sezioni | `page.module.css` | `.section`, `.sectionDark`, `.sectionCta` |
| Card famiglie software | `page.tsx` | sezione `/* ── FAMIGLIE SOFTWARE */` |
| Voci "Come funziona" | `page.tsx` | array inline nella sezione steps |
