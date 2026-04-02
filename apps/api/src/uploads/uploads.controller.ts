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
}
