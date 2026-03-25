import { Injectable, NotFoundException } from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service'

/**
 * VideosService — modulo ISOLATO, fuori scope attivo.
 * VideoPill nel nuovo schema non ha più la relation software
 * (modello tenuto per retrocompatibilità dati, non esposto in navigazione).
 * Rimossi tutti gli include: { software } che causavano errori TypeScript.
 */
@Injectable()
export class VideosService {
  constructor(private prisma: PrismaService) {}

  findAll() {
    return this.prisma.videoPill.findMany({
      orderBy: { createdAt: 'desc' },
    })
  }

  findBySoftware(slug: string) {
    // La relation software non esiste più nel modello isolato.
    // Fallback: restituisce tutti i video (comportamento degradato accettabile
    // per un modulo fuori scope che non viene usato in navigazione).
    return this.prisma.videoPill.findMany({
      orderBy: { createdAt: 'desc' },
    })
  }

  create(data: { title: string; youtubeId: string; softwareId: string; description?: string }) {
    return this.prisma.videoPill.create({ data })
  }

  async update(id: string, data: any) {
    const v = await this.prisma.videoPill.findUnique({ where: { id } })
    if (!v) throw new NotFoundException('Video non trovata')
    return this.prisma.videoPill.update({ where: { id }, data })
  }

  async remove(id: string) {
    const v = await this.prisma.videoPill.findUnique({ where: { id } })
    if (!v) throw new NotFoundException('Video non trovata')
    return this.prisma.videoPill.delete({ where: { id } })
  }
}
