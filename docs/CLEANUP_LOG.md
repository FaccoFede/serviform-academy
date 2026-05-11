# Cleanup log — riordino e manutenibilità

Questo documento traccia **ogni intervento** del lavoro di pulizia/refactor della codebase,
in modo da poter risalire a cosa è stato fatto, perché, e come tornare indietro.

- **Branch di lavoro:** `claude/cleanup-codebase-IgpWW`
- **Branch di backup (stato pre-pulizia, intoccato):** `backup/pre-cleanup-2026-05-11` — punta al commit `2bd3913`. Per recuperare qualunque file rimosso: `git checkout backup/pre-cleanup-2026-05-11 -- <percorso>`.
- **Piano completo di riferimento:** vedi l'audit consegnato (sezioni "Raccomandazioni per categoria" e "Roadmap pratica").

Convenzione: ogni voce indica **cosa**, **perché**, **rischio**, **come recuperare**.

---

## Fase 1 — Pulizia sicura (rischio basso, nessun cambio di comportamento atteso)

> Stato: **in corso**. Tutti gli elementi qui sotto sono stati verificati come *non referenziati*
> nel codice (grep su `import` / uso del simbolo) prima della rimozione.

### 1.1 — Backend: moduli morti

| Rimosso | Perché | Rischio | Recupero |
|---|---|---|---|
| `apps/api/src/videos/` (intera dir: `videos.module.ts`, `videos.service.ts`, `videos.controller.ts`, `dto/create-video-pill.dto.ts`, `*.spec.ts`) | `VideosModule` (gestione *VideoPill*) non è registrato in `app.module.ts` né importato da alcun modulo: codice mai istanziato. Sostituito da `video-assets/`. La pagina `apps/web/src/app/videos/page.tsx` già reindirizza a `/` e dichiara la feature "fuori perimetro". | Nessuno (mai eseguito). Se in futuro si vorrà riattivare le videopillole: recuperare da `backup/pre-cleanup-2026-05-11`. | `git checkout backup/pre-cleanup-2026-05-11 -- apps/api/src/videos` |
| `apps/api/src/sync/` (intera dir: `sync.module.ts`, `sync.service.ts`, `sync.controller.ts`, `dto/import-video-pill.dto.ts`, `*.spec.ts`) | `SyncModule` non registrato in `app.module.ts`; inoltre non importa `PrismaModule` (sarebbe non funzionante). Funzione `importVideoPill` sovrapposta a `imports/`. | Nessuno. | `git checkout backup/pre-cleanup-2026-05-11 -- apps/api/src/sync` |
| `apps/api/src/access-control/` (intera dir: `access-control.module.ts`, `access-control.service.ts`) | `AccessControlModule`/`AccessControlService` non importati da alcun modulo: morto. La logica di visibilità corso vive duplicata inline in `courses`/`progress` — sarà consolidata in Fase 2. | Nessuno ora. **Nota:** il file conteneva la versione "canonica" della logica di accesso; tenerlo presente in Fase 2 (consolidamento). | `git checkout backup/pre-cleanup-2026-05-11 -- apps/api/src/access-control` |
| `apps/api/src/app.controller.ts`, `apps/api/src/app.service.ts`, `apps/api/src/app.controller.spec.ts` | Scaffold di default NestJS (`GET /` → `"Hello World!"`). Non erano nemmeno registrati in `app.module.ts` (`imports:` non includeva `controllers`/`providers`), quindi già morti. Nessuna parte del frontend usa `GET /`. | Basso. Se serve un endpoint di health, andrà aggiunto esplicitamente (banale). | `git checkout backup/pre-cleanup-2026-05-11 -- apps/api/src/app.controller.ts apps/api/src/app.service.ts` |

> Nota: `app.module.ts` **non** è stato modificato: non conteneva riferimenti ai moduli/scaffold rimossi.

### 1.2 — Backend: test scaffold

| Rimosso | Perché | Rischio | Recupero |
|---|---|---|---|
| Tutti i `apps/api/src/**/*.spec.ts` "should be defined" (`certificates`, `users`, `progress`, `units`, `courses`, `guides`, `software`, ecc.) e `apps/api/test/app.e2e-spec.ts` | Sono lo scaffold di default Nest: non testano logica e, non iniettando `PrismaService`, **facevano fallire `pnpm test`**. Coverage reale = 0. | Nessuno (non davano garanzie). Test veri sono un obiettivo di Fase 5 (CI). | `git checkout backup/pre-cleanup-2026-05-11 -- apps/api/src apps/api/test` (poi rimuovere quelli che non servono) |
| Aggiunto `passWithNoTests: true` alla config Jest in `apps/api/package.json` | Senza file di test, Jest uscirebbe in errore ("No tests found"). Con questo flag `pnpm test` esce pulito. | Nessuno. | — |

### 1.3 — Frontend: route / componenti / CSS morti

