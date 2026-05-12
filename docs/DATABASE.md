# Serviform Academy — Database

PostgreSQL 16 + Prisma 6. Lo schema vive in **`apps/api/prisma/schema.prisma`** (fonte di verità dei modelli). Le migration versionate sono in `apps/api/prisma/migrations/`. Il client Prisma è esposto a tutti i moduli NestJS tramite `PrismaService` (`apps/api/src/prisma/`).

> Per le ricette ("come aggiungo un campo / un modello") vedi anche [DEVELOPMENT.md](./DEVELOPMENT.md) § "Cambiare lo schema del database".

---

## 1. Workflow delle migration — regole d'oro

Lo schema Prisma e il DB reale **devono restare allineati**. In passato un disallineamento (enum creato a mano in SQL, schema Prisma con un nome diverso) ha causato 500 in produzione. Per evitarlo:

```bash
cd apps/api

# Ogni volta che modifichi schema.prisma:
npx prisma migrate dev --name descrizione_della_modifica   # crea la migration + applica + rigenera il client
# (in produzione/CI si usa invece:)
npx prisma migrate deploy

# Rigenerare il client senza migrare (es. dopo un pull):
npx prisma generate

# Verificare che DB e migration siano allineati:
npx prisma migrate status
```

- **Mai** modificare `schema.prisma` senza creare la migration corrispondente.
- **Mai** applicare SQL a mano senza aggiornare lo schema Prisma di conseguenza.
- Se devi scrivere SQL custom in una migration (es. conversione di enum), rendila **idempotente** quando possibile.
- Le migration manuali storiche in `prisma/migrations/` (cartelle datate) sono già applicate; non riapplicarle a mano.

Popolamento dati di esempio: `npx prisma db seed` (script `prisma/seed.ts`). Il seed crea i 4 software, 5 corsi, un'azienda demo con assegnazione e un annuncio di benvenuto. **Non crea utenti** — vedi [DEVELOPMENT.md](./DEVELOPMENT.md) § "Creare il primo admin".

`npx prisma migrate reset` ricrea il DB da zero e riesegue il seed: **distrugge tutti i dati**, usalo solo in sviluppo.

---

## 2. Enum

| Enum | Valori | Usato da |
|---|---|---|
| `Role` | `USER`, `ADMIN`, `TEAM_ADMIN` | `User.role` |
| `PublishState` | `HIDDEN`, `VISIBLE_LOCKED`, `PUBLISHED` | `Course.publishState` |
| `UnitType` | `OVERVIEW`, `LESSON`, `EXERCISE` | `Unit.unitType` |
| `AccessType` | `ACTIVE`, `LOCKED`, `HIDDEN` | (riferimento concettuale; le assegnazioni usano una stringa `accessType` con default `"ACTIVE"`) |
| `AnnouncementType` | `NEWS`, `NEW_COURSE`, `WEBINAR`, `MAINTENANCE` | `Announcement.type` |
| `EventType` | `WORKSHOP`, `WEBINAR`, `LIVE_SESSION` | `Event.eventType` |

I valori di `Role` e `PublishState` sono replicati anche lato frontend in `apps/web/src/lib/config.ts` (`USER_ROLES`, `PUBLISH_STATES`): se ne aggiungi/rimuovi, aggiorna entrambi.

---

## 3. Modelli

Legenda: **PK** chiave primaria, **FK** chiave esterna, *soft delete* = ha `deletedAt`.

### Identità e organizzazioni

**`User`** — *soft delete*
`id` (PK), `email` (unique), `name?`, `firstName?`, `lastName?`, `passwordHash?`, `role` (`Role`, default `USER`), `avatarUrl?`, `lastLoginAt?`, `createdAt`, `mustChangePassword` (default false).
Relazioni: `progress` (UserProgress[]), `certificates` (Certificate[]), `membership` (CompanyMembership?), `userAssignments` (UserCourseAssignment[]), `announcementReads` (AnnouncementRead[]).
`mustChangePassword = true` forza il cambio password al login (utenti creati via import CSV).

