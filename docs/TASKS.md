# Task di sviluppo — Serviform Academy

> Documento aggiornato manualmente man mano che i task vengono implementati.
> Stato: `[ ]` = da fare · `[~]` = in corso · `[x]` = completato

---

## TASK-01 — Rimuovere i filtri software a livello di azienda

**Priorità:** Alta  
**Stato:** `[x]` — completato 2026-05-12

### Contesto

Attualmente ogni `Company` ha un campo `visibleSoftwareIds: String[]` (e la tabella relazionale `CompanyInterest`) che limita quali corsi un'azienda può vedere nel portale. Quando almeno un software è selezionato, `CoursesService.findVisibleForUser()` filtra i corsi restituendo solo quelli appartenenti ai software selezionati.

Questa feature è stata ritenuta inutile e fonte di confusione: l'assegnazione corsi avviene già tramite `CompanyCourseAssignment` (vedi TASK-02), che è il meccanismo canonico di controllo accessi. Il filtro software è ridondante e rischia di oscurare corsi assegnati.

### Obiettivo

Eliminare completamente la logica di filtro software per le aziende. Tutte le aziende devono vedere tutti i corsi pubblicati nel portale (il controllo accessi rimane gestito dalle assegnazioni).

### File coinvolti

#### Backend

| File | Intervento |
|---|---|
| `apps/api/src/courses/courses.service.ts` | Rimuovere la branch di filtro in `findVisibleForUser()` — il metodo deve sempre chiamare `findAll()` indipendentemente dalla membership |
| `apps/api/src/companies/companies.service.ts` | Rimuovere il metodo `syncInterests()`, rimuovere `setVisibleSoftware()`, rimuovere il blocco `if (Array.isArray(data.softwareIds))` da `update()`, rimuovere la gestione `softwareIds` da `create()` |
| `apps/api/prisma/schema.prisma` | Rimuovere il campo `visibleSoftwareIds String[]` da `Company` e il modello `CompanyInterest` (+ generare e applicare migrazione) |

> **Nota migrazione:** prima di rimuovere `CompanyInterest` dallo schema, verificare che la tabella sia vuota in produzione (o che non ci siano righe rilevanti). Il campo `visibleSoftwareIds` può essere svuotato con una migration `UPDATE company SET "visibleSoftwareIds" = ARRAY[]::text[]` prima del drop.

#### Frontend

| File | Intervento |
|---|---|
| `apps/web/src/app/admin/companies/page.tsx` | **Nel modal modifica/creazione:** rimuovere il blocco JSX "Software visibili nel portale" (righe ~243-276) e la funzione `toggleSoftware`, lo state `softwareList`, la chiamata `api.software.findAll()` nell'`useEffect` |
| `apps/web/src/app/admin/companies/page.tsx` | **Nella tabella:** rimuovere la colonna "Portale" (header + cella con logica `visibleSoftwareIds`) |

### Acceptance criteria

- [ ] Un utente appartenente a qualsiasi azienda vede tutti i corsi con `publishState = PUBLISHED`
- [ ] Il modal di modifica azienda non contiene più il selettore software
- [ ] La tabella aziende non mostra più la colonna "Portale"
- [ ] Nessuna chiamata a `CompanyInterest` nel backend
- [ ] Migrazione Prisma applicata senza errori

---

## TASK-02 — Assegnazione bulk di corsi per azienda

**Priorità:** Alta  
**Stato:** `[x]` — completato 2026-05-12

### Contesto

L'attuale flusso di assegnazione corsi (`/admin/assignments`) è uno-alla-volta: si seleziona un'azienda, si apre il modal, si sceglie un singolo corso da una `<select>` e si salva. Se si devono assegnare 20 corsi a una nuova azienda, l'operazione diventa insostenibile.

Il problema peggiora al crescere del catalogo: il `<select>` diventa una lista di 80-100 voci non filtrata, difficile da navigare.

### Obiettivo

Sostituire il modal di assegnazione singola con un pannello di selezione multipla **filtrato per software (categoria)**. L'admin deve poter:

1. Scegliere un'azienda dalla sidebar
2. Aprire il pannello "Assegna corsi"
3. Filtrare i corsi per software (es. "EngView") cliccando su un tab/chip
4. Selezionare tutti i corsi desiderati tramite checkbox (con "Seleziona tutti" per la categoria)
5. Scegliere il tipo di accesso (`ACTIVE` / `LOCKED` / `HIDDEN`) e l'eventuale scadenza — impostazioni applicate a tutti i corsi selezionati
6. Confermare: tutti i corsi selezionati vengono assegnati in un'unica operazione

I corsi già assegnati all'azienda devono essere esclusi dalla lista (o marcati come già assegnati e non selezionabili).

---

### 2a — Backend: endpoint bulk

**File:** `apps/api/src/assignments/assignments.controller.ts`

Aggiungere il route:

```typescript
@Post('company/:cid/bulk')
bulkAssignToCompany(
  @Param('cid') cid: string,
  @Body() body: { courseIds: string[]; accessType?: string; startsAt?: string; expiresAt?: string; notes?: string },
  @Request() req: any
) {
  return this.svc.bulkAssignToCompany(cid, body, req.user.id)
}
```

**File:** `apps/api/src/assignments/assignments.service.ts`

Aggiungere il metodo:

Il payload accetta `courses: Array<{ courseId: string; expiresAt?: string }>` con `accessType` condiviso, in modo che ogni corso abbia la propria scadenza opzionale.

```typescript
async bulkAssignToCompany(companyId: string, data: any, createdBy: string) {
  const courses: Array<{ courseId: string; expiresAt?: string }> = data.courses || []
  if (!courses.length) return { created: 0 }

  const records = courses.map(({ courseId, expiresAt }) => ({
    companyId,
    courseId,
    accessType: data.accessType ?? 'ACTIVE',
    startsAt: new Date(),
    expiresAt: expiresAt ? new Date(expiresAt) : null,
    notes: data.notes ?? null,
    createdBy,
  }))

  const result = await this.prisma.companyCourseAssignment.createMany({
    data: records,
    skipDuplicates: true,  // ignora corsi già assegnati
  })
  return { created: result.count }
}
```

**File:** `apps/web/src/lib/api.ts`

Aggiungere al namespace `assignments`:

```typescript
bulkAssignToCompany: (companyId: string, body: object) =>
  post(`/assignments/company/${companyId}/bulk`, body),
```

---

### 2b — Frontend: nuovo UX di assegnazione

**File:** `apps/web/src/app/admin/assignments/page.tsx`

#### Layout generale

Mantenere la sidebar con l'elenco delle aziende. Quando un'azienda è selezionata, il pannello destro mostra:
- Tabella delle assegnazioni esistenti (invariata)
- Pulsante **"+ Assegna corsi"** che apre il nuovo modal bulk (sostituisce il vecchio)

#### Modal bulk — struttura

```
┌──────────────────────────────────────────────────────────────────┐
│  Assegna corsi a {NomeAzienda}                        [×]        │
├──────────────────────────────────────────────────────────────────┤
│  Filtra per categoria:                                            │
│  [Tutti]  [EngView]  [Sysform]  [ProjectO]  [...]                │
├──────────────────────────────────────────────────────────────────┤
│  Tipo accesso: [ACTIVE ▼]                                        │
├──────────────────────────────────────────────────────────────────┤
│  ☐  Seleziona tutti ({N} disponibili)              Scadenza      │
│  ──────────────────────────────────────────────────────────────  │
│  ☑  Corso A          EngView  ●●○○○               [gg/mm/aaaa]  │
│  ☐  Corso B          EngView  ●●●○○               [          ]  │
│  ☑  Corso C          EngView  ●○○○○               [31/12/2026]  │
│  ...                                                             │
├──────────────────────────────────────────────────────────────────┤
│  [Annulla]                   [Assegna 2 corsi selezionati]       │
└──────────────────────────────────────────────────────────────────┘
```

#### Dettagli implementativi

**Filtro categoria (tab/chip bar)**
- Recuperare la lista categorie da `api.software.findAll()` una sola volta all'apertura della pagina
- Il tab "Tutti" è selezionato di default
- I corsi già assegnati all'azienda selezionata sono esclusi dalla lista (già filtrati lato client tramite `assigned = new Set(asgn.map(a => a.courseId))`)
- Il filtro categoria agisce solo sulla visualizzazione (client-side, nessuna chiamata extra)

**Impostazioni accesso (header del modal)**
- `accessType`: select con `ACTIVE` / `LOCKED` / `HIDDEN` — valore unico applicato a tutti i corsi selezionati

**Checkbox list**
- Ogni riga mostra: checkbox · titolo corso · badge categoria (colorato) · livello · date picker scadenza
- La checkbox "Seleziona tutti" seleziona tutti i corsi visibili nel tab attivo (non quelli di altri tab)
- Il date picker per la scadenza è presente in ogni riga, indipendentemente dalla selezione (si può compilare prima o dopo aver selezionato)
- Il campo scadenza è opzionale (vuoto = ∞); ogni corso può avere una data diversa
- Il date picker è visivamente dimmed (opacity ridotta) se la riga non è selezionata, per indicare che il valore non verrà inviato
- Lo stato selezione è `Map<string, string>` dove chiave = courseId e valore = expiresAt (stringa ISO o '')

**Conferma**
- Il bottone "Assegna" è disabilitato se nessun corso è selezionato
- Label dinamica: "Assegna 1 corso" / "Assegna 5 corsi"
- Dopo il salvataggio: chiude il modal, ricarica `asgn` con `api.assignments.findByCompany(sel.id)`
- In caso di errore: mostra il messaggio d'errore inline nel modal

#### State da aggiungere al componente

```typescript
const [showBulk, setShowBulk] = useState(false)
const [softwareList, setSoftwareList] = useState<any[]>([])
const [bulkTab, setBulkTab] = useState<string>('all')       // 'all' | softwareId
// Map courseId → expiresAt (stringa 'YYYY-MM-DD' o '' per ∞)
// Se courseId è nella Map = selezionato; se assente = non selezionato
const [bulkSel, setBulkSel] = useState<Map<string, string>>(new Map())
const [bulkAccessType, setBulkAccessType] = useState('ACTIVE')
```

#### Funzioni principali