| Rimosso | Perché | Rischio | Recupero |
|---|---|---|---|
| `apps/web/src/app/courses/slug/unit/` (intera dir: `page.tsx`, `UnitPage.module.css`) | Copia hard-coded della route dinamica `courses/[slug]/[unit]/`: irraggiungibile (Next instrada solo la versione dinamica). | Nessuno. | `git checkout backup/pre-cleanup-2026-05-11 -- "apps/web/src/app/courses/slug"` |
| `apps/web/src/app/courses/[slug]/[unit]/UnitPageClient.tsx` | Implementazione parallela della pagina unità **non importata** da `page.tsx` (che è autonomo e usa `ProtectedVideo`): codice morto. | Basso (file non importato → non entra nel build). Documentato qui per spot-check. | `git checkout backup/pre-cleanup-2026-05-11 -- "apps/web/src/app/courses/[slug]/[unit]/UnitPageClient.tsx"` |
| `apps/web/src/app/videos/VideosView.tsx`, `apps/web/src/app/videos/VideosView.module.css` | Non importati da `app/videos/page.tsx` (che è un semplice `redirect('/')`). Feature videopillole fuori perimetro. | Nessuno. | `git checkout backup/pre-cleanup-2026-05-11 -- "apps/web/src/app/videos/VideosView.tsx" "apps/web/src/app/videos/VideosView.module.css"` |
| `apps/web/src/app/api/courses/[slug]/route.ts` (e la dir `app/api/` se resta vuota) | Route API di Next che fa da proxy a `localhost:3001/courses/:slug` — ridondante con `lib/api.ts` (`api.courses.findBySlug`). Non usata. | Nessuno. | `git checkout backup/pre-cleanup-2026-05-11 -- "apps/web/src/app/api"` |
| `apps/web/src/app/globals.css` | Non importato da nessun file. `layout.tsx` importa `@/styles/globals.css` e `@/styles/responsive.css`. Era un avanzo del template Next. | Nessuno. | `git checkout backup/pre-cleanup-2026-05-11 -- "apps/web/src/app/globals.css"` |
| Componenti orfani: `components/ui/ImageUploader.tsx`, `components/ui/SoftwareTag.tsx` (+`SoftwareTag.module.css`), `components/ui/Hero.tsx` (+`Hero.module.css`), `components/ui/CourseProgressCard.tsx` (+`CourseProgressCard.module.css`), `components/layout/Rail.tsx` (+`Rail.module.css`), `components/layout/ClientShell.tsx`, `components/features/UnitContent.tsx` (+`UnitContent.module.css`), `components/features/VideoPlayer.tsx` | Nessun `import` in tutto `src/`. `VideoPlayer` era usato solo dalla route duplicata `courses/slug/unit/` rimossa al punto sopra. `ClientShell`/`Rail`: il layout reale usa `Topbar`+`Shell`. Le "Hero" in `dashboard`/`newsroom` sono commenti di sezione, non il componente `Hero`. | Nessuno. | `git checkout backup/pre-cleanup-2026-05-11 -- <percorso>` |
| Aggiornato `apps/web/src/components/ui/index.ts` | Rimossi gli `export` di `SoftwareTag` e `Hero` (componenti cancellati). | Nessuno. | — |
| File `*.module.css` non referenziati: `app/catalog/CatalogPage.module.css`, `app/communications/Communications.module.css`, `app/admin/AdminForm.module.css`, `app/admin/companies/Companies.module.css`, `app/admin/units/UnitsAdmin.module.css`, `app/admin/assignments/Assignments.module.css`, `app/admin/assignments/AssignmentsAdmin.module.css`, `app/auth/login/LoginPage.module.css` | Nessun file `.tsx`/`.ts` li importa (le pagine admin importano `../AdminPage.module.css` e `../table.module.css`; `catalog` importa `Catalog.module.css`; `communications` importa `CommunicationsPage.module.css`; `auth/login` importa `Login.module.css`). | Nessuno. | `git checkout backup/pre-cleanup-2026-05-11 -- <percorso>` |

### 1.4 — File `.md` "di cantiere" nel sorgente

Verificato che il contenuto di ogni patch è **già applicato** al codice prima della rimozione:

| Rimosso | Verifica fatta |
|---|---|
| `apps/web/src/lib/api_additions.md` | `certificates.my`, `uploads.image`, `Course.thumbnailUrl` presenti in `lib/api.ts`. |
| `apps/web/src/app/admin/AdminCrud_PATCH.md` | `customRender`, `onEdit`, `type: 'custom'` presenti in `components/features/AdminCrud.tsx`. |
| `apps/web/src/app/admin/UnitPage_PATCH.md` | Rendering multi-guida (`data.guides?.length > 0 || data.guide`) presente in `courses/[slug]/[unit]/UnitPageClient.tsx`/`page.tsx`. |
| `apps/web/src/components/features/UnitPage_guide_patch.md` | Idem (duplicato del precedente). |
| `apps/api/prisma/migrations/SCHEMA_CHANGES.md` | Modello `VideoAsset` e relazione 1:N `GuideReference` presenti in `prisma/schema.prisma`. |

### 1.5 — `lib/api.ts`: rimozione superficie morta

