# Serviform Academy — API Reference

Backend NestJS. Base URL di sviluppo: `http://localhost:3001` (override con `PORT` lato API e `NEXT_PUBLIC_API_URL` lato frontend).

> Questo documento elenca le rotte così come sono definite nei controller (`apps/api/src/**/*.controller.ts`) e come sono consumate dal client `apps/web/src/lib/api.ts`. Quando aggiungi/cambi una rotta, aggiorna **entrambi** i posti e questo file.

## Convenzioni

- **Auth**: `Authorization: Bearer <accessToken>` (ottenuto da `/auth/login` o `/auth/register`).
  - *(nessuna)* = rotta pubblica.
  - *Auth* = serve un utente loggato (`JwtAuthGuard`).
  - *ADMIN* = serve `JwtAuthGuard` + `RolesGuard` con `@Roles('ADMIN', 'TEAM_ADMIN')`.
- **Validazione**: i body sono validati da `ValidationPipe` globale (`whitelist: true`, `transform: true`). I moduli con `dto/` hanno regole `class-validator`; gli altri accettano `body: any` (validazione minima).
- **Client**: la colonna "Client `lib/api.ts`" indica il metodo da usare dal frontend. Non chiamare gli endpoint con `fetch()` diretto.

## Formato errori

Tutte le risposte di errore passano da `HttpExceptionFilter` e hanno forma:

```json
{
  "statusCode": 400,
  "message": "Il titolo deve avere almeno 3 caratteri",
  "error": "Bad Request",
  "path": "/courses",
  "timestamp": "2026-05-12T10:30:00.000Z"
}
```

`message` può essere una stringa o un array di stringhe (errori `class-validator`). Il client (`lib/api.ts`) le concatena. Su `401` il client cancella il token e reindirizza a `/auth/login`.

---

## Auth — `/auth`

| Method | Path | Auth | Body | Descrizione | Client |
|---|---|---|---|---|---|
| POST | `/auth/register` | — | `{ email, password, name? }` | Crea utente, ritorna `{ accessToken, user }` | `api.auth.register(email, password, name?)` |
| POST | `/auth/login` | — | `{ email, password }` | Login, ritorna `{ accessToken, user }` | `api.auth.login(email, password)` |
| GET | `/auth/profile` | Auth | — | Profilo dell'utente corrente (incl. `membership.company`) | `api.auth.profile()` |
| PATCH | `/auth/profile` | Auth | `{ name?, firstName?, lastName?, email? }` | Aggiorna i dati del profilo | `api.auth.updateProfile(data)` |
| PATCH | `/auth/change-password` | Auth | `{ currentPassword, newPassword }` | Cambio password (risponde `401` se la password attuale è errata) | `api.auth.changePassword(cur, new)` |
| POST | `/auth/promote-admin` | Auth | — | Promuove l'utente corrente ad ADMIN (utility di bootstrap) | `api.auth.promoteAdmin()` |

## Software — `/software`

| Method | Path | Auth | Descrizione | Client |
|---|---|---|---|---|
| GET | `/software` | — | Lista software | `api.software.findAll()` |
| GET | `/software/:slug` | — | Dettaglio software | `api.software.findBySlug(slug)` |
| POST | `/software` | ADMIN | Crea software | `api.software.create(data)` |
| PUT | `/software/:id` | ADMIN | Modifica software | `api.software.update(id, data)` |
| DELETE | `/software/:id` | ADMIN | Elimina (soft delete) | `api.software.remove(id)` |

## Courses — `/courses`

| Method | Path | Auth | Descrizione | Client |
|---|---|---|---|---|
| GET | `/courses` | — | Lista completa (catalogo "marketing"/admin, nessun filtro azienda) | `api.courses.findAll()` |
| GET | `/courses/portal` | Auth | Lista filtrata per `visibleSoftwareIds` dell'azienda dell'utente (admin → tutti) | `api.courses.findForPortal()` |
| GET | `/courses/:slug` | — | Dettaglio corso con software e unità | `api.courses.findBySlug(slug)` |
| POST | `/courses` | ADMIN | Crea corso | `api.courses.create(data)` |
| PUT | `/courses/:id` | ADMIN | Modifica corso | `api.courses.update(id, data)` |
| DELETE | `/courses/:id` | ADMIN | Elimina (soft delete) | `api.courses.remove(id)` |

> ⚠ La rotta `portal` è definita **prima** di `:slug` nel controller, altrimenti Nest interpreterebbe `portal` come uno slug.

