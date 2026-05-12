# Serviform Academy — Documentazione

Piattaforma di formazione per i prodotti **EngView**, **Sysform**, **ProjectO** e **ServiformA**.
Monorepo con backend NestJS (`apps/api`) e frontend Next.js (`apps/web`).

> Questa cartella `docs/` è la "memoria" del progetto: leggila prima di sviluppare.
> Tutti i documenti sono in italiano e descrivono lo **stato attuale del codice**, non la storia.

---

## Indice dei documenti

| Documento | A cosa serve |
|---|---|
| **[ARCHITECTURE.md](./ARCHITECTURE.md)** | Stack, struttura del monorepo, moduli backend, pagine frontend, flusso dei dati, modello di accesso ai corsi. **Parti da qui.** |
| **[DEVELOPMENT.md](./DEVELOPMENT.md)** | Guida operativa allo sviluppo: setup, variabili d'ambiente, comandi, convenzioni del repo e **ricette passo-passo** ("come aggiungo un modulo / un endpoint / una pagina / una sezione admin / un campo al DB"). |
| **[DATABASE.md](./DATABASE.md)** | Schema Prisma spiegato modello per modello, enum, soft delete, **workflow delle migration** e trappole tipiche (drift schema/DB). |
| **[API.md](./API.md)** | Reference di tutti gli endpoint REST, raggruppati per modulo, con auth/ruolo richiesto e mappatura sul client `lib/api.ts`. |
| **[CLEANUP_LOG.md](./CLEANUP_LOG.md)** | Log storico del lavoro di pulizia/refactor (Fasi 1-5). Utile per capire *perché* certe cose sono come sono e cosa è ancora in sospeso. |
| **[INTEGRATION_GUIDE.md](./INTEGRATION_GUIDE.md)** | **Storico** — procedura con cui furono integrate le Fasi 1-4. Conservato come riferimento, non più operativo. |
| **[DOCUMENTAZIONE_COMPLETA.md](./DOCUMENTAZIONE_COMPLETA.md)** | Vecchio documento "tutto in uno" (v2.0, marzo 2026), ora **superato**: rimanda ai documenti sopra. |
| **[Web/](./Web/)** | Mappe tecniche di singole pagine del frontend (vedi sotto). |

### Mappe per pagina (`docs/Web/`)

| File | Pagina |
|---|---|
| [Web/PAGINA_INIZIALE.md](./Web/PAGINA_INIZIALE.md) | Homepage `/` |
| [Web/LOGIN.md](./Web/LOGIN.md) | `/auth/login` e `/auth/register` |
| [Web/BARRA_SUPERIORE.md](./Web/BARRA_SUPERIORE.md) | `Topbar` (navigazione) |
| [Web/DASHBOARD.md](./Web/DASHBOARD.md) | `/dashboard` |
| [Web/NEWSROOM.md](./Web/NEWSROOM.md) | `/newsroom` (comunicazioni + eventi) |

---

## Avvio rapido (TL;DR)

Prerequisiti: **Node.js 20+**, **pnpm**, **PostgreSQL 16** in esecuzione.

```bash
# 1. Backend (NestJS) — porta 3001
cd apps/api
cp ../../infra/.env.example .env      # poi correggi DATABASE_URL / JWT_SECRET
pnpm install
npx prisma migrate dev                # crea/aggiorna lo schema nel DB
npx prisma db seed                    # popola con dati di esempio
pnpm start:dev

# 2. Frontend (Next.js) — porta 3000
cd ../web
echo 'NEXT_PUBLIC_API_URL=http://localhost:3001' > .env.local
pnpm install
pnpm dev
```

Apri http://localhost:3000. In alternativa, `docker compose -f infra/docker-compose.yml up` avvia PostgreSQL + API.

Dettagli completi (env var, account di seed, troubleshooting): **[DEVELOPMENT.md](./DEVELOPMENT.md)**.

---

## "Dove guardo per…"

| Voglio… | Documento |
|---|---|
| Capire com'è fatto il progetto | [ARCHITECTURE.md](./ARCHITECTURE.md) |
| Avviarlo per la prima volta | [DEVELOPMENT.md](./DEVELOPMENT.md) § Setup |
| Aggiungere un endpoint / modulo backend | [DEVELOPMENT.md](./DEVELOPMENT.md) § Ricette + [API.md](./API.md) |
| Modificare lo schema del database | [DATABASE.md](./DATABASE.md) + [DEVELOPMENT.md](./DEVELOPMENT.md) § "Cambiare lo schema" |
| Aggiungere una pagina o una sezione admin | [DEVELOPMENT.md](./DEVELOPMENT.md) § Ricette |
| Sapere quali endpoint esistono | [API.md](./API.md) |
| Cambiare colori / font / layout | [DEVELOPMENT.md](./DEVELOPMENT.md) § Design system |
| Capire una pagina specifica del frontend | [Web/](./Web/) |
| Sapere cosa è ancora rotto / da fare | [CLEANUP_LOG.md](./CLEANUP_LOG.md) (Fasi 3-5) + [DEVELOPMENT.md](./DEVELOPMENT.md) § Problemi noti |
