import { NestFactory } from '@nestjs/core'
import { NestExpressApplication } from '@nestjs/platform-express'
import { ValidationPipe } from '@nestjs/common'
import { AppModule } from './app.module'
import { HttpExceptionFilter } from './common/filters/http-exception.filter'
import * as path from 'path'
import * as fs from 'fs'

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule)

  // CORS — accetta qualsiasi origin in sviluppo
  app.enableCors({
    origin: (origin, callback) => callback(null, true),
    methods: ['GET', 'HEAD', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Accept'],
    credentials: true,
  })

  // Validazione globale
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: false,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  )

  // Filtro errori globale
  app.useGlobalFilters(new HttpExceptionFilter())

  // Static: immagini
  const imgDir = path.resolve(process.env.UPLOAD_DIR || './uploads')
  if (!fs.existsSync(imgDir)) fs.mkdirSync(imgDir, { recursive: true })
  app.useStaticAssets(imgDir, { prefix: '/uploads' })

  // Static: video (sottocartella /uploads/videos)
  const vidDir = path.resolve(process.env.VIDEO_UPLOAD_DIR || './uploads/videos')
  if (!fs.existsSync(vidDir)) fs.mkdirSync(vidDir, { recursive: true })
  // Non serve un secondo useStaticAssets: /uploads già serve tutto il tree, incluso /uploads/videos

  const port = process.env.PORT || 3001
  await app.listen(port, '0.0.0.0')
  console.log(`🚀 Serviform Academy API → http://localhost:${port}`)
}
bootstrap()