**`Company`** — *soft delete*
`id` (PK), `name`, `slug` (unique), `contractType?`, `assistanceExpiresAt?`, `notes?`, `visibleSoftwareIds: String[]` (default `[]`), `createdAt`, `updatedAt`.
`visibleSoftwareIds`: ID dei `Software` i cui contenuti sono visibili nel portale all'azienda. **Vuoto = vede tutti i contenuti** (default, compatibile con le aziende esistenti). Non si applica a Comunicazioni ed Eventi.
Relazioni: `members` (CompanyMembership[]), `interests` (CompanyInterest[]), `courseAssignments` (CompanyCourseAssignment[]).

**`CompanyMembership`** — collega un utente a un'azienda (1:1 lato utente: `userId` unique). FK → `User`, `Company`.

**`CompanyInterest`** — un'azienda è "interessata" a un software. Unique `(companyId, softwareId)`. FK → `Company`, `Software`.

### Assegnazioni corsi

**`CompanyCourseAssignment`** — assegna un corso a un'azienda. Unique `(companyId, courseId)`.
`accessType: String` (default `"ACTIVE"`), `startsAt` (default now), `expiresAt?`, `notes?`, `createdBy?`, `createdAt`, `updatedAt`. FK → `Company`, `Course`.

**`UserCourseAssignment`** — assegna un corso a un singolo utente. Stessa forma di sopra, unique `(userId, courseId)`. FK → `User`, `Course`.

> Un corso compare in "I miei corsi" dell'utente solo se assegnato a lui o alla sua azienda. `expiresAt` nel passato ⇒ corso "scaduto" (non apribile). Vedi `apps/web/src/lib/courseAccess.ts`.

### Contenuti formativi

**`Software`** — *soft delete*
`id` (PK), `name`, `slug` (unique), `tagline?`, `color?`, `lightColor?`, `createdAt`.
Sono i 4 prodotti Academy: **EngView, Sysform, ProjectO, ServiformA**. I colori brand di default lato frontend stanno in `apps/web/src/lib/brands.ts`, ma i valori live arrivano da qui (admin → Software).
Relazioni: `courses` (Course[]), `interests` (CompanyInterest[]), `videos` (VideoPill[]).

**`Course`** — *soft delete*
`id` (PK), `title`, `slug` (unique), `description?`, `objective?`, `level?`, `duration?`, `available` (default true), `publishState` (`PublishState`, default `PUBLISHED`), `thumbnailUrl?`, `issuesBadge` (default true), `softwareId` (FK → `Software`), `createdAt`, `updatedAt`.
`issuesBadge = true` ⇒ al completamento del corso l'utente riceve automaticamente un `Certificate` (badge nel profilo).
Relazioni: `software`, `units` (Unit[]), `certificates` (Certificate[]), `companyAssignments`, `userAssignments`.

**`Unit`** — *soft delete*
`id` (PK), `title`, `slug`, `order` (Int), `subtitle?`, `duration?` (stringa formattata, es. "1h 30min"), `durationHours?`, `durationMinutes?`, `unitType` (`UnitType`, default `LESSON`), `content?` (`Text`, HTML ricco), `videoUrl?`, `courseId` (FK → `Course`), `createdAt`, `updatedAt`. Unique `(courseId, slug)`.
Gestione `order`: `OVERVIEW` ha sempre `order = 0`; `LESSON`/`EXERCISE` ricevono `order` progressivo (1, 2, 3…) assegnato dal backend; `POST /units/course/:courseId/reorder` lo ricalcola.
In creazione si passano `durationHours`/`durationMinutes` e il backend formatta `duration`.
Le unità `OVERVIEW` **non contano** nel calcolo del progresso del corso.
Relazioni: `course`, `guides` (GuideReference[]), `exercises` (Exercise[]), `progress` (UserProgress[]).

**`GuideReference`** — guida Zendesk collegata a un'unità.
`id` (PK), `zendeskId`, `title`, `url`, `order` (default 0), `unitId` (FK → `Unit`), `catalogId?` (FK → `GuideCatalog`, `onDelete: SetNull`).
Se la guida è stata scelta dal catalogo centralizzato, `catalogId` è valorizzato: modifiche/cancellazioni si fanno nel catalogo, non sul riferimento.