## Units — `/units`

| Method | Path | Auth | Body | Descrizione | Client |
|---|---|---|---|---|---|
| GET | `/units/course/:courseId` | — | — | Unità di un corso (per id corso) | `api.units.findByCourse(courseId)` |
| GET | `/units/:courseSlug/:unitSlug` | — | — | Dettaglio unità (incl. guide ed esercizi) | `api.units.findBySlug(courseSlug, unitSlug)` |
| POST | `/units` | ADMIN | dati unità (`durationHours`/`durationMinutes` → backend formatta `duration`) | Crea unità (assegna `order`) | `api.units.create(data)` |
| POST | `/units/course/:courseId/reorder` | ADMIN | `{ unitIds: string[] }` | Riordina le unità (OVERVIEW resta a 0) | `api.units.reorder(courseId, unitIds)` |
| PUT | `/units/:id` | ADMIN | dati unità | Modifica unità | `api.units.update(id, data)` |
| DELETE | `/units/:id` | ADMIN | — | Elimina (soft delete) | `api.units.remove(id)` |

## Guides — `/guides` (guide collegate alle unità)

| Method | Path | Auth | Body | Descrizione | Client |
|---|---|---|---|---|---|
| GET | `/guides/unit/:unitId` | — | — | Guide di un'unità | `api.guides.findByUnit(unitId)` |
| POST | `/guides` | ADMIN | `{ unitId, title, url, zendeskId?, catalogId?, order? }` | Crea guida | `api.guides.create(data)` |
| PUT | `/guides/:id` | ADMIN | dati guida | Modifica guida | — |
| DELETE | `/guides/:id` | ADMIN | — | Elimina guida | `api.guides.remove(id)` |
| DELETE | `/guides/unit/:unitId/all` | ADMIN | — | Elimina tutte le guide di un'unità (usato prima di un re-save in blocco) | `api.guides.removeAllByUnit(unitId)` |

## Guide Catalog — `/guide-catalog` (catalogo centralizzato Zendesk)

| Method | Path | Auth | Body | Descrizione | Client |
|---|---|---|---|---|---|
| GET | `/guide-catalog` | Auth | — | Lista guide del catalogo | `api.guideCatalog.findAll()` |
| POST | `/guide-catalog` | ADMIN | `{ url, title?, zendeskId? }` (titolo recuperato dalla pagina se omesso) | Aggiunge una guida al catalogo | `api.guideCatalog.create(data)` |
| PUT | `/guide-catalog/:id` | ADMIN | dati guida | Modifica guida del catalogo | `api.guideCatalog.update(id, data)` |
| POST | `/guide-catalog/:id/refresh-title` | ADMIN | — | Ricarica il titolo dalla pagina Zendesk | `api.guideCatalog.refreshTitle(id)` |
| DELETE | `/guide-catalog/:id` | ADMIN | — | Rimuove dal catalogo (i riferimenti nelle unità si scollegano: `catalogId → null`) | `api.guideCatalog.remove(id)` |

## Exercises — `/exercises`

| Method | Path | Auth | Body | Descrizione | Client |
|---|---|---|---|---|---|
| GET | `/exercises` | ADMIN | — | Tutte le esercitazioni | `api.exercises.findAll()` |
| GET | `/exercises/unit/:unitId` | — | — | Esercitazioni di un'unità | `api.exercises.findByUnit(unitId)` |
| PUT | `/exercises/unit/:unitId/save-all` | ADMIN | `{ exercises: [...] }` | Sostituisce in blocco le esercitazioni dell'unità | `api.exercises.saveAll(unitId, exercises)` |
| GET | `/exercises/:id` | — | — | Dettaglio esercitazione | — |
| POST | `/exercises` | ADMIN | `{ unitId, title, description?, htmlUrl?, evdUrl?, order? }` | Crea esercitazione | `api.exercises.create(data)` |
| PUT | `/exercises/:id` | ADMIN | dati esercitazione | Modifica | `api.exercises.update(id, data)` |
| DELETE | `/exercises/:id` | ADMIN | — | Elimina | `api.exercises.remove(id)` |

## Progress — `/progress` (tutte richiedono Auth)

