import { NestFactory } from '@nestjs/core'
import { ValidationPipe } from '@nestjs/common'
import { AppModule } from './app.module'
import { HttpExceptionFilter } from './common/filters/http-exception.filter'

async function bootstrap() {
  const app = await NestFactory.create(AppModule)

  // ── CORS ─────────────────────────────────────────────────────────────────
  // In sviluppo: origin: true accetta qualsiasi origine (localhost:3000, 3001, ecc.)
  // In produzione: restringere a CORS_ORIGIN
  const isProd = process.env.NODE_ENV === 'production'
  app.enableCors({
    origin: isProd ? (process.env.CORS_ORIGIN || 'http://localhost:3000') : true,
    methods: ['GET', 'HEAD', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Accept'],
    credentials: true,
  })

  // ── Validazione globale ───────────────────────────────────────────────────
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: false, // false: non blocca campi extra nei payload
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  )

  // ── Filtro errori globale ─────────────────────────────────────────────────
  app.useGlobalFilters(new HttpExceptionFilter())

  const port = process.env.PORT || 3001
  await app.listen(port)
  console.log(`🚀 Serviform Academy API → http://localhost:${port}`)
}

bootstrap()