| Modifica | Perché |
|---|---|
| Rimossi i namespace `videos` e `pricing` da `apps/web/src/lib/api.ts` | Il backend non ha `VideosModule` (rimosso) né `PricingModule` (mai esistito): chiamare quegli endpoint avrebbe sempre dato 404. Nessun file usa `api.videos.*` o `api.pricing.*`. |

### 1.6 — `.gitignore`

| Modifica | Perché |
|---|---|
| `/.gitignore` ri-salvato in UTF-8 | Era codificato in UTF-16LE con BOM: Git non interpretava i pattern (di fatto inattivo). Contenuto invariato, solo encoding corretto. |
| Aggiunto `uploads/` ad `apps/api/.gitignore` | Evita che nuovi file caricati (immagini/video) finiscano versionati. **Nota:** i due `.mp4` già tracciati in `apps/api/uploads/videos/` restano tracciati (scelta concordata: nessuna riscrittura della history). |

### 1.7 — Non toccato in Fase 1 (deliberatamente)

- `apps/web/src/lib/courseAccess.ts` (0 import) **— attenzione: file rotto.** Contiene JSX (`CourseAccessBadge`) ma ha estensione `.ts`: `tsc` non lo compila (errori `TS1005`/`TS1161`). Non entra nel build di Next solo perché non è importato da nessuno. In **Fase 2**: o si rinomina in `.tsx` separando `CourseAccessBadge`, riusando `resolveCourseAccess`/`calculateRealProgress` come helper unici, oppure si rimuove e si estrae un helper nuovo. Lasciato ora per non perdere quella logica prima della decisione.
- `apps/web/src/lib/config.ts` (0 import): da decidere in **Fase 2** se adottarlo come fonte unica di `API_URL` o rimuoverlo.
- `apps/cms/` e `packages/` (solo `.gitkeep`): lasciati come placeholder; decisione in Fase 4.
- `apps/api/uploads/videos/*.mp4` (~51 MB): lasciati tracciati come concordato.
- `apps/api/fix-all.js`, `run-migration.js`, `prisma/scripts/*`, SQL sciolti in `prisma/migrations/`: intervento a rischio medio-alto, rimandato a **Fase 3** (richiede DB di sviluppo + verifica stato produzione).
- Pagine `communications/`, `communications-events/`, `events/`, `calendar/`: consolidamento in `newsroom` rimandato a **Fase 3** (cambia UX, richiede test manuale).
- `README` di root: scrittura rimandata a **Fase 4**.

### 1.8 — Verifiche eseguite a fine Fase 1

- `apps/api`: `pnpm install` → `npx prisma generate` → `pnpm build` (nest build) → **OK** (exit 0). `pnpm test` → **OK** (`No tests found, exiting with code 0` grazie a `passWithNoTests`).
- `apps/web`: `pnpm install` → `npx tsc --noEmit -p tsconfig.json` → **nessun errore introdotto** dalle rimozioni. (Gli unici errori `tsc` riguardano il pre-esistente `lib/courseAccess.ts`, file non importato — vedi 1.7.) `pnpm build` (next build) compila tutte le route; in questo ambiente fallisce solo l'ultimo step di ottimizzazione font perché non c'è accesso di rete a `fonts.googleapis.com` (limite dell'ambiente, non del codice).
- `pnpm lint` su `apps/api` **non eseguito come gate**: lo script è `eslint ... --fix`, che riscriverebbe quasi tutti i file `.ts` con auto-format non correlato a questa pulizia (≈250 problemi pre-esistenti di `no-unsafe-*` su `any`). Sistemare lint/format è un intervento a sé (Fase 5: rendere `lint` non distruttivo + CI). Le modifiche di auto-fix accidentalmente generate durante la verifica sono state annullate (`git checkout -- apps/api/src apps/api/test`).
- Nessun riferimento penzolante: `grep` su tutti i simboli rimossi (`ImageUploader`, `SoftwareTag`, `Hero`, `CourseProgressCard`, `ClientShell`, `Rail`, `UnitContent`, `VideoPlayer`, `VideosView`, `UnitPageClient`, `api.videos.*`, `api.pricing.*`) → nessun import residuo.

### 1.9 — Stato file dopo Fase 1

- 64 file rimossi (`git rm`) — di cui ~20 file stub `*.spec.ts`; 5 file modificati (`/.gitignore`, `apps/api/.gitignore`, `apps/api/package.json`, `apps/web/src/components/ui/index.ts`, `apps/web/src/lib/api.ts`); 1 file nuovo (`docs/CLEANUP_LOG.md`).
- `git checkout -- apps/api/src apps/api/test` usato per scartare gli auto-fix di eslint generati durante la verifica build (vedi 1.8); le rimozioni `git rm` non sono state toccate.

---

## Fase 2 — Riduzione duplicazione

_(non ancora iniziata)_

## Fase 3 — Consolidamento parti ambigue

_(non ancora iniziata)_

## Fase 4 — Struttura

_(non ancora iniziata)_

## Fase 5 — Regole anti-regressione

_(non ancora iniziata)_
