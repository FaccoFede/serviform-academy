# Serviform Academy

Piattaforma di formazione per i prodotti **EngView**, **Sysform**, **ProjectO** e **ServiformA**.
Monorepo: backend **NestJS** in `apps/api`, frontend **Next.js** in `apps/web`, PostgreSQL + Prisma.

## Avvio rapido

Prerequisiti: Node.js 20+, pnpm, PostgreSQL 16.

```bash
# Backend — http://localhost:3001
cd apps/api
cp ../../infra/.env.example .env       # poi correggi DATABASE_URL / JWT_SECRET
pnpm install
npx prisma migrate dev
npx prisma db seed
pnpm start:dev

# Frontend — http://localhost:3000
cd ../web
echo 'NEXT_PUBLIC_API_URL=http://localhost:3001' > .env.local
pnpm install
pnpm dev
```

## Documentazione

Tutta la documentazione di progetto è in **[`docs/`](./docs/README.md)**:

- [`docs/ARCHITECTURE.md`](./docs/ARCHITECTURE.md) — struttura, moduli, modello di accesso ai corsi
- [`docs/DEVELOPMENT.md`](./docs/DEVELOPMENT.md) — setup, convenzioni, ricette di sviluppo
- [`docs/DATABASE.md`](./docs/DATABASE.md) — schema Prisma e migration
- [`docs/API.md`](./docs/API.md) — reference degli endpoint REST
- [`docs/Web/`](./docs/Web/) — mappe tecniche delle singole pagine frontend
- [`docs/CLEANUP_LOG.md`](./docs/CLEANUP_LOG.md) — storia del refactor e attività in sospeso
