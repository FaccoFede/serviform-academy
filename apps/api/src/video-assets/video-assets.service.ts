import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service'
import * as path from 'path'
import * as fs from 'fs'

const UPLOAD_DIR = process.env.VIDEO_UPLOAD_DIR || './uploads/videos'

/**
 * VideoAssetsService — catalogo video centralizzato dell'Academy.
 *
 * Due modalità di archiviazione, entrambe nel DB (tabella VideoAsset):
 *
 *  1) UPLOAD FILE — l'admin carica un MP4/WebM/OGG. Il file va nel volume
 *     condiviso dell'API (`UPLOAD_DIR`), che viene esposto come statico su
 *     `/uploads/videos/...`. Il campo `url` nel DB viene salvato come
 *     PATH RELATIVO (es. `/uploads/videos/123_intro.mp4`).
 *     In questo modo:
 *      - i client risolvono la URL prefissando NEXT_PUBLIC_API_URL,
 *      - non si creano URL "hardcoded a localhost" che rompono quando
 *        l'API è raggiungibile da un altro PC / dominio.
 *
 *  2) URL ESTERNO — l'admin registra semplicemente un link (YouTube, Vimeo,
 *     Bunny, MP4 pubblico, ecc.). Il file NON è nel filesystem dell'API,
 *     l'URL viene salvato così com'è.
 *
 * Questa doppia modalità risolve il problema "i video sono in una cartella
 * locale non accessibile dagli altri PC": chiunque può caricare su un host
 * esterno e registrare l'URL.
 */
@Injectable()
export class VideoAssetsService {
  constructor(private prisma: PrismaService) {}

  findAll() {
    return this.prisma.videoAsset.findMany({
      orderBy: { createdAt: 'desc' },
    })
  }

  /** Upload di un file video locale — salva su disco e registra a catalogo */
  async upload(file: Express.Multer.File, title: string) {
    const dir = path.resolve(UPLOAD_DIR)
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true })

    const safeName = file.originalname.replace(/[^a-zA-Z0-9._-]/g, '_')
    const filename = `${Date.now()}_${safeName}`
    const filePath = path.join(dir, filename)
    fs.writeFileSync(filePath, file.buffer)

    // ⚠ URL relativo — il client lo risolverà contro NEXT_PUBLIC_API_URL.
    // Prima qui veniva costruito un URL assoluto basato su NEXT_PUBLIC_API_URL
    // (env di frontend) che lato server è sempre undefined → risultato:
    // "http://localhost:3001/...", non funzionante da altri PC.
    const url = `/uploads/videos/${filename}`

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

  /**
   * Registrazione di un URL esterno (YouTube / Vimeo / MP4 remoto / ecc.)
   * senza upload di file. Il "filename" è solo una label informativa.
   */
  async createExternal(data: { title: string; url: string }) {
    if (!data.url?.trim()) throw new BadRequestException('URL obbligatorio')
    if (!data.title?.trim()) throw new BadRequestException('Titolo obbligatorio')
    const url = data.url.trim()

    // Label breve derivata dall'host (YouTube, Vimeo, Bunny, Esterno…)
    let label = 'Esterno'
    try {
      const host = new URL(url).hostname.replace(/^www\./, '')
      label = host
    } catch { /* ignore */ }

    return this.prisma.videoAsset.create({
      data: {
        title: data.title.trim(),
        filename: label,
        url,
        size: null,
        mimeType: 'external/link',
      },
    })
  }

  async update(id: string, data: { title?: string; url?: string }) {
    const asset = await this.prisma.videoAsset.findUnique({ where: { id } })
    if (!asset) throw new NotFoundException('Video non trovato')
    return this.prisma.videoAsset.update({
      where: { id },
      data: {
        title: data.title ?? asset.title,
        url: data.url ?? asset.url,
      },
    })
  }

  async remove(id: string) {
    const asset = await this.prisma.videoAsset.findUnique({ where: { id } })
    if (!asset) throw new NotFoundException('Video non trovato')

    // Rimuove il file fisico solo se si tratta di un upload locale
    const isLocal = asset.url?.startsWith('/uploads/') || asset.mimeType !== 'external/link'
    if (isLocal && asset.filename && !asset.filename.includes('/')) {
      const filePath = path.resolve(UPLOAD_DIR, asset.filename)
      if (fs.existsSync(filePath)) {
        try { fs.unlinkSync(filePath) } catch { /* ignore */ }
      }
    }

    return this.prisma.videoAsset.delete({ where: { id } })
  }
}
