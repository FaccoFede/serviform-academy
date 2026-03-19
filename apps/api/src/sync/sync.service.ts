import { Injectable, NotFoundException } from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service'
import { ImportVideoPillDto } from './dto/import-video-pill.dto'

/**
 * Service per la sincronizzazione di contenuti esterni.
 *
 * Gestisce l'import idempotente di video pillole:
 * - Se il youtubeId esiste → aggiorna titolo e descrizione
 * - Se non esiste → crea una nuova video pillola
 */
@Injectable()
export class SyncService {

  constructor(private readonly prisma: PrismaService) {}

  async importVideoPill(data: ImportVideoPillDto) {
    // Risolvi lo slug software nell'ID corrispondente
    const software = await this.prisma.software.findUnique({
      where: { slug: data.softwareSlug },
    })

    if (!software) {
      throw new NotFoundException(
        `Software con slug "${data.softwareSlug}" non trovato`,
      )
    }

    // Upsert: crea o aggiorna la video pillola
    return this.prisma.videoPill.upsert({
      where: { youtubeId: data.youtubeId },
      update: {
        title: data.title,
        description: data.description,
      },
      create: {
        title: data.title,
        youtubeId: data.youtubeId,
        description: data.description,
        softwareId: software.id,
      },
    })
  }
}
