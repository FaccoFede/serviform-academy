import {
  Controller, Post, UseGuards, UseInterceptors,
  UploadedFile, BadRequestException, Request,
} from '@nestjs/common'
import { FileInterceptor } from '@nestjs/platform-express'
import { memoryStorage } from 'multer'
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard'
import * as path from 'path'
import * as fs from 'fs'

const UPLOAD_DIR = process.env.UPLOAD_DIR || './uploads'
const MAX_SIZE_BYTES = 5 * 1024 * 1024
const ALLOWED_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp']

@Controller('uploads')
export class UploadsController {
  @Post('image')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(
    FileInterceptor('file', {
      storage: memoryStorage(),
      limits: { fileSize: MAX_SIZE_BYTES },
    }),
  )
  async uploadImage(@UploadedFile() file: Express.Multer.File, @Request() req: any) {
    if (!file) throw new BadRequestException('Nessun file ricevuto')
    if (!ALLOWED_TYPES.includes(file.mimetype)) {
      throw new BadRequestException(
        `Tipo file non supportato: ${file.mimetype}. Usa JPEG, PNG, GIF o WebP.`,
      )
    }

    const uploadPath = path.resolve(UPLOAD_DIR)
    if (!fs.existsSync(uploadPath)) fs.mkdirSync(uploadPath, { recursive: true })

    // crypto.randomUUID() è disponibile nativamente in Node.js 14.17+ — nessuna dipendenza esterna
    const ext = path.extname(file.originalname).toLowerCase() || '.jpg'
    const filename = `img_${crypto.randomUUID()}${ext}`
    const filePath = path.join(uploadPath, filename)

    fs.writeFileSync(filePath, file.buffer)

    const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'
    const url = `${baseUrl}/uploads/${filename}`

    return { url, filename, size: file.size, mimetype: file.mimetype }
  }

  @Post('badge')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(
    FileInterceptor('file', {
      storage: memoryStorage(),
      limits: { fileSize: 1 * 1024 * 1024 },
    }),
  )
  async uploadBadge(@UploadedFile() file: Express.Multer.File) {
    if (!file) throw new BadRequestException('Nessun file ricevuto')
    if (file.mimetype !== 'image/svg+xml') {
      throw new BadRequestException(
        `Tipo file non supportato: ${file.mimetype}. Usa SVG (image/svg+xml).`,
      )
    }

    const badgeDir = path.resolve(UPLOAD_DIR, 'badges')
    if (!fs.existsSync(badgeDir)) fs.mkdirSync(badgeDir, { recursive: true })

    const filename = `badge_${crypto.randomUUID()}.svg`
    fs.writeFileSync(path.join(badgeDir, filename), file.buffer)

    const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'
    const url = `${baseUrl}/uploads/badges/${filename}`

    return { url, filename }
  }

  @Post('banner')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(
    FileInterceptor('file', {
      storage: memoryStorage(),
      limits: { fileSize: 2 * 1024 * 1024 },
    }),
  )
  async uploadBanner(@UploadedFile() file: Express.Multer.File) {
    if (!file) throw new BadRequestException('Nessun file ricevuto')
    const ALLOWED_BANNER_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
    if (!ALLOWED_BANNER_TYPES.includes(file.mimetype)) {
      throw new BadRequestException(
        `Tipo file non supportato: ${file.mimetype}. Usa JPEG, PNG o WebP.`,
      )
    }

    const bannerDir = path.resolve(UPLOAD_DIR, 'banners')
    if (!fs.existsSync(bannerDir)) fs.mkdirSync(bannerDir, { recursive: true })

    const ext = path.extname(file.originalname).toLowerCase() || '.jpg'
    const filename = `banner_${crypto.randomUUID()}${ext}`
    fs.writeFileSync(path.join(bannerDir, filename), file.buffer)

    const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'
    const url = `${baseUrl}/uploads/banners/${filename}`

    return { url, filename }
  }
}
