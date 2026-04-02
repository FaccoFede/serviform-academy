import { Injectable, NotFoundException } from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service'
import * as path from 'path'
import * as fs from 'fs'

const UPLOAD_DIR = process.env.VIDEO_UPLOAD_DIR || './uploads/videos'

@Injectable()
export class VideoAssetsService {
  constructor(private prisma: PrismaService) {}

  findAll() {
    return this.prisma.videoAsset.findMany({
      orderBy: { createdAt: 'desc' },
    })
  }

  async upload(file: Express.Multer.File, title: string) {
    // Assicura che la cartella esista
    const dir = path.resolve(UPLOAD_DIR)
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true })

    // Nome univoco basato su timestamp + nome originale sanificato
    const safeName = file.originalname.replace(/[^a-zA-Z0-9._-]/g, '_')
    const filename = `${Date.now()}_${safeName}`
    const filePath = path.join(dir, filename)

    fs.writeFileSync(filePath, file.buffer)

    // URL pubblico — servito dallo static middleware
    const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'
    const url = `${baseUrl}/uploads/videos/${filename}`

    return this.prisma.videoAsset.create({
      data: {
        title,
        filename,
        url,
        size: file.size,
        mimeType: file.mimetype,
      },
    })
  }

  async remove(id: string) {
    const asset = await this.prisma.videoAsset.findUnique({ where: { id } })
    if (!asset) throw new NotFoundException('Video non trovato')

    // Rimuovi il file fisico
    const filePath = path.resolve(UPLOAD_DIR, asset.filename)
    if (fs.existsSync(filePath)) {
      try { fs.unlinkSync(filePath) } catch {}
    }

    return this.prisma.videoAsset.delete({ where: { id } })
  }
}