```typescript
const openBulk = () => {
  setBulkSel(new Map())
  setBulkTab('all')
  setBulkAccessType('ACTIVE')
  setShowBulk(true)
}

const visibleCourses = available.filter(c =>
  bulkTab === 'all' || c.softwareId === bulkTab
)

// Seleziona/deseleziona un corso mantenendo la sua expiresAt se già impostata
const toggleBulkCourse = (id: string) => {
  const next = new Map(bulkSel)
  next.has(id) ? next.delete(id) : next.set(id, '')
  setBulkSel(next)
}

// Imposta la scadenza per un singolo corso (anche se non ancora selezionato)
const setBulkExpiry = (id: string, value: string) => {
  const next = new Map(bulkSel)
  if (next.has(id)) next.set(id, value)
  // Se non selezionato, ignora (il campo è dimmed e il valore non conta)
  setBulkSel(next)
}

const toggleSelectAll = () => {
  const ids = visibleCourses.map(c => c.id)
  const allSelected = ids.every(id => bulkSel.has(id))
  const next = new Map(bulkSel)
  if (allSelected) {
    ids.forEach(id => next.delete(id))
  } else {
    // Aggiunge solo quelli non ancora presenti, preservando le expiresAt già impostate
    ids.forEach(id => { if (!next.has(id)) next.set(id, '') })
  }
  setBulkSel(next)
}

const bulkAssign = async () => {
  if (!sel || !bulkSel.size) return
  setSaving(true)
  try {
    const courses = [...bulkSel.entries()].map(([courseId, expiresAt]) => ({
      courseId,
      expiresAt: expiresAt || null,
    }))
    await api.assignments.bulkAssignToCompany(sel.id, {
      courses,
      accessType: bulkAccessType,
    })
    setShowBulk(false)
    setAsgn(await api.assignments.findByCompany(sel.id))
  } catch (e: any) {
    setMsg({ t: e.message, ok: false })
  } finally {
    setSaving(false)
  }
}
```

#### Rendering della riga corso

```tsx
{visibleCourses.map(c => {
  const selected = bulkSel.has(c.id)
  const expiry = bulkSel.get(c.id) ?? ''
  return (
    <tr key={c.id} style={{ opacity: selected ? 1 : 0.6 }}>
      <td>
        <input type="checkbox" checked={selected} onChange={() => toggleBulkCourse(c.id)} />
      </td>
      <td>{c.title}</td>
      <td><span style={{ color: c.software?.color }}>{c.software?.name}</span></td>  {/* "software" = categoria */}
      <td>{c.level || '—'}</td>
      <td>
        <input
          type="date"
          value={expiry}
          disabled={!selected}
          style={{ opacity: selected ? 1 : 0.35 }}
          onChange={e => setBulkExpiry(c.id, e.target.value)}
        />
      </td>
    </tr>
  )
})}
```

### Acceptance criteria

- [ ] Endpoint `POST /assignments/company/:cid/bulk` disponibile e testato; accetta `courses: [{courseId, expiresAt?}]`
- [ ] Il modal mostra solo i corsi non ancora assegnati all'azienda selezionata
- [ ] Il filtro per software funziona (cambia la lista visibile, non deseleziona corsi già flaggati in altri tab)
- [ ] "Seleziona tutti" agisce solo sui corsi del tab attivo, preservando le expiresAt già impostate
- [ ] Ogni riga ha il proprio date picker per la scadenza, disabilitato se la riga non è selezionata
- [ ] Il bottone di conferma mostra il conteggio dinamico dei corsi selezionati
- [ ] Le assegnazioni già esistenti vengono rispettate (`skipDuplicates` lato backend)
- [ ] Il vecchio modal di assegnazione singola è rimosso o sostituito

---

## TASK-03 — Rinominare "Software" → "Categoria" in tutta l'UI

**Priorità:** Media  
**Stato:** `[x]` — completato 2026-05-12

### Contesto

Il termine "Software" è usato come etichetta visibile agli utenti in tutto il portale (menu admin, colonne di tabella, filtri, pagine pubbliche). Il termine corretto da esporre in UI è **"Categoria"** (o "Categorie" al plurale). I nomi dei campi nel DB (`softwareId`, `software`, ecc.) e le chiavi API (`api.software.*`) **non vanno modificati** — solo le label testuali visibili.

### File coinvolti e interventi

#### Admin — navigazione e pagine

| File | Riga | Testo attuale | Testo nuovo |
|---|---|---|---|
| `apps/web/src/app/admin/layout.tsx` | 16 | `label: 'Software'` | `label: 'Categorie'` |
| `apps/web/src/app/admin/software/page.tsx` | 8 | `title="Software"` (prop di `AdminCrud`) | `title="Categorie"` |
| `apps/web/src/app/admin/courses/page.tsx` | 56 | `label: 'Software'` (colonna tabella) | `label: 'Categoria'` |
| `apps/web/src/app/admin/courses/page.tsx` | 92 | `label: 'Software'` (campo form) | `label: 'Categoria'` |
| `apps/web/src/app/admin/assignments/page.tsx` | 81 | `<th>Software</th>` (intestazione colonna) | `<th>Categoria</th>` |

#### Portale pubblico e pagine utente

| File | Riga | Testo attuale | Testo nuovo |
|---|---|---|---|
| `apps/web/src/app/page.tsx` | 85 | `'I software'` (section tag) | `'Le categorie'` |
| `apps/web/src/app/page.tsx` | 162 | `'per software o livello'` | `'per categoria o livello'` |
| `apps/web/src/app/why/page.tsx` | 31 | `label: 'Software'` (stat card) | `label: 'Categorie'` |
| `apps/web/src/app/why/page.tsx` | 47 | `'Scegli il software'` (step titolo) | `'Scegli la categoria'` |
| `apps/web/src/app/why/page.tsx` | 50 | `'sul software'` | `'sulla categoria'` |
| `apps/web/src/app/auth/login/page.tsx` | 59 | `label: 'software'` (stat login) | `label: 'categorie'` |
| `apps/web/src/app/dashboard/page.tsx` | 287 | `'per i software Serviform'` | `'per le categorie Serviform'` |
| `apps/web/src/app/catalog/CatalogClient.tsx` | 111 | commento `{/* Filtro software */}` | `{/* Filtro categoria */}` |

> **Non modificare:** nomi di variabili interni (`softwareId`, `softwareList`, `softwareFilter`, `softwares`, `api.software.*`, `c.software`, ecc.) — sono identificatori di codice e campi DB, non label UI.

