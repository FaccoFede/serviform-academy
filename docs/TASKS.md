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

## TASK-07 — Gestione comunicazioni nella dashboard utente (logica scadenza)

**Priorità:** Alta  
**Stato:** `[ ]` — da fare

### Contesto

Il comportamento attuale è: `findPublished()` filtra le comunicazioni con `expiresAt > now`, il che fa scomparire le comunicazioni scadute **sia** dalla dashboard **sia** dalla Newsroom. Questo è sbagliato.

Il campo `expiresAt` ha un significato preciso: indica la data entro cui la comunicazione rimane "in primo piano" nella home dell'utente (dashboard). Superata quella data, la comunicazione deve sparire dalla dashboard ma continuare ad essere consultabile nella Newsroom, che funge da archivio storico completo.

Attualmente la dashboard mostra le prime 4 comunicazioni non scadute, ma non le card — usa un layout testo compatto. Anche questo va aggiornato: le comunicazioni in dashboard devono usare card coerenti con quelle della Newsroom.

### Obiettivo

1. **Newsroom:** rimuovere il filtro `expiresAt` da `findPublished()` — tutte le comunicazioni pubblicate devono essere visibili nello storico, indipendentemente dalla scadenza
2. **Dashboard:** mostrare solo le comunicazioni la cui `expiresAt` è ancora futura (o nulla), visualizzate come card coerenti con la Newsroom
3. La semantica di `expiresAt` diventa esplicita: "fino a quando la comunicazione appare in dashboard", non "fino a quando esiste nel sistema"

### File coinvolti

#### Backend

| File | Intervento |
|---|---|
| `apps/api/src/announcements/announcements.service.ts` | Nel metodo `findPublished()` (riga 50), rimuovere la clausola `OR: [{ expiresAt: null }, { expiresAt: { gt: now } }]` dal `where`. La Newsroom vede tutto il pubblicato. |
| `apps/api/src/announcements/announcements.service.ts` | Aggiungere un nuovo metodo `findDashboard(userId?: string)` che mantiene il filtro `expiresAt > now` (o `expiresAt: null`), ordinato per `isPinned desc, publishedAt desc`, con il campo `read`. Questo metodo sarà chiamato solo dalla dashboard. |
| `apps/api/src/announcements/announcements.controller.ts` | Aggiungere un endpoint `GET /announcements/dashboard` che chiama `findDashboard(req.user.id)` (richiede auth). |
| `apps/web/src/lib/api.ts` | Aggiungere `findDashboard: () => request<any[]>('/announcements/dashboard')` nel namespace `announcements`. |

#### Frontend — Dashboard

**File:** `apps/web/src/app/dashboard/page.tsx`

- Sostituire la chiamata `api.announcements.findPublished()` con `api.announcements.findDashboard()` nel `Promise.all` dell'`useEffect`
- **Sostituire il layout card comunicazioni**: attualmente ogni comunicazione è un `<button className={styles.annCard}>` con layout testo compatto. Il nuovo layout deve usare card coerenti con la Newsroom (immagine/banner, badge tipo colorato, titolo, corpo troncato), impilate verticalmente o in griglia

Riferimento alla struttura `AnnCard` in `apps/web/src/app/newsroom/page.tsx` (righe ~39-84) — importarla o replicarne il markup nel dashboard.

### Acceptance criteria

- [ ] La Newsroom mostra **tutte** le comunicazioni pubblicate, incluse quelle con `expiresAt` passato
- [ ] La dashboard mostra solo comunicazioni la cui `expiresAt` è futura (o nulla)
- [ ] Le comunicazioni nella dashboard sono visualizzate come card con banner, tipo, titolo e corpo
- [ ] Nessuna regressione nella logica "letto/non letto" (il campo `read` è preservato)
- [ ] L'endpoint `/announcements/dashboard` è protetto da autenticazione

---

## TASK-08 — Sezione eventi imminenti nella dashboard utente

**Priorità:** Media  
**Stato:** `[ ]` — da fare

### Contesto

La dashboard utente non mostra attualmente alcuna informazione sugli eventi in programma. L'utente deve navigare manualmente alla Newsroom (o a `/calendar`) per scoprire i prossimi webinar o workshop. L'obiettivo è aggiungere nella dashboard una sezione che mostri gli eventi previsti nei successivi 30 giorni, così l'utente può avere immediatamente il quadro della formazione programmata nel breve periodo.

### Obiettivo

Aggiungere nella dashboard una nuova sezione "Prossimi eventi" che mostra gli eventi futuri (da oggi a +30 giorni), ordinati cronologicamente, visualizzati come card compatte.

### File coinvolti

#### Backend / API (se necessario)

L'endpoint `GET /events/upcoming` esiste già (`api.events.findUpcoming()`). Se restituisce tutti gli eventi futuri senza limite temporale, il filtro a 30 giorni può essere applicato lato client. In alternativa si può aggiungere un parametro query `?days=30` al backend per ottimizzare.

| File | Intervento |
|---|---|
| `apps/api/src/events/events.service.ts` | (Opzionale) Aggiungere un parametro `days?: number` a `findUpcoming()` per filtrare gli eventi entro N giorni dalla data corrente. |
| `apps/web/src/lib/api.ts` | (Opzionale) Aggiornare `findUpcoming` per accettare un parametro opzionale `days`: `findUpcoming: (days?: number) => request<any[]>('/events/upcoming' + (days ? '?days=' + days : ''))`. |

#### Frontend — Dashboard

**File:** `apps/web/src/app/dashboard/page.tsx`

- Aggiungere nello state: `const [upcomingEvents, setUpcomingEvents] = useState<any[]>([])`
- Nel `Promise.all` dell'`useEffect`, aggiungere `api.events.findUpcoming()` e salvare il risultato in `upcomingEvents`
- Filtrare client-side: `const next30 = upcomingEvents.filter(e => { const d = new Date(e.date); const limit = new Date(); limit.setDate(limit.getDate() + 30); return d >= new Date() && d <= limit; })`
- Aggiungere nella colonna destra della dashboard (dopo le comunicazioni) una nuova `<section>` con:
  - Header: titolo "Prossimi eventi" + link "Tutti →" verso `/newsroom`
  - Lista delle card evento (se `next30.length > 0`), altrimenti messaggio "Nessun evento in programma nei prossimi 30 giorni."
  - Ogni card mostra: data formattata (giorno + mese), tipo evento con badge colorato, titolo, luogo (se presente), pulsante "Iscriviti" (se `registrationUrl` presente)
- La sezione va mostrata solo se `next30.length > 0` (per non occupare spazio inutilmente)

### Acceptance criteria

- [ ] La dashboard mostra una sezione "Prossimi eventi" con gli eventi nei successivi 30 giorni
- [ ] Gli eventi sono ordinati cronologicamente (dal più vicino al più lontano)
- [ ] Ogni card mostra: data, tipo (badge), titolo, luogo, pulsante iscrizione se disponibile
- [ ] Se non ci sono eventi nei 30 giorni successivi, la sezione non compare (o mostra un messaggio neutro)
- [ ] Il link "Tutti →" porta alla Newsroom
- [ ] Nessuna regressione sulle sezioni esistenti della dashboard