| Method | Path | Body | Descrizione | Client |
|---|---|---|---|---|
| POST | `/progress/complete` | `{ unitId }` | Segna un'unità come completata | `api.progress.complete(unitId)` |
| POST | `/progress/viewed` | `{ unitId }` | Segna un'unità come vista | `api.progress.viewed(unitId)` |
| GET | `/progress/course/:courseSlug` | — | Progresso dell'utente su un corso | `api.progress.getCourseProgress(slug)` |
| GET | `/progress/course/:courseSlug/completed-units` | — | ID delle unità completate del corso | `api.progress.getCompletedUnits(slug)` |
| GET | `/progress/dashboard` | — | Dati aggregati per `/dashboard` (KPI, ultimi corsi…) | `api.progress.getDashboard()` |
| GET | `/progress/last-viewed` | — | Ultima unità vista (per "riprendi") | `api.progress.getLastViewed()` |
| GET | `/progress/all` | — | Tutto il progresso dell'utente | `api.progress.getAll()` |

## Certificates — `/certificates` (richiede Auth)

| Method | Path | Auth | Body | Descrizione | Client |
|---|---|---|---|---|---|
| POST | `/certificates/issue` | Auth | `{ courseSlug }` | Emette l'attestato per il corso (se completato e `issuesBadge`) | `api.certificates.issue(slug)` |
| GET | `/certificates/my` | Auth | — | Attestati dell'utente corrente | `api.certificates.my()` |
| GET | `/certificates/admin/all` | ADMIN | — | Tutti gli attestati emessi | `api.certificates.findAllAdmin()` |
| DELETE | `/certificates/:id` | ADMIN | — | Revoca un attestato | `api.certificates.revoke(id)` |

## Announcements — `/announcements` (comunicazioni / newsroom)

| Method | Path | Auth | Body | Descrizione | Client |
|---|---|---|---|---|---|
| GET | `/announcements` | Auth | — | Comunicazioni pubblicate, con campo `read` per l'utente | `api.announcements.findPublished()` |
| GET | `/announcements/public` | — | — | Stessa lista senza auth (`read` sempre false) | `api.announcements.findPublic()` |
| GET | `/announcements/admin/all` | ADMIN | — | Tutte (incluse non pubblicate) | `api.announcements.findAll()` |
| GET | `/announcements/:id` | Auth | — | Dettaglio comunicazione | — |
| PATCH | `/announcements/:id/read` | Auth | — | Segna come letta per l'utente corrente | `api.announcements.markRead(id)` |
| POST | `/announcements` | ADMIN | dati comunicazione | Crea | `api.announcements.create(data)` |
| PUT | `/announcements/:id` | ADMIN | dati comunicazione | Modifica | `api.announcements.update(id, data)` |
| DELETE | `/announcements/:id` | ADMIN | — | Elimina | `api.announcements.remove(id)` |

## Events — `/events`

| Method | Path | Auth | Body | Descrizione | Client |
|---|---|---|---|---|---|
| GET | `/events` | — | — | Eventi pubblicati | `api.events.findAll()` |
| GET | `/events/upcoming` | — | — | Eventi futuri | `api.events.findUpcoming()` |
| GET | `/events/past` | — | — | Eventi passati | `api.events.findPast()` |
| GET | `/events/admin/all` | ADMIN | — | Tutti (inclusi non pubblicati) | `api.events.findAllAdmin()` |
| GET | `/events/:id` | — | — | Dettaglio evento | `api.events.findOne(id)` |
| POST | `/events` | ADMIN | dati evento | Crea | `api.events.create(data)` |
| PUT | `/events/:id` | ADMIN | dati evento | Modifica | `api.events.update(id, data)` |
| DELETE | `/events/:id` | ADMIN | — | Elimina | `api.events.remove(id)` |

## Companies — `/companies` (tutte ADMIN)

| Method | Path | Body | Descrizione | Client |
|---|---|---|---|---|
| GET | `/companies` | — | Lista aziende | `api.companies.findAll()` |
| GET | `/companies/:id` | — | Dettaglio azienda | `api.companies.findById(id)` |
| POST | `/companies` | dati azienda | Crea azienda | `api.companies.create(data)` |
| PUT | `/companies/:id` | dati azienda | Modifica azienda | `api.companies.update(id, data)` |
| DELETE | `/companies/:id` | — | Elimina (soft delete) | `api.companies.remove(id)` |
| PUT | `/companies/:id/preferences` | `{ visibleSoftwareIds: string[] }` | Imposta i software visibili nel portale (vuoto = nessun filtro) | `api.companies.setPreferences(id, ids)` |

## Users — `/users` (tutte ADMIN)