**`GuideCatalog`** — catalogo centralizzato di guide Zendesk.
`id` (PK), `title`, `url` (unique), `zendeskId?`, `createdAt`, `updatedAt`. Relazione: `references` (GuideReference[]).
Workflow: l'admin registra un URL → il titolo viene recuperato automaticamente dalla pagina → nelle unità si seleziona una guida già nel catalogo.

**`Exercise`** — esercitazione collegata a un'unità (tipicamente `EXERCISE`).
`id` (PK), `title`, `description?`, `htmlUrl?` (anteprima 3D in iframe), `evdUrl?` (file `.evd` scaricabile), `order` (default 0), `unitId` (FK → `Unit`), `createdAt`.

### Progresso e attestati

**`UserProgress`** — stato di un'unità per un utente.
`id` (PK), `userId` (FK → `User`), `unitId` (FK → `Unit`), `completed` (default false), `completedAt?`, `viewedAt?`. Unique `(userId, unitId)`. Indice `(userId, completed)`.

**`Certificate`** — attestato/badge di completamento corso.
`id` (PK), `userId` (FK → `User`), `courseId` (FK → `Course`), `issuedAt` (default now). Unique `(userId, courseId)` (un solo attestato per coppia).
Il PDF dell'attestato è generato lato browser con jsPDF (`apps/web/src/lib/certificate.ts`).

### Comunicazioni ed eventi

**`Announcement`** — comunicazione/news (newsroom).
`id` (PK), `title`, `body` (`Text`), `type` (`AnnouncementType`, default `NEWS`), `published` (default false), `publishedAt?`, `expiresAt?`, `isPinned` (default false), `section` (default `"NEWS"`), `bannerUrl?`, `content?` (`Text`), `createdBy?`, `createdAt`, `updatedAt`. Relazione: `reads` (AnnouncementRead[]).

**`AnnouncementRead`** — tracking lettura per utente (aperta = letta).
`id` (PK), `announcementId` (FK → `Announcement`, `onDelete: Cascade`), `userId` (FK → `User`, `onDelete: Cascade`), `readAt` (default now). Unique `(announcementId, userId)`.

**`Event`** — evento/webinar.
`id` (PK), `title`, `description?` (`Text`), `eventType` (`EventType`, default `WEBINAR`), `date`, `endDate?`, `location?`, `maxSeats?`, `registrationUrl?`, `recordingUrl?`, `published` (default true), `isRegistrable` (default false), `availableSeats?`, `registrations` (default 0), `createdAt`, `updatedAt`.

### Video

**`VideoAsset`** — video caricato sul server o link esterno, riferibile da `Unit.videoUrl`.
`id` (PK), `title`, `filename`, `url`, `size?`, `mimeType` (default `"video/mp4"`), `createdAt`, `updatedAt`.
Gli upload salvano un **path relativo** (`/uploads/videos/…`); il client lo risolve con `resolveVideoUrl()` (`lib/api.ts`).

**`VideoPill`** — video pillola YouTube associata a un software.
`id` (PK), `title`, `description?`, `youtubeId` (unique), `softwareId` (FK → `Software`), `createdAt`.
*(Modello presente nello schema; la feature "video pillole" lato app è attualmente fuori perimetro — vedi [CLEANUP_LOG.md](./CLEANUP_LOG.md).)*

**`PricingPackage`** — pacchetto del listino prezzi.
`id` (PK), `name`, `slug` (unique), `description?`, `price?`, `priceNote?`, `features: String[]` (default `[]`), `highlighted` (default false), `order` (default 0), `active` (default true), `createdAt`, `updatedAt`.
*(Modello presente nello schema; non c'è un modulo backend dedicato — vedi [CLEANUP_LOG.md](./CLEANUP_LOG.md).)*

---

## 4. Mappa relazioni (sintetica)

```
Software 1───< Course 1───< Unit 1───< GuideReference >───? GuideCatalog
   │                          │  └──< Exercise
   │                          └──< UserProgress >─── User
   └──< CompanyInterest >─── Company
                              ├──< CompanyMembership >─── User
                              ├──< CompanyCourseAssignment >─── Course
User ──< UserCourseAssignment >─── Course
User ──< Certificate >─── Course
User ──< AnnouncementRead >─── Announcement
```