> **Nota:** la rotta `/admin/software` può restare invariata (URL interni non visibili all'utente finale). Se si vuole allinearla si può fare in un secondo momento come task separato (richiede aggiornamento del link in `layout.tsx` e del redirect).

### Acceptance criteria

- [ ] Il menu admin mostra "Categorie" al posto di "Software"
- [ ] La pagina `/admin/software` mostra il titolo "Categorie"
- [ ] Le colonne e i form corsi mostrano "Categoria"
- [ ] Le pagine pubbliche (home, why, login, dashboard, catalogo) usano "categoria/categorie"
- [ ] Nessuna variabile interna o chiave API è stata rinominata

---

## Note di sviluppo

- I due task sono **indipendenti** ma TASK-01 è propedeutico a TASK-02 concettualmente: una volta rimosso il filtro software, l'assegnazione corsi diventa l'unico meccanismo di controllo accessi e quindi va resa praticabile.
- L'ordine consigliato è TASK-01 → TASK-02.
- Nessuna modifica al modello `CompanyCourseAssignment` è necessaria per TASK-02: i campi esistenti (`accessType`, `startsAt`, `expiresAt`, `notes`) coprono già il caso d'uso.

---

## TASK-04 — Rimozione campi dall'anagrafica azienda

**Priorità:** Media  
**Stato:** `[x]` — completato 2026-05-13

### Contesto

Il modello `Company` espone due campi non più necessari nella gestione operativa del portale: `contractType` (tipo contratto) e `assistanceExpiresAt` (scadenza assistenza). La loro presenza nel form e nella tabella admin genera confusione e non porta valore al flusso attuale. Prima della rimozione è necessario verificare eventuali dipendenze applicative o reportistiche.

### Obiettivo

Eliminare completamente `contractType` e `assistanceExpiresAt` dallo schema Prisma e da tutta l'interfaccia admin (tabella e modal).

### File coinvolti

#### Schema e backend

| File | Intervento |
|---|---|
| `apps/api/prisma/schema.prisma` | Rimuovere i campi `contractType String?` (riga 40) e `assistanceExpiresAt DateTime?` (riga 41) dal modello `Company`. Generare e applicare la migrazione. |
| `apps/api/src/companies/companies.service.ts` | Nella funzione `pickCompanyScalars()` rimuovere la riga `if (input.contractType !== undefined) out.contractType = input.contractType`. Nel metodo `create()`, rimuovere il campo `assistanceExpiresAt` dalla chiamata `prisma.company.create()`. Nel metodo `update()`, rimuovere l'intero blocco `const assistanceExpiresAt = ...` e la relativa spread nell'update. |

#### Frontend

| File | Intervento |
|---|---|
| `apps/web/src/app/admin/companies/page.tsx` | **Tabella:** rimuovere le colonne "Contratto" (`<th>Contratto</th>` + la `<td>` con `r.contractType`) e "Scadenza assist." (`<th>Scadenza assist.</th>` + la `<td>` con la logica `expiry`/`isExpired`). Aggiornare `colSpan` da 6 a 4. |
| `apps/web/src/app/admin/companies/page.tsx` | **Modal:** rimuovere la `<label>` "Tipo contratto" con la `<select>` relativa (righe ~175-185) e la `<label>` "Scadenza assistenza" con l'`<input type="date">` relativo (righe ~187-193). |
| `apps/web/src/app/admin/companies/page.tsx` | **State openEdit:** rimuovere la riga `assistanceExpiresAt: r.assistanceExpiresAt?.slice(0, 10) || ''` dalla funzione `openEdit()`. |

### Acceptance criteria

- [ ] I campi `contractType` e `assistanceExpiresAt` non esistono più nello schema Prisma
- [ ] La migrazione è applicata senza errori
- [ ] Il modal di creazione/modifica azienda non contiene più i due campi
- [ ] La tabella aziende non mostra più le colonne "Contratto" e "Scadenza assist."
- [ ] Nessun riferimento residuo nei file backend o frontend

---

## TASK-05 — Gestione certificazioni e badge (upload SVG su corso)

**Priorità:** Media  
**Stato:** `[x]` — completato 2026-05-13

### Contesto

Il sistema di certificazione è già funzionante: quando un utente completa tutte le unità non-OVERVIEW di un corso con `issuesBadge = true`, il backend emette automaticamente un `Certificate`. Tuttavia non esiste ancora un meccanismo per associare un'immagine SVG (badge) al corso. L'admin deve poter caricare direttamente un file SVG durante la creazione o modifica del corso; una volta salvato, il badge compare automaticamente nel certificato dell'utente senza ulteriori configurazioni manuali.

### Obiettivo

1. Aggiungere un campo `badgeUrl String?` al modello `Course` per ospitare il path del file SVG caricato
2. Creare un endpoint di upload file nel backend (multipart/form-data)
3. Nel form admin corsi, sostituire il campo testo con un file picker che invia l'SVG al backend e salva l'URL restituito
4. Visualizzare il badge nella pagina profilo certificati dell'utente

### File coinvolti

#### Schema e backend

| File | Intervento |
|---|---|
| `apps/api/prisma/schema.prisma` | Aggiungere `badgeUrl String?` al modello `Course` (dopo `thumbnailUrl`). Generare e applicare la migrazione. |
| `apps/api/src/courses/courses.service.ts` | Verificare che `badgeUrl` sia incluso tra i campi scalari gestiti in `create()` e `update()`. |
| `apps/api/src/uploads/` *(nuovo modulo)* | Creare un modulo NestJS `UploadsModule` con un `UploadsController` che espone `POST /uploads/badge` (multipart, campo `file`, accetta solo `image/svg+xml`). Il file viene salvato nella directory `public/badges/` (o equivalente servita staticamente). Restituisce `{ url: '/badges/<filename>' }`. Usare `@nestjs/platform-express` con `multer` (già disponibile con NestJS). Il filename deve essere randomizzato (es. UUID + `.svg`) per evitare collisioni. |

#### Frontend — Admin corsi

**File:** `apps/web/src/app/admin/courses/page.tsx`

Il componente `AdminCrud` usa `formFields` con tipi standard (`text`, `textarea`, `select`). Per l'upload del badge serve un campo personalizzato. Due opzioni in ordine di preferenza:

1. **Estendere `AdminCrud`** per supportare `type: 'file-upload'` con callback `onUpload` — il componente mostra un `<input type="file" accept=".svg,image/svg+xml">`, all'onChange chiama `onUpload(file)` che fa la POST a `/uploads/badge` e aggiorna il campo `badgeUrl` nel form state.

2. **Fallback URL**: se l'estensione è complessa, aggiungere temporaneamente un campo `text` con label "Badge SVG (URL del file caricato)" e gestire l'upload separatamente — ma questa opzione va sostituita appena possibile.

Dopo l'upload mostrare una preview inline dell'SVG (`<img src={badgeUrl} style={{ width: 48, height: 48 }}>`) accanto al file picker.

#### Frontend — Profilo certificati

**File:** `apps/web/src/app/profile/certificates/page.tsx`

Nel rendering di ogni certificato, aggiungere la visualizzazione del badge: se `cert.course?.badgeUrl` è presente mostrare `<img src={badgeUrl} alt="badge" style={{ width: 64, height: 64 }} />` in una posizione prominente nella card certificato (es. in alto a destra o centrato sopra il titolo).

### Acceptance criteria

- [ ] Il campo `badgeUrl` è presente nel modello `Course` e la migrazione è applicata
- [ ] L'endpoint `POST /uploads/badge` accetta un file SVG e restituisce l'URL del file salvato
- [ ] Solo file `image/svg+xml` sono accettati (validazione lato backend)
- [ ] Nel form admin corsi è presente un file picker per l'upload del badge SVG con preview
- [ ] La pagina profilo certificati mostra il badge SVG se presente sul corso, nessun elemento visivo se assente
- [ ] Il badge compare automaticamente al completamento del corso, senza operazioni manuali aggiuntive

---

## TASK-06 — Integrazione eventi nella Newsroom (rimozione pagina eventi separata)

**Priorità:** Alta  
**Stato:** `[x]` — completato 2026-05-13

### Contesto

Gli eventi e webinar sono attualmente gestiti in due posti separati: una pagina dedicata `/events` e una sezione calendario laterale nella Newsroom. Questa frammentazione è ridondante e poco intuitiva. L'obiettivo è unificare tutto nella Newsroom, usando lo stesso layout a card già in uso per le comunicazioni.

Il pulsante KPI "Webinar e eventi" nella Newsroom attualmente esegue `router.push('/calendar')`. Dovrà invece filtrare inline la vista della Newsroom mostrando solo gli eventi futuri come card.

### Obiettivo

1. Aggiungere gli eventi futuri come card nella Newsroom, coesistenti con le comunicazioni
2. Rimuovere il calendario laterale dalla Newsroom
3. Il pulsante "Webinar e eventi" mostra inline solo eventi futuri (come card)
4. Deprecare o rimuovere la pagina separata `/events`

### File coinvolti

#### Newsroom — refactoring principale

**File:** `apps/web/src/app/newsroom/page.tsx`

- **Rimuovere** il componente `MiniCalendar` e tutta la sezione `<div className={styles.calSection}>` (righe ~416-484), compresi gli state `calYear`, `calMonth`, `selectedDay`, `eventDays`, le funzioni `prevMonth()`, `nextMonth()` e il memo `eventDays`
- **Rimuovere** il memo `upcomingEvents` (attuale logica "max 6 futuri")
- **Aggiungere** la logica per mostrare eventi futuri come card nella lista principale: filtrare `events` con `date >= now`, ordinarli cronologicamente, e renderizzarli tramite un componente `EventCard` con la stessa struttura di `AnnCard`
- **Modificare** il filtro KPI "Webinar e eventi": invece di `router.push('/calendar')`, impostare un nuovo stato `filter = 'EVENTS'` che filtra la lista mostrando solo card di tipo evento

#### Struttura card evento

Le card evento devono essere visivamente coerenti con `AnnCard` e includere:
- Badge tipo (es. "Webinar", "Workshop", "Sessione live") con colore `#059669`
- Data evento formattata
- Immagine/banner (campo `bannerUrl` da aggiungere al modello `Event`, oppure placeholder)
- Titolo e descrizione breve (troncata a ~120 caratteri)
- Pulsante "Iscriviti →" (link a `registrationUrl` se presente, altrimenti nascosto) o "Accedi →" se l'evento ha `recordingUrl`

#### Schema e backend (opzionale ma consigliato)

| File | Intervento |
|---|---|
| `apps/api/prisma/schema.prisma` | Aggiungere `bannerUrl String?` al modello `Event` per uniformarlo con `Announcement`. Generare e applicare la migrazione. |
| `apps/api/src/events/events.service.ts` | Includere `bannerUrl` nei metodi `create()` e `update()`. |
| `apps/web/src/app/admin/events/page.tsx` | Aggiungere al `formFields` il campo `bannerUrl` (URL immagine/banner). |

#### Rimozione pagine separate

| File | Intervento |
|---|---|
| `apps/web/src/app/events/page.tsx` | **Eliminare** il file e la directory `events/`. |
| `apps/web/src/app/events/EventsPage.module.css` | **Eliminare** il file CSS associato. |
| `apps/web/src/app/calendar/page.tsx` | **Eliminare** il file e la directory `calendar/`. |
| `apps/web/src/app/calendar/Calendar.module.css` | **Eliminare** il file CSS associato. |
| `apps/web/src/app/newsroom/page.tsx` | Rimuovere il link `<Link href="/calendar" className={styles.allEventsLink}>Tutti gli eventi →</Link>` (riga ~480). Se si vuole un link allo storico, puntare a `/newsroom` con filtro eventi attivo. |
| Navigazione principale / layout | Verificare che nessun menu o link nel layout generale punti a `/events` o `/calendar` e aggiornare eventuali riferimenti verso `/newsroom`. |

### Acceptance criteria

- [ ] La Newsroom mostra eventi futuri come card coesistenti con le comunicazioni
- [ ] Il calendario laterale non è più presente nella Newsroom
- [ ] Il pulsante KPI "Webinar e eventi" filtra inline la lista mostrando solo eventi futuri (non naviga più)
- [ ] Le card evento contengono: tipo, data, banner/placeholder, titolo, descrizione breve, pulsante azione
- [ ] Le pagine `/events` e `/calendar` sono eliminate
- [ ] Nessun link rotto nel portale (nessun riferimento a `/events` o `/calendar`)

---

## TASK-06-BIS — Fix classificazione tipo contenuto e revisione campo "Sezione"

**Priorità:** Alta  
**Stato:** `[x]` — completato 2026-05-14

### Contesto

A seguito di TASK-06, la creazione di una comunicazione dalla card "Comunicazioni & Eventi" non classifica correttamente il tipo di contenuto. Il problema ha due radici:

1. Il dropdown "Sezione" nel form admin (`apps/web/src/app/admin/announcements/page.tsx`) espone i valori `NEWS | EVENTS | PRESS | RULES` — nessuno di questi corrisponde a "Webinar" o "Workshop", quindi un amministratore che vuole creare un webinar non ha l'opzione corretta.

2. Il KPI "Webinar e eventi" nella Newsroom (`apps/web/src/app/newsroom/page.tsx`) conta esclusivamente i record del modello `Event` (via `events.filter(e => new Date(e.date) >= new Date()).length`). Gli `Announcement` con `section = 'EVENTS'` non vengono mai conteggiati → il contatore rimane a zero → il pulsante filtro appare inattivo.

### Obiettivo

1. Aggiornare i valori del campo `section` degli `Announcement` per includere le tipologie corrette
2. Aggiornare il KPI e il filtro "Webinar e eventi" in Newsroom affinché includa anche gli `Announcement` con sezione di tipo evento

### Interventi

#### Backend — Schema e service

| File | Intervento |
|---|---|
| `apps/api/prisma/schema.prisma` | Nel modello `Announcement`, il campo `section String @default("COMUNICAZIONE")` rimane String (i valori ammessi cambiano). Aggiornare anche il default. La migrazione deve includere un `UPDATE` per rimappare i vecchi valori: `NEWS` → `COMUNICAZIONE`, `EVENTS` → `EVENTO`, `PRESS` → `COMUNICAZIONE`, `RULES` → `COMUNICAZIONE`. Nessun fallback da mantenere: i vecchi valori vengono sostituiti. |
| `apps/api/src/announcements/announcements.service.ts` | Nel metodo `findPublished(section?, userId?)`, verificare che il filtro `section` funzioni esattamente con i nuovi valori. Aggiungere una costante/array `EVENT_SECTIONS = ['WEBINAR', 'WORKSHOP', 'EVENTO']` da usare come lista canonica nei filtri. |

#### Frontend — Admin form

**File:** `apps/web/src/app/admin/announcements/page.tsx`

Aggiornare la costante `ANN_SECTIONS` (riga ~9) con i nuovi valori:

```typescript
const ANN_SECTIONS = [
  { v: 'COMUNICAZIONE', l: 'Comunicazione' },
  { v: 'WEBINAR',       l: 'Webinar'       },
  { v: 'WORKSHOP',      l: 'Workshop'      },
  { v: 'EVENTO',        l: 'Evento'        },
]
```

> **Nota:** i valori precedenti `NEWS`, `EVENTS`, `PRESS`, `RULES` vengono sostituiti dalla migrazione — nessun fallback necessario nel rendering.

#### Frontend — Newsroom

**File:** `apps/web/src/app/newsroom/page.tsx`

- **KPI "Webinar e eventi"**: il contatore deve sommare `events.filter(e => new Date(e.date) >= now).length` **+** `announcements.filter(a => EVENT_SECTIONS.includes(a.section) && new Date(a.publishedAt) >= ...` (oppure: announcements con section IN ['WEBINAR','WORKSHOP','EVENTO'])
- **Filtro `filter === 'EVENTS'`**: la variabile `filteredItems` deve includere anche gli `Announcement` con `section` in `['WEBINAR', 'WORKSHOP', 'EVENTO']`, mescolati agli `Event` futuri e ordinati per data
- **Rendering card**: nel loop `filteredItems` aggiungere un branch che mostra `AnnCard` con un badge colorato diverso a seconda della sezione (es. WEBINAR → verde, WORKSHOP → arancio, EVENTO → blu)

### Acceptance criteria

- [ ] Il dropdown "Sezione" mostra: Comunicazione, Webinar, Workshop, Evento
- [ ] Un Announcement creato con sezione "Webinar" è conteggiato nel KPI "Webinar e eventi"
- [ ] Il filtro "Webinar e eventi" nella Newsroom mostra sia gli `Event` futuri che gli `Announcement` con sezione webinar/workshop/evento
- [ ] La migrazione ha rimappato tutti i vecchi valori di `section` ai nuovi (nessun record con NEWS/EVENTS/PRESS/RULES residui)
- [ ] La migrazione Prisma è applicata senza errori

---

## TASK-06-TER — Upload diretto banner/copertina per comunicazioni

**Priorità:** Media  
**Stato:** `[x]` — completato 2026-05-14

### Contesto

Il campo `bannerUrl` nel form admin di una comunicazione (`apps/web/src/app/admin/announcements/page.tsx`) è attualmente un `<input type="text">` dove l'admin deve incollare manualmente un URL. Questo richiede che l'immagine sia già ospitata da qualche parte, rendendo il flusso scomodo.

Il backend ha già un modulo di upload (introdotto in TASK-05 per i badge SVG): `apps/api/src/uploads/`. L'obiettivo è riutilizzarlo o estenderlo per gestire immagini banner (JPEG/PNG/WebP), con dimensione ideale indicata nell'UI.

### Obiettivo

1. Aggiungere o estendere l'endpoint di upload per accettare immagini banner
2. Sostituire il campo testo `bannerUrl` con un file picker che carica l'immagine e salva l'URL restituito
3. Mostrare una preview inline dell'immagine caricata
4. Indicare le dimensioni consigliate direttamente nell'interfaccia

### Interventi

#### Backend — Upload endpoint

**File:** `apps/api/src/uploads/uploads.controller.ts` (o modulo esistente)

Se l'endpoint `POST /uploads/badge` accetta solo `image/svg+xml`, aggiungere un endpoint separato:

```typescript
@Post('banner')
@UseInterceptors(FileInterceptor('file'))
uploadBanner(@UploadedFile() file: Express.Multer.File) {
  // Accetta: image/jpeg, image/png, image/webp
  // Dimensione massima consigliata: 1200×400 px, max 2 MB
  // Salva in public/banners/<uuid>.<ext>
  // Restituisce { url: '/banners/<filename>' }
}
```

Validare lato backend: MIME type deve essere `image/jpeg | image/png | image/webp`. Rifiutare altri tipi con `400 Bad Request`.

**File:** `apps/web/src/lib/api.ts`

Aggiungere nel namespace `uploads` (o crearlo se assente):

```typescript
uploadBanner: (file: File) => {
  const fd = new FormData()
  fd.append('file', file)
  return postForm('/uploads/banner', fd) as Promise<{ url: string }>
},
```

#### Frontend — Admin form comunicazioni

**File:** `apps/web/src/app/admin/announcements/page.tsx`

Sostituire il campo `bannerUrl` (input text) con:

```tsx
<label>
  Banner / Copertina
  <span style={{ fontSize: '0.75rem', color: '#6b7280', marginLeft: 8 }}>
    Dimensione consigliata: 1200×400 px · JPEG, PNG o WebP · max 2 MB
  </span>
  <input
    type="file"
    accept="image/jpeg,image/png,image/webp"
    onChange={async e => {
      const file = e.target.files?.[0]
      if (!file) return
      const { url } = await api.uploads.uploadBanner(file)
      setForm(f => ({ ...f, bannerUrl: url }))
    }}
  />
  {form.bannerUrl && (
    <img
      src={form.bannerUrl}
      alt="Preview banner"
      style={{ marginTop: 8, maxWidth: '100%', maxHeight: 120, objectFit: 'cover', borderRadius: 4 }}
    />
  )}
</label>
```

> Mantenere anche un link "Rimuovi" che imposta `bannerUrl = ''` per permettere la cancellazione della copertina.

### Acceptance criteria

- [ ] L'endpoint `POST /uploads/banner` accetta JPEG, PNG, WebP e rifiuta altri formati con errore esplicito
- [ ] Il form admin mostra un file picker con indicazione delle dimensioni consigliate
- [ ] Dopo il caricamento compare una preview inline dell'immagine
- [ ] L'URL del file salvato viene persistito correttamente nel campo `bannerUrl` dell'`Announcement`
- [ ] È possibile rimuovere il banner impostando `bannerUrl = ''`
- [ ] Nessuna regressione per i record esistenti con `bannerUrl` URL esterno (continuano a funzionare)

---

## TASK-06-QUATER — Revisione form: primo piano datetime + pulsanti Salva/Pubblica

**Priorità:** Alta  
**Stato:** `[x]` — completato 2026-05-14

### Contesto

Il form admin di creazione/modifica comunicazione (`apps/web/src/app/admin/announcements/page.tsx`) presenta tre problemi UX emersi dopo TASK-06:

1. **Campo "Scadenza"** (`expiresAt`, `<input type="date">`): la label è ambigua e non supporta l'orario. Deve diventare "Data e ora di scadenza primo piano" con `<input type="datetime-local">`. La semantica è: se vuoto → comunicazione mai in primo piano; se compilato → appare in primo piano fino a quella data e ora.

2. **Flag "In primo piano"** (`isPinned`): ridondante con la logica data/ora. Da rimuovere dal form e dallo schema.

3. **Checkbox "Pubblica subito"** (`published`): UX incoerente. Deve essere rimossa e sostituita con due azioni esplicite: **Salva** (bozza, non pubblicata) e **Pubblica** (salva e pubblica immediatamente).

> **Coordinamento con TASK-07**: TASK-07 modifica la semantica backend di `expiresAt` (split dashboard/newsroom). Questo task riguarda solo il form admin. I due task possono essere implementati indipendentemente ma dovrebbero essere coordinati nel testing.

### Interventi

#### Backend — Schema

| File | Intervento |
|---|---|
| `apps/api/prisma/schema.prisma` | Rimuovere il campo `isPinned Boolean @default(false)` dal modello `Announcement`. Generare e applicare la migrazione. |
| `apps/api/src/announcements/announcements.service.ts` | Rimuovere ogni riferimento a `isPinned` nei metodi `create()`, `update()`, `findPublished()`. Verificare che `publishedAt` venga impostato a `new Date()` quando si pubblica e a `null` quando si salva come bozza. Se esiste logica `isPinned` nell'ordinamento, sostituirla con ordinamento per `publishedAt desc`. |

#### Backend — Logica pubblicazione

Il metodo `update()` (o `create()`) deve gestire due comportamenti distinti in base a un flag `publish: boolean` nel payload:

```typescript
// Se publish = true: pubblica immediatamente
if (data.publish) {
  updateData.published = true
  updateData.publishedAt = new Date()
}
// Se publish = false (Salva): salva come bozza, non modifica published/publishedAt
```

Aggiornare il DTO/controller per accettare `publish?: boolean` nel body.

**File:** `apps/web/src/lib/api.ts` — nessun intervento necessario se il client già invia tutto il body; verificare solo che `publish` venga propagato.

#### Frontend — Admin form

**File:** `apps/web/src/app/admin/announcements/page.tsx`

**1. Campo primo piano:**

```tsx
// Prima:
<label>Scadenza<input type="date" value={form.expiresAt} .../></label>

// Dopo:
<label>
  Data e ora di scadenza primo piano
  <small style={{ display: 'block', color: '#6b7280' }}>
    Lascia vuoto per non mettere in primo piano.
    Se compilato, la comunicazione appare in primo piano fino a questa data e ora.
  </small>
  <input type="datetime-local" value={form.expiresAt} .../>
</label>
```

Aggiornare `ANN_EMPTY` di conseguenza: `expiresAt: ''`.

**2. Rimozione `isPinned`:**

Rimuovere il campo `isPinned` da `ANN_EMPTY`, dalla `<form>`, e dalla funzione `openEdit()`. Rimuovere il `<label>` relativo.

**3. Pulsanti Salva / Pubblica:**

Rimuovere il checkbox `published` / "Pubblica subito" da form e da `ANN_EMPTY`.

Aggiungere due pulsanti distinti nella barra azioni:

```tsx
{/* Sostituisce il singolo pulsante "Salva" */}
<button type="button" onClick={() => handleSave(false)}>
  Salva bozza
</button>
<button type="button" onClick={() => handleSave(true)} style={{ marginLeft: 8 }}>
  Pubblica
</button>
```

La funzione `handleSave(publish: boolean)` invia il payload con il flag `publish` al backend.

Nella tabella della lista comunicazioni, aggiungere un indicatore visivo di stato: `published = true` → badge "Pubblicata", `published = false` → badge "Bozza".

### Acceptance criteria

- [ ] Il campo "Scadenza" è sostituito da "Data e ora di scadenza primo piano" con `datetime-local`
- [ ] Il checkbox "In primo piano" (`isPinned`) è rimosso dal form e dallo schema
- [ ] Il checkbox "Pubblica subito" è rimosso
- [ ] Sono presenti due pulsanti distinti: "Salva bozza" e "Pubblica"
- [ ] Cliccando "Salva bozza" la comunicazione viene salvata con `published = false`
- [ ] Cliccando "Pubblica" la comunicazione viene salvata con `published = true` e `publishedAt = now()`
- [ ] La migrazione per la rimozione di `isPinned` è applicata senza errori
- [ ] I record esistenti con `isPinned = true` non generano errori dopo la migrazione
- [ ] La lista comunicazioni mostra un badge Bozza/Pubblicata per ogni record

---

## TASK-09 — Pulizia e revisione admin Comunicazioni ed Eventi

**Priorità:** Alta  
**Stato:** `[x]` — completato 2026-05-15

### Contesto

A seguito dell'integrazione eventi nella Newsroom (TASK-06 e successive), il pannello admin presenta due problemi di coerenza:

1. **Admin Comunicazioni**: il dropdown "Sezione" contiene ancora le voci WEBINAR, WORKSHOP, EVENTO (aggiunte in TASK-06-BIS). Queste tipologie appartengono ora esclusivamente alla gestione eventi e devono essere rimosse dalle comunicazioni.

2. **Admin Eventi**: il form contiene campi non più necessari (`registrationUrl`, `recordingUrl`, flag `visibleInNewsroom`) e manca di funzionalità ora standard in tutto il portale (upload banner, campo contenuto HTML/articolo).

### Obiettivo

**Comunicazioni:**
- Rimuovere le sezioni evento (WEBINAR, WORKSHOP, EVENTO) dalla costante `ANN_SECTIONS` — restano solo le sezioni di tipo comunicazione pura (es. `COMUNICAZIONE`)
- Aggiornare eventuale logica frontend che usa queste sezioni come filtro

**Eventi:**
- Rimuovere dal form: `registrationUrl` (URL iscrizione), `recordingUrl` (URL registrazione), flag `visibleInNewsroom`
- Aggiungere al form: upload banner (come per le comunicazioni, riutilizzando `POST /uploads/banner`)
- Aggiungere al form: campo contenuto HTML/articolo (come nelle comunicazioni)
- Mantenere nel form: Titolo, Descrizione, Tipo, Data, Luogo
- Verificare che il campo `Tipo` dell'evento includa i valori migrati (WEBINAR, WORKSHOP, EVENTO, ecc.) ora rimossi dalle comunicazioni

### File coinvolti

#### Backend — Schema eventi

| File | Intervento |
|---|---|
| `apps/api/prisma/schema.prisma` | Nel modello `Event`: rimuovere `registrationUrl String?` e `recordingUrl String?` se presenti. Rimuovere `visibleInNewsroom Boolean @default(false)` se presente. Aggiungere `bannerUrl String?` se non già presente (era previsto in TASK-06). Aggiungere `content String?` per il contenuto HTML. Generare e applicare la migrazione. |
| `apps/api/src/events/events.service.ts` | Allineare i metodi `create()` e `update()`: rimuovere i campi eliminati, aggiungere `bannerUrl` e `content`. |

#### Frontend — Admin Comunicazioni

**File:** `apps/web/src/app/admin/announcements/page.tsx`

Aggiornare la costante `ANN_SECTIONS` rimuovendo le voci evento:

```typescript
// Prima (TASK-06-BIS):
const ANN_SECTIONS = [
  { v: 'COMUNICAZIONE', l: 'Comunicazione' },
  { v: 'WEBINAR',       l: 'Webinar'       },
  { v: 'WORKSHOP',      l: 'Workshop'      },
  { v: 'EVENTO',        l: 'Evento'        },
]

// Dopo:
const ANN_SECTIONS = [
  { v: 'COMUNICAZIONE', l: 'Comunicazione' },
]
```

> **Nota migrazione dati:** gli `Announcement` già creati con sezione WEBINAR/WORKSHOP/EVENTO restano validi nel DB — la rimozione riguarda solo il form di creazione. Valutare se eseguire una migrazione SQL per rimappare i record esistenti su `COMUNICAZIONE` o lasciarli invariati (dipende da quanti record esistono).

Verificare e aggiornare la costante `EVENT_SECTIONS` in `announcements.service.ts` e nel filtro Newsroom: se quella costante veniva usata per identificare gli announcement di tipo evento, il filtro va coordinato con la nuova logica (ora gli eventi-tipo sono solo nel modello `Event`, non in `Announcement`).

#### Frontend — Admin Eventi

**File:** `apps/web/src/app/admin/events/page.tsx`

1. **Rimuovere** i campi `registrationUrl`, `recordingUrl` e il flag `visibleInNewsroom` dal `formFields` e dallo state iniziale.

2. **Aggiungere** il campo upload banner con preview (stesso pattern di TASK-06-TER per le comunicazioni):

```tsx
<label>
  Banner / Copertina
  <span style={{ fontSize: '0.75rem', color: '#6b7280', marginLeft: 8 }}>
    Dimensione consigliata: 1200×400 px · JPEG, PNG o WebP · max 2 MB
  </span>
  <input
    type="file"
    accept="image/jpeg,image/png,image/webp"
    onChange={async e => {
      const file = e.target.files?.[0]
      if (!file) return
      const { url } = await api.uploads.uploadBanner(file)
      setForm(f => ({ ...f, bannerUrl: url }))
    }}
  />
  {form.bannerUrl && (
    <img src={form.bannerUrl} alt="Preview banner"
      style={{ marginTop: 8, maxWidth: '100%', maxHeight: 120, objectFit: 'cover', borderRadius: 4 }} />
  )}
</label>
```

3. **Aggiungere** il campo contenuto HTML/articolo. Usare lo stesso componente editor già presente per le comunicazioni (verificare se si tratta di un `<textarea>` plain o di un rich-text editor — replicare lo stesso approccio per coerenza).

4. **Verificare** che il campo `Tipo` dell'evento abbia valori adeguati (es. `WEBINAR`, `WORKSHOP`, `SESSIONE_LIVE`, `ALTRO`) ora che queste tipologie non sono più gestibili come Announcement.

#### Frontend — Newsroom (coordinamento)

**File:** `apps/web/src/app/newsroom/page.tsx`

Verificare che il filtro `filter === 'EVENTS'` e il KPI "Webinar e eventi" non dipendano più dagli `Announcement` con sezione WEBINAR/WORKSHOP/EVENTO (rimossi). Se sì, aggiornare la logica affinché consideri solo i record del modello `Event`.

### Acceptance criteria

- [ ] Il dropdown "Sezione" nel form comunicazioni contiene solo tipologie di comunicazione (senza WEBINAR/WORKSHOP/EVENTO)
- [ ] Il form admin eventi non contiene più i campi `registrationUrl`, `recordingUrl`, `visibleInNewsroom`
- [ ] Il form admin eventi ha un file picker per il banner con preview inline
- [ ] Il form admin eventi ha un campo per il contenuto HTML/articolo
- [ ] I campi mantenuti negli eventi sono: Titolo, Descrizione, Tipo, Data, Luogo, Banner, Contenuto
- [ ] La migrazione Prisma è applicata senza errori
- [ ] La Newsroom non presenta comportamenti anomali nel filtro eventi a seguito delle modifiche

---

## TASK-10 — Fix bug gestione primo piano (datetime e logica pin)

**Priorità:** Alta  
**Stato:** `[x]` — completato 2026-05-15

### Contesto

La funzionalità "primo piano" — introdotta con TASK-06-QUATER — non funziona correttamente. Sono stati rilevati due problemi distinti:

1. **Bug timezone orario:** il campo `datetime-local` nel form admin salva un orario diverso da quello inserito. Il problema è quasi certamente un disallineamento timezone: il browser produce una stringa locale (es. `2026-05-20T10:00`) che il backend interpreta come UTC, causando uno scarto di 1-2 ore in lettura/scrittura.

2. **Logica primo piano non attiva:** comunicazioni ed eventi vengono inseriti con una data di scadenza primo piano compilata, ma non appaiono effettivamente "in primo piano" nella dashboard o nella Newsroom. La logica che determina se un elemento è "in primo piano" (basata su `expiresAt`) probabilmente non viene applicata nel rendering.

### Interventi

#### Bug 1 — Timezone datetime-local

**File:** `apps/web/src/app/admin/announcements/page.tsx`

Il campo `datetime-local` restituisce una stringa nel formato `YYYY-MM-DDTHH:mm` senza informazione di fuso orario. Prima di inviare al backend, convertire esplicitamente in ISO 8601 con timezone:

```typescript
// Conversione prima di inviare il form:
const expiresAtISO = form.expiresAt
  ? new Date(form.expiresAt).toISOString()  // converte da locale a UTC ISO
  : null

// In lettura (popolamento form da record esistente):
// Convertire da UTC ISO a stringa locale per datetime-local:
const toLocalDatetime = (iso: string) => {
  const d = new Date(iso)
  const offset = d.getTimezoneOffset() * 60000
  return new Date(d.getTime() - offset).toISOString().slice(0, 16)
}
```

Applicare la stessa correzione al form admin eventi se ha anch'esso un campo datetime.

**File:** `apps/api/src/announcements/announcements.service.ts`

Verificare che il backend tratti `expiresAt` come UTC. Se Prisma/PostgreSQL salvano già in UTC e il problema è solo nella serializzazione frontend, l'intervento backend potrebbe non essere necessario — verificare prima.

#### Bug 2 — Logica primo piano non attiva

Identificare dove nel codice viene determinato se una comunicazione/evento è "in primo piano". La semantica definita in TASK-06-QUATER è: un elemento è in primo piano se `expiresAt` è valorizzato e la data non è ancora scaduta.

Verificare i seguenti punti:

- **Dashboard** (`apps/web/src/app/dashboard/page.tsx`): il rendering delle card comunicazioni mostra visivamente gli elementi "in primo piano" in modo diverso? Se sì, verificare che la condizione `expiresAt && new Date(expiresAt) > new Date()` sia applicata correttamente.
- **Newsroom** (`apps/web/src/app/newsroom/page.tsx`): esiste un ordinamento o un badge "in primo piano"? Verificare che la logica utilizzi `expiresAt` e non il campo `isPinned` (rimosso in TASK-06-QUATER).
- **Backend** (`findDashboard` o `findPublished`): verificare che le query non escludano per errore gli elementi con `expiresAt` futuro.

> **Nota:** dopo TASK-06-QUATER il campo `isPinned` è stato rimosso dallo schema. Se in qualche file è rimasto un riferimento a `isPinned` come condizione per il "primo piano", va sostituito con la logica `expiresAt`.

### Acceptance criteria

- [ ] Il campo "Data e ora scadenza primo piano" salva e mostra l'orario corretto (nessuno scarto dovuto al timezone)
- [ ] Una comunicazione con `expiresAt` futuro appare visivamente "in primo piano" nella dashboard/Newsroom
- [ ] Una comunicazione con `expiresAt` passato non appare più in primo piano ma rimane visibile nello storico
- [ ] Lo stesso comportamento si applica agli eventi (se hanno il campo `expiresAt`)
- [ ] Nessun riferimento residuo a `isPinned` nella logica di primo piano

---

## TASK-11 — Revisione logo pagina Login

**Priorità:** Bassa  
**Stato:** `[x]` — completato 2026-05-15

### Contesto

Il logo presente nella pagina di login (`/auth/login`) non è corretto: è diverso dal logo mostrato nella barra superiore del portale. Deve essere allineato per coerenza visiva, aggiungendo anche la dicitura testuale "Serviform Academy".

### Obiettivo

1. Sostituire il logo nella pagina di login con lo stesso asset usato nella barra superiore (header/navbar)
2. Affiancare o sovrapporre al logo la dicitura "Serviform Academy"

### Interventi

**File:** `apps/web/src/app/auth/login/page.tsx`

1. Individuare quale componente/asset viene usato come logo nella barra superiore (verificare `apps/web/src/components/` o il layout principale). Usare lo stesso.

2. Aggiungere la dicitura "Serviform Academy" accanto o sotto al logo. La resa grafica deve essere coerente con quella della navbar — verificare font, peso e colore usati nell'header.

Esempio struttura:

```tsx
<div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
  <img src="/logo.svg" alt="Serviform Academy" style={{ height: 48 }} />
  <span style={{ fontWeight: 600, fontSize: '1.1rem', color: '#1e3a5f' }}>
    Serviform Academy
  </span>
</div>
```

> Adattare lo stile al sistema di design esistente (classi CSS o styled components già in uso nella pagina login).

### Acceptance criteria

- [ ] Il logo nella pagina login è identico a quello della barra superiore
- [ ] La dicitura "Serviform Academy" è visibile nella pagina login, accanto o sotto al logo
- [ ] La resa grafica è coerente con il resto del portale (font, colori, dimensioni)

---

## TASK-12 — Bug: ricaricamento automatico inatteso delle pagine

**Priorità:** Alta  
**Stato:** `[x]` — completato 2026-05-21

### Contesto

Alcune pagine del portale si ricaricano automaticamente senza alcuna azione da parte dell'utente. Il comportamento peggiora la fluidità di navigazione e compromette la percezione qualitativa del prodotto. La causa non è ancora stata identificata; il task include sia la fase di analisi che la correzione.

Le cause tipiche di un re-render/reload inatteso in Next.js + React sono:

- **Loop di `useEffect`**: una dipendenza nell'array del `useEffect` viene ricreata ad ogni render (oggetto/array inline), scatenando un loop infinito di fetch che può forzare un reload se l'errore è fatale.
- **Polling / `setInterval`**: un timer che chiama `router.refresh()` o `window.location.reload()`.
- **WebSocket / SSE**: un evento di riconnessione che triggera un reload della pagina.
- **Next.js Fast Refresh / hot reload in produzione**: configurazione errata che mantiene attivo il server di sviluppo.
- **Redirect loop**: un middleware o `useRouter.push()` che produce un loop di redirect.

### Obiettivo

1. Identificare su quali pagine avviene il ricaricamento e la frequenza
2. Individuare la causa tecnica (loop useEffect, polling, SSE, ecc.)
3. Correggere il problema garantendo navigazione stabile

### Fase 1 — Analisi

**Istruzioni per la riproduzione:**

1. Aprire la DevTools del browser (tab **Network** e **Console**)
2. Navigare nelle pagine sospette e osservare:
   - Presenza di chiamate API ripetute in loop (stessa URL chiamata ogni N secondi)
   - Errori in console del tipo `Maximum update depth exceeded`
   - Presenza di WebSocket / EventSource attivi
3. Verificare nei file `.tsx` della pagina incriminata:
   - `useEffect` con dipendenze che includono oggetti creati inline o funzioni non memoizzate
   - Chiamate a `router.refresh()` o `window.location.reload()` condizionali

**File da ispezionare prioritariamente:**

| File | Cosa cercare |
|---|---|
| `apps/web/src/app/dashboard/page.tsx` | `useEffect` con fetch, `setInterval`, `router.refresh()` |
| `apps/web/src/app/newsroom/page.tsx` | stesse verifiche |
| `apps/web/src/app/catalog/CatalogClient.tsx` | loop di filtro/fetch |
| `apps/web/src/middleware.ts` (se esiste) | redirect loop |
| `apps/web/next.config.*` | configurazione hot reload / revalidation |

### Fase 2 — Correzione

Una volta identificata la causa, applicare il fix specifico. Pattern comuni:

```typescript
// ❌ Loop: oggetto inline nelle dipendenze
useEffect(() => { fetchData(options) }, [{ page, limit }])  // nuovo oggetto ad ogni render

// ✅ Fix: dipendenze primitive
useEffect(() => { fetchData({ page, limit }) }, [page, limit])

// ❌ Loop: funzione ricreata ad ogni render come dipendenza
useEffect(() => { load() }, [load])  // se load è definita nel corpo del componente

// ✅ Fix: useCallback o omissione dalla dep-array se stabile
const load = useCallback(() => { ... }, [])
```

### Acceptance criteria

- [x] Identificate le pagine e la causa tecnica del ricaricamento (documentata in questo task come nota)
- [x] Il portale non presenta più ricaricamenti automatici inattesi
- [x] Nessun `useEffect` produce loop infiniti (verificabile in console: assenza di `Maximum update depth exceeded`)
- [x] Il fix non introduce regressioni sul caricamento dati (le pagine continuano ad aggiornare i dati quando necessario)

### Note implementazione (2026-05-21)

Trovati e corretti 3 bug:

**Bug 1 — Causa principale** (`apps/web/src/app/courses/[slug]/[unit]/page.tsx` righe 66-67):
La funzione `handleComplete()` usava `window.location.href` per navigare all'unità successiva dopo il completamento, causando un full browser reload invece di una navigazione soft Next.js. Sostituito con `router.push()` da `next/navigation`.

**Bug 2 — ProgressContext instabile** (`apps/web/src/context/ProgressContext.tsx`):
`loadedCourses` era uno state (`useState<Set<string>>`) usato come dipendenza di `useCallback` in `loadCompletedUnitsFromServer`. Ogni volta che un corso veniva marcato come caricato, lo state cambiava → nuova funzione → con `reactCompiler: true` attivo in `next.config.ts` potenziali re-esecuzioni a cascata degli `useEffect` dipendenti. Risolto convertendo `loadedCourses` da `useState` a `useRef`, eliminando la ricreazione della funzione.

**Bug 3 — Redirect admin events** (`apps/web/src/app/admin/events/page.tsx`):
`useEffect(() => { router.replace(...) }, [router])` usava `router` nelle deps invece di `[]`. Anche se `router` in Next.js App Router è stabile, il pattern è non-standard e potenzialmente problematico con React Compiler. Corretto con `[]`.

---

## TASK-13 — Dashboard utente: redesign card comunicazioni e primo piano

**Priorità:** Alta  
**Stato:** `[x]` — completato 2026-05-21 (redesign completo dell'intera pagina)

### Contesto

La dashboard (`/dashboard`) è la pagina principale del portale e quella maggiormente utilizzata dagli utenti. L'attuale layout presenta comunicazioni e corsi in un formato essenziale che non valorizza i contenuti in primo piano né offre un'esperienza visivamente moderna. Gli elementi con `expiresAt` futuro (in primo piano) devono emergere chiaramente rispetto ai contenuti ordinari.

### Obiettivo

Ridisegnare la sezione comunicazioni/eventi della dashboard con:
1. **Hero banner** per la comunicazione in primo piano più recente (immagine full-width, titolo sovrapposto, CTA)
2. **Card grid moderna** per le comunicazioni successive (immagine, categoria, data, estratto)
3. **Carousel orizzontale** per gli eventi futuri
4. Migliore gerarchia visiva: pinned → eventi prossimi → comunicazioni recenti

### Layout proposto

```
┌─────────────────────────────────────────────────────────────────┐
│  HERO (comunicazione in primo piano con expiresAt futuro)       │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ [banner image full-width, h: ~280px]                    │   │
│  │ ████████████ overlay scuro dal basso                    │   │
│  │ Badge "In primo piano"  · Data · Categoria              │   │
│  │ Titolo comunicazione (h2, bianco)                       │   │
│  │ [Leggi →]                                               │   │
│  └─────────────────────────────────────────────────────────┘   │
├─────────────────────────────────────────────────────────────────┤
│  Prossimi eventi                              [Vedi tutti →]    │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐                     │
│  │EventCard │  │EventCard │  │EventCard │  ←→ scroll           │
│  └──────────┘  └──────────┘  └──────────┘                     │
├─────────────────────────────────────────────────────────────────┤
│  Comunicazioni recenti                                          │
│  ┌────────────────────┐  ┌────────────────────┐               │
│  │ [img] Categoria    │  │ [img] Categoria    │               │
│  │ Titolo             │  │ Titolo             │               │
│  │ Estratto testo...  │  │ Estratto testo...  │               │
│  │ Data · [Leggi →]   │  │ Data · [Leggi →]   │               │
│  └────────────────────┘  └────────────────────┘               │
└─────────────────────────────────────────────────────────────────┘
```

### File coinvolti

#### Frontend — Dashboard principale

**File:** `apps/web/src/app/dashboard/page.tsx`

**Hero banner (comunicazione in primo piano):**

```tsx
// Seleziona la comunicazione in primo piano più recente
const pinned = announcements.find(a =>
  a.expiresAt && new Date(a.expiresAt) > new Date()
)

{pinned && (
  <div className={styles.heroBanner} style={{
    backgroundImage: `url(${pinned.bannerUrl || '/placeholder-banner.jpg'})`,
    backgroundSize: 'cover',
    backgroundPosition: 'center',
    position: 'relative',
    height: 280,
    borderRadius: 12,
    overflow: 'hidden',
  }}>
    <div className={styles.heroOverlay}>  {/* gradient overlay scuro */}
      <span className={styles.pinnedBadge}>In primo piano</span>
      <p className={styles.heroDate}>{formatDate(pinned.publishedAt)}</p>
      <h2 className={styles.heroTitle}>{pinned.title}</h2>
      <Link href={`/newsroom/${pinned.id}`} className={styles.heroBtn}>
        Leggi →
      </Link>
    </div>
  </div>
)}
```

**Carousel eventi futuri:**

```tsx
const upcomingEvents = events
  .filter(e => new Date(e.date) > new Date())
  .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
  .slice(0, 6)

<div className={styles.eventsCarousel}>
  {upcomingEvents.map(e => (
    <div key={e.id} className={styles.eventCard}>
      {e.bannerUrl && <img src={e.bannerUrl} alt={e.title} />}
      <span className={styles.eventType}>{e.type}</span>
      <p className={styles.eventDate}>{formatDate(e.date)}</p>
      <h4>{e.title}</h4>
    </div>
  ))}
</div>
```

**Card grid comunicazioni:**

```tsx
const regularAnn = announcements
  .filter(a => !pinned || a.id !== pinned.id)
  .slice(0, 6)

<div className={styles.annGrid}>
  {regularAnn.map(a => (
    <div key={a.id} className={styles.annCard}>
      {a.bannerUrl && (
        <img src={a.bannerUrl} alt={a.title} className={styles.annCardImg} />
      )}
      <div className={styles.annCardBody}>
        <span className={styles.annSection}>{a.section}</span>
        <h4>{a.title}</h4>
        <p>{a.summary?.slice(0, 120)}…</p>
        <footer>
          <time>{formatDate(a.publishedAt)}</time>
          <Link href={`/newsroom/${a.id}`}>Leggi →</Link>
        </footer>
      </div>
    </div>
  ))}
</div>
```

**File CSS:** `apps/web/src/app/dashboard/Dashboard.module.css` (o equivalente)

Aggiungere le classi: `heroBanner`, `heroOverlay`, `heroTitle`, `heroBtn`, `pinnedBadge`, `heroDate`, `eventsCarousel`, `eventCard`, `eventType`, `eventDate`, `annGrid`, `annCard`, `annCardImg`, `annCardBody`, `annSection`.

> **Nota layout responsivo:** su mobile il carousel eventi usa scroll orizzontale con `overflow-x: auto; display: flex; gap: 12px`. La card grid usa `grid-template-columns: 1fr` su mobile e `repeat(2, 1fr)` da 640px in su.

### Acceptance criteria

- [x] La comunicazione in primo piano (con `expiresAt` futuro) appare come hero banner con immagine, titolo e CTA
- [x] Se non esiste nessuna comunicazione in primo piano, la sezione hero è assente (nessun spazio vuoto)
- [x] Il carousel eventi futuri è scrollabile orizzontalmente e mostra tipo, data e titolo
- [x] Le comunicazioni ordinarie sono presentate come card con immagine, categoria, estratto e link
- [x] Il layout è responsivo (mobile: 1 colonna, desktop: 2 colonne per le card)
- [x] Nessuna regressione sulla sezione corsi assegnati nella dashboard

---

## TASK-14 — Uniformità colori categorie (ServiForma → giallo)

**Priorità:** Media  
**Stato:** `[x]` — completato 2026-05-21

### Contesto

Le categorie (chiamate "Software" nel DB) hanno un campo colore usato per badge e filtri nel portale. EngView, Sysform e ProjectO hanno già i propri colori. La categoria **ServiForma** non ha un colore definito o usa un valore di default non coerente. Il colore ufficiale assegnato a ServiForma è il **giallo** (`#F59E0B` o equivalente nel sistema di design).

### Obiettivo

1. Aggiornare il record ServiForma nel database con il colore giallo
2. Verificare che tutti i punti dell'UI che utilizzano il colore categoria lo rendano correttamente per ServiForma

### Interventi

#### Backend — Aggiornamento dato

Eseguire la migrazione/seed per aggiornare il colore:

```sql
UPDATE "Software" SET color = '#F59E0B' WHERE name = 'ServiForma';
```

Oppure, se gestito via seed Prisma (`apps/api/prisma/seed.ts`), aggiornare il record corrispondente:

```typescript
await prisma.software.upsert({
  where: { name: 'ServiForma' },
  update: { color: '#F59E0B' },
  create: { name: 'ServiForma', color: '#F59E0B' },
})
```

#### Frontend — Verifica rendering

Verificare che i seguenti punti usino `software.color` (o `category.color`) correttamente senza override hardcoded:

| File | Componente | Verifica |
|---|---|---|
| `apps/web/src/app/catalog/CatalogClient.tsx` | Badge/chip categoria nel filtro | Usa `software.color` per background/border |
| `apps/web/src/app/admin/assignments/page.tsx` | Badge categoria nella lista corsi | Usa `c.software?.color` |
| `apps/web/src/app/dashboard/page.tsx` | Badge categoria nelle card | Usa `a.section` o `software.color` |
| `apps/web/src/app/admin/courses/page.tsx` | Colonna categoria nella tabella | Nessun colore hardcoded |

> **Nota:** se esiste un mapping colori hardcoded nel frontend (es. `{ EngView: '#...', Sysform: '#...' }`), valutare se eliminarlo a favore del valore proveniente dal DB, che è la fonte di verità.

### Acceptance criteria

- [x] Il record ServiForma nel DB ha `color = '#F59E0B'`
- [x] I badge/chip della categoria ServiForma mostrano il colore giallo nel catalogo, nelle assegnazioni e nella dashboard
- [x] Le altre categorie (EngView, Sysform, ProjectO) mantengono invariati i propri colori
- [x] Nessun colore hardcoded nel frontend per le categorie (o, se presenti, aggiornati a includere ServiForma)

---

## TASK-15 — Uniformità naming "ServiForma"

**Priorità:** Media  
**Stato:** `[x]` — completato 2026-05-21

### Contesto

All'interno del portale la categoria/brand viene scritto in modi diversi: "Serviforma", "ServiForma", "SERVIFORMA", "serviforma", ecc. La dicitura ufficiale e corretta è **"ServiForma"** (S maiuscola, F maiuscola interna).

> **Non modificare:** nomi di variabili interne, campi DB (`softwareId`, `software`, ecc.) o chiavi API — solo le label testuali visibili all'utente.

### Interventi

#### Ricerca occorrenze

Prima dell'implementazione, eseguire una ricerca case-insensitive per trovare tutte le occorrenze:

```bash
# Cercare varianti da correggere
grep -ri "serviforma\|Serviforma\|SERVIFORMA" apps/web/src --include="*.tsx" --include="*.ts" -l
grep -ri "serviforma\|Serviforma\|SERVIFORMA" apps/api/prisma --include="*.ts" -l
```

#### File tipicamente coinvolti

| File | Occorrenza tipica |
|---|---|
| `apps/api/prisma/seed.ts` | Nome della categoria nel seed |
| `apps/web/src/app/*/page.tsx` | Label testuali, titoli, descrizioni |
| `apps/web/src/components/**/*.tsx` | Componenti condivisi |
| Qualsiasi file `.md` o `.json` di configurazione visibile | Descrizioni, placeholder |

#### Regola di sostituzione

| Testo attuale | Testo corretto |
|---|---|
| `Serviforma` | `ServiForma` |
| `SERVIFORMA` | `ServiForma` |
| `serviforma` (in label/testo visibile) | `ServiForma` |

### Acceptance criteria

- [x] Nessuna occorrenza di "Serviforma" (minuscola f) in label visibili all'utente
- [x] Il nome nel DB (campo `name` del record Software/Category) è `ServiForma`
- [x] Le pagine del portale (catalogo, dashboard, why, login) mostrano "ServiForma" con la capitalizzazione corretta
- [x] Nessuna variabile interna o chiave API è stata rinominata

---

## TASK-16 — Revisione pagina Unità: icone professionali e valorizzazione badge

**Priorità:** Media  
**Stato:** `[x]` — completato 2026-05-21

### Contesto

La pagina che mostra le unità di un corso (e la relativa pagina di fruizione del contenuto) utilizza emoji come indicatori visivi di tipo/stato (es. 📹 per video, 📄 per documento, ✅ per completato). Questo approccio è informale e poco coerente con il design professionale del resto del portale. Inoltre, il sistema di badge e certificazioni non è sufficientemente evidenziato nella pagina unità.

### Obiettivo

1. Sostituire le emoji con icone SVG professionali (coerenti con il sistema di icone già in uso, es. Heroicons, Lucide, o icone custom già presenti nel progetto)
2. Valorizzare la sezione badge/certificazione nella pagina unità: mostrare chiaramente se il corso rilascia un badge e quanto manca al completamento

### Fase 1 — Ricognizione

Prima dell'implementazione, identificare:
- Quale libreria di icone è già usata nel progetto (`grep -r "from 'lucide-react'\|from '@heroicons" apps/web/src`)
- Dove sono usate le emoji (cerca `\p{Emoji}` o pattern specifici come `📹`, `📄`, `✅`)
- La struttura della pagina unità (tipicamente `apps/web/src/app/courses/[id]/units/` o simile)

### Interventi

#### Sostituzione emoji → icone

Identificare il set di emoji in uso e sostituirle con le icone corrispondenti dalla libreria già presente:

| Emoji tipica | Significato | Icona sostitutiva (Lucide) |
|---|---|---|
| 📹 / 🎬 | Video | `<Video />` |
| 📄 / 📝 | Documento/PDF | `<FileText />` |
| 🎯 / 📋 | Quiz/Test | `<ClipboardList />` |
| ✅ | Completato | `<CheckCircle2 />` (colore verde) |
| 🔒 | Bloccato | `<Lock />` |
| ▶️ | In corso | `<PlayCircle />` |
| 🏆 | Badge/Certificato | `<Award />` |

> Se il progetto usa Heroicons, usare i corrispondenti di quella libreria. Mantenere coerenza con le icone già presenti negli altri componenti.

#### Sezione badge nella pagina unità

Aggiungere un banner/card nella pagina del corso che mostri lo stato verso il badge:

```tsx
{course.issuesBadge && (
  <div className={styles.badgeProgress}>
    <Award size={32} className={styles.badgeIcon} />
    <div>
      <h4>Ottieni il badge "{course.title}"</h4>
      <p>
        Completa {remainingUnits} {remainingUnits === 1 ? 'unità' : 'unità'} per
        ottenere il certificato e il badge del corso.
      </p>
      {course.badgeUrl && (
        <img src={course.badgeUrl} alt="Badge" className={styles.badgePreview} />
      )}
    </div>
    <div className={styles.progressBar}>
      <div style={{ width: `${progressPct}%` }} className={styles.progressFill} />
    </div>
  </div>
)}
```

Dove `remainingUnits` = numero di unità non-OVERVIEW non ancora completate e `progressPct` = percentuale completamento.

### Acceptance criteria

- [x] Nessuna emoji usata come icona funzionale nella pagina unità (sostituita con icona SVG)
- [x] Le icone sono coerenti con la libreria già usata nel progetto
- [x] Se il corso ha `issuesBadge = true`, è visibile un banner con il progresso verso il badge
- [x] Il banner badge mostra l'anteprima SVG del badge se `badgeUrl` è presente (introdotto in TASK-05)
- [x] La barra di progresso riflette accuratamente le unità completate / totali
- [x] Nessuna regressione nel tracciamento avanzamento unità

---

## TASK-17 — Redesign completo pannello amministrativo

**Priorità:** Alta  
**Stato:** `[x]` — completato 2026-05-21

### Contesto

Il pannello admin (`/admin/*`) è cresciuto organicamente task dopo task e presenta ora una struttura complessa: voci di menu non raggruppate, form lunghi, tabelle dense, navigazione laterale piatta. L'obiettivo è un redesign completo dell'esperienza admin che migliori usabilità, leggibilità e velocità operativa senza alterare le funzionalità esistenti.

> **Nota:** questo è il task più ampio e trasversale. Si consiglia di suddividerlo in sotto-task durante l'implementazione (es. TASK-17a navigazione, TASK-17b tabelle, TASK-17c form).

### Obiettivo

1. **Navigazione**: raggruppare le voci di menu in sezioni logiche, aggiungere icone, rendere il menu collassabile
2. **Tabelle**: aggiungere paginazione, ricerca/filtro inline, colonne ordinabili, azioni rapide per riga
3. **Form**: ridurre la lunghezza percepita con sezioni collassabili o step wizard per i form più lunghi
4. **Layout generale**: header con breadcrumb, sezioni con card contenitore, spacing e tipografia uniformi

### Layout navigazione proposto

```
┌─────────────────────────────────────────────────────────┐
│  ← [Logo]  Serviform Academy Admin      [User] [Logout] │
├──────────────────┬──────────────────────────────────────┤
│  CONTENUTI       │                                      │
│  📚 Corsi        │   [Area contenuto principale]        │
│  🏷️  Categorie   │                                      │
│  📢 Comunicaz.   │                                      │
│  📅 Eventi       │                                      │
│                  │                                      │
│  AZIENDE         │                                      │
│  🏢 Aziende      │                                      │
│  🔗 Assegnazioni │                                      │
│                  │                                      │
│  SISTEMA         │                                      │
│  👥 Utenti       │                                      │
│  ⚙️  Impostazioni│                                      │
└──────────────────┴──────────────────────────────────────┘
```

### Interventi

#### 1 — Navigazione (`apps/web/src/app/admin/layout.tsx`)

- Raggruppare le voci in sezioni: **Contenuti** (Corsi, Categorie, Comunicazioni, Eventi), **Aziende** (Aziende, Assegnazioni), **Sistema** (Utenti, eventuale Impostazioni)
- Aggiungere icone da libreria già in uso (Lucide/Heroicons) a ogni voce
- Aggiungere intestazioni di sezione (label non cliccabile sopra il gruppo)
- Valutare menu collassabile su mobile (hamburger)

#### 2 — Tabelle con paginazione e filtro

Per ogni pagina admin con tabella lunga (Corsi, Aziende, Utenti, Comunicazioni):

```tsx
// Aggiungere stato locale di paginazione e ricerca
const [search, setSearch] = useState('')
const [page, setPage] = useState(1)
const PAGE_SIZE = 20

const filtered = items.filter(i =>
  i.title?.toLowerCase().includes(search.toLowerCase()) ||
  i.name?.toLowerCase().includes(search.toLowerCase())
)
const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

// Header tabella
<div className={styles.tableHeader}>
  <input
    placeholder="Cerca..."
    value={search}
    onChange={e => { setSearch(e.target.value); setPage(1) }}
  />
  <span>{filtered.length} risultati</span>
</div>

// Footer tabella con paginazione
<div className={styles.pagination}>
  <button disabled={page === 1} onClick={() => setPage(p => p - 1)}>←</button>
  <span>Pagina {page} di {Math.ceil(filtered.length / PAGE_SIZE)}</span>
  <button disabled={page * PAGE_SIZE >= filtered.length} onClick={() => setPage(p => p + 1)}>→</button>
</div>
```

#### 3 — Azioni rapide per riga

Aggiungere nella colonna azioni di ogni tabella icone di azione rapida al posto dei link testuali:

```tsx
<td className={styles.actionsCell}>
  <button title="Modifica" onClick={() => openEdit(row)}><Pencil size={16} /></button>
  <button title="Elimina" onClick={() => confirmDelete(row.id)}><Trash2 size={16} /></button>
</td>
```

#### 4 — Layout generale e header con breadcrumb

**File:** `apps/web/src/app/admin/layout.tsx`

Aggiungere un header di pagina con breadcrumb automatico basato sul pathname corrente:

```tsx
const segments = pathname.split('/').filter(Boolean)
// ['admin', 'courses'] → 'Admin > Corsi'
```

#### 5 — Uniformità form

Per i form più lunghi (Corsi, Comunicazioni) valutare il raggruppamento in sezioni visive con separatori:

- **Sezione "Informazioni base"**: titolo, categoria, livello
- **Sezione "Contenuto"**: descrizione, contenuto HTML
- **Sezione "Media"**: thumbnail, badge URL/upload
- **Sezione "Pubblicazione"**: stato, date, accesso

### File coinvolti

| File | Intervento principale |
|---|---|
| `apps/web/src/app/admin/layout.tsx` | Navigazione raggruppata con icone e sezioni |
| `apps/web/src/app/admin/courses/page.tsx` | Paginazione, ricerca, azioni icona, form a sezioni |
| `apps/web/src/app/admin/companies/page.tsx` | Paginazione, ricerca, azioni icona |
| `apps/web/src/app/admin/assignments/page.tsx` | Paginazione, ricerca |
| `apps/web/src/app/admin/announcements/page.tsx` | Paginazione, ricerca, form a sezioni |
| `apps/web/src/app/admin/events/page.tsx` | Paginazione, ricerca, form a sezioni |
| `apps/web/src/app/admin/users/page.tsx` (se esiste) | Paginazione, ricerca, azioni icona |
| `apps/web/src/app/admin/` (CSS modules) | Classi condivise: `tableHeader`, `pagination`, `actionsCell` |

> Si consiglia di creare un file CSS condiviso `apps/web/src/app/admin/admin-shared.module.css` per le classi riutilizzate in tutte le pagine admin (tabelle, paginazione, form section), evitando duplicazione.

### Acceptance criteria

- [x] **Shell senza duplicazioni**: la Topbar globale del portale (`app/layout.tsx`) gestisce brand, navigazione, campanella e user menu (avatar/logout). Il pannello admin aggiunge solo la sidebar — niente topbar duplicata.
- [x] **Sidebar collassabile** 232↔64px con preferenza in `localStorage` (`sa_admin_sidebar_collapsed`); voci raggruppate (Generale, Contenuti, Librerie, Organizzazione, Comunicazioni, Progressi) con icone Lucide; comportamento drawer su mobile con backdrop e trigger inline.
- [x] **Dashboard reale** in `/admin/page.tsx`: 4 KPI cards (Corsi con split pubblicati/nascosti, Aziende, Utenti, Certificati), "Ultimi corsi modificati" (top 5 per updatedAt con thumbnail + stato + tempo relativo), "Da pubblicare" (count bozze + CTA), griglia "Prossimi eventi". **Niente shortcut grid** (era duplicato della sidebar).
- [x] **PageHeader unificato** (`_components/PageHeader.tsx`): titolo (display 26px), descrizione, breadcrumb dinamico inline, slot azione. Usato in tutte le pagine elenco (companies, users, announcements, assignments, certificates, guides, videos, imports, units) e in AdminCrud.
- [x] **Voci nav separate Comunicazioni/Eventi**: link distinti che puntano alla stessa pagina con hash `#announcements` / `#events`; la pagina legge l'hash all'avvio e su `hashchange`, e aggiorna l'hash al cambio tab via `history.replaceState`.
- [x] Ogni tabella admin con più di 20 record ha paginazione e campo di ricerca.
- [x] Le azioni per riga usano icone con tooltip al posto di link testuali.
- [x] I form lunghi (Corsi, Comunicazioni, Eventi) sono organizzati in sezioni visive distinte.
- [ ] Nessuna funzionalità esistente è rimossa o rotta dal redesign