| Method | Path | Body | Descrizione | Client |
|---|---|---|---|---|
| GET | `/users` | — | Lista utenti | `api.users.findAll()` |
| GET | `/users/:id` | — | Dettaglio utente | `api.users.findById(id)` |
| POST | `/users` | dati utente | Crea utente | `api.users.create(data)` |
| PUT | `/users/:id` | dati utente | Modifica utente | `api.users.update(id, data)` |
| DELETE | `/users/:id` | — | Elimina (soft delete) | `api.users.remove(id)` |

## Assignments — `/assignments` (tutte ADMIN)

| Method | Path | Body | Descrizione | Client |
|---|---|---|---|---|
| GET | `/assignments/company/:id` | — | Corsi assegnati a un'azienda | `api.assignments.findByCompany(id)` |
| POST | `/assignments/company/:cid/course/:rid` | `{ accessType?, startsAt?, expiresAt?, notes? }` | Assegna un corso a un'azienda | `api.assignments.assignToCompany(cid, rid, data)` |
| PUT | `/assignments/company/:id` | dati assegnazione | Modifica un'assegnazione azienda | `api.assignments.updateCompany(id, data)` |
| DELETE | `/assignments/company/:id` | — | Rimuove un'assegnazione azienda | `api.assignments.removeCompany(id)` |
| GET | `/assignments/user/:id` | — | Corsi assegnati a un utente | `api.assignments.findByUser(id)` |
| POST | `/assignments/user/:uid/course/:cid` | `{ accessType?, startsAt?, expiresAt?, notes? }` | Assegna un corso a un utente | `api.assignments.assignToUser(uid, cid, data)` |
| DELETE | `/assignments/user/:id` | — | Rimuove un'assegnazione utente | `api.assignments.removeUser(id)` |

## Video Assets — `/video-assets`

| Method | Path | Auth | Body | Descrizione | Client |
|---|---|---|---|---|---|
| GET | `/video-assets` | ADMIN | — | Tutti i video asset | `api.videoAssets.findAll()` |
| GET | `/video-assets/public` | Auth | — | Video asset disponibili (per le pagine corso) | `api.videoAssets.findPublic()` |
| POST | `/video-assets/upload` | ADMIN | `multipart/form-data` (campo `file`) | Carica un file video → salvato in `/uploads/videos/...` | *(form dedicato in admin)* |
| POST | `/video-assets/external` | ADMIN | `{ title, url }` | Registra un video da URL esterno | `api.videoAssets.createExternal(title, url)` |
| PUT | `/video-assets/:id` | ADMIN | dati video | Modifica | `api.videoAssets.update(id, data)` |
| DELETE | `/video-assets/:id` | ADMIN | — | Elimina | `api.videoAssets.remove(id)` |

> Gli URL relativi restituiti vanno passati per `resolveVideoUrl()` (in `lib/api.ts`) prima dell'uso.

## Uploads — `/uploads`

| Method | Path | Auth | Body | Descrizione | Client |
|---|---|---|---|---|---|
| POST | `/uploads/image` | Auth | `multipart/form-data` (campo `file`) | Carica un'immagine, ritorna `{ url, filename }` (URL servito da `/uploads/...`) | `api.uploads.image(file, token)` |

## Imports — `/imports` (tutte ADMIN)

| Method | Path | Body | Descrizione | Client |
|---|---|---|---|---|
| POST | `/imports/csv` | `multipart/form-data` (campo `file` + `type`: `companies` \| `users`) | Import CSV massivo di aziende o utenti | `api.imports.uploadCsv(file, type, token)` |

---

## Verifica rapida

Il seed (`prisma db seed`) **non crea utenti**: registrane uno e, se serve un admin, promuovilo (vedi [DEVELOPMENT.md](./DEVELOPMENT.md) § "Creare il primo admin").

```bash
# Registra un utente (il primo accesso può poi essere promosso ad ADMIN)
curl -X POST http://localhost:3001/auth/register \
  -H 'Content-Type: application/json' \
  -d '{"email":"dev@example.com","password":"Password123!","name":"Dev"}'
# → { "accessToken": "...", "user": { ... } }

# Promuovi l'utente loggato ad ADMIN
curl -X POST http://localhost:3001/auth/promote-admin -H 'Authorization: Bearer <TOKEN>'

# Profilo
curl http://localhost:3001/auth/profile -H 'Authorization: Bearer <TOKEN>'

# Lista corsi (pubblica)
curl http://localhost:3001/courses
```
