# Modifiche a apps/api/prisma/schema.prisma

## 1. Aggiungi il model VideoAsset (prima di VideoPill)

```prisma
model VideoAsset {
  id        String   @id @default(uuid())
  title     String
  filename  String
  url       String
  size      Int?
  mimeType  String   @default("video/mp4")
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}
```

## 2. Modifica GuideReference (rimuovi @unique su unitId, aggiungi order, cambia relazione)

PRIMA:
```prisma
model GuideReference {
  id        String @id @default(uuid())
  zendeskId String
  title     String
  url       String
  unitId    String @unique
  unit      Unit   @relation(fields: [unitId], references: [id])
}
```

DOPO:
```prisma
model GuideReference {
  id        String @id @default(uuid())
  zendeskId String
  title     String
  url       String
  order     Int    @default(0)
  unitId    String
  unit      Unit   @relation(fields: [unitId], references: [id])
}
```

## 3. Modifica il model Unit: cambia guide da singola a lista

PRIMA:
```prisma
  guide     GuideReference?
```

DOPO:
```prisma
  guides    GuideReference[]
```

## Dopo aver modificato lo schema, esegui:

```powershell
cd apps\api
npx prisma db execute --file .\prisma\migrations\video_catalog_and_multi_guides\migration.sql --schema .\prisma\schema.prisma
npx prisma generate
```

NON usare migrate dev per questa modifica — il DB viene aggiornato direttamente con il SQL.
