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
**Stato:** `[ ]`

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
**Stato:** `[ ]`

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
