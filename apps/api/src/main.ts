import { NestFactory } from '@nestjs/core'
import { ValidationPipe, Logger } from '@nestjs/common'
import { AppModule } from './app.module'
import { HttpExceptionFilter } from './common/filters/http-exception.filter'

async function bootstrap() {
  const app = await NestFactory.create(AppModule)
  const logger = new Logger('Bootstrap')

  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: false, // rilassato: frontend può inviare campi extra
    transform: true,
    transformOptions: { enableImplicitConversion: true },
  }))

  app.useGlobalFilters(new HttpExceptionFilter())

  // CORS — accetta richieste da qualsiasi origin in dev, dominio in prod
  const corsOrigins = process.env.CORS_ORIGIN
    ? process.env.CORS_ORIGIN.split(',').map(s => s.trim())
    : ['http://localhost:3000', 'http://127.0.0.1:3000']

  app.enableCors({
    origin: (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
      if (!origin) return callback(null, true) // same-origin / curl
      if (process.env.NODE_ENV !== 'production') return callback(null, true) // dev: aperto
      if (corsOrigins.includes(origin)) return callback(null, true)
      callback(new Error('CORS policy violation'))
    },
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
  })

  const port = process.env.PORT || 3001
  // Bind 0.0.0.0 — accessibile da tutti i dispositivi in rete
  await app.listen(port, '0.0.0.0')
  logger.log(`Serviform Academy API avviata su http://0.0.0.0:${port}`)
  logger.log(`  → locale:   http://localhost:${port}`)
}

bootstrap()
