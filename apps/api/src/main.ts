import { NestFactory } from '@nestjs/core'
import { ValidationPipe, Logger } from '@nestjs/common'
import { AppModule } from './app.module'
import { HttpExceptionFilter } from './common/filters/http-exception.filter'

/**
 * Bootstrap dell'applicazione NestJS.
 *
 * Configurazione globale:
 * - ValidationPipe: valida automaticamente i DTO in ingresso
 * - HttpExceptionFilter: formatta tutte le risposte di errore
 * - CORS: abilita le richieste cross-origin dal frontend
 * - Prefisso API: opzionale, per versionamento futuro
 */
async function bootstrap() {
  const app = await NestFactory.create(AppModule)
  const logger = new Logger('Bootstrap')

  // Validazione globale dei DTO
  // whitelist: rimuove proprietà non definite nel DTO
  // forbidNonWhitelisted: restituisce errore se riceve campi extra
  // transform: converte automaticamente i tipi (es. string → number)
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  )

  // Filtro globale per le eccezioni
  app.useGlobalFilters(new HttpExceptionFilter())

  // CORS — permette al frontend Next.js di comunicare con l'API
  // In produzione, restringere l'origin al dominio effettivo
  app.enableCors({
    origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
    credentials: true,
  })

  // Porta configurabile via env
  const port = process.env.PORT || 3001

  await app.listen(port)
  logger.log(`Serviform Academy API avviata su http://localhost:${port}`)
}

bootstrap()
