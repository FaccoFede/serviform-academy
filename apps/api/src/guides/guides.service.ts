import { Injectable, NotFoundException } from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service'

@Injectable()
export class GuidesService {
  constructor(private prisma: PrismaService) {}

  /** Restituisce tutte le guide di un'unità ordinate per order */
  findByUnit(unitId: string) {
    return this.prisma.guideReference.findMany({
      where: { unitId },
      orderBy: { order: 'asc' },
    })
  }

  /** Crea una nuova guida per un'unità */
  create(data: {
    unitId: string
    zendeskId?: string
    title: string
    url: string
    order?: number
    catalogId?: string | null
  }) {
    return this.prisma.guideReference.create({
      data: {
        unitId: data.unitId,
        zendeskId: data.zendeskId || '',
        title: data.title,
        url: data.url,
        order: data.order ?? 0,
        catalogId: data.catalogId || null,
      },
    })
  }

  /** Aggiorna una guida esistente */
  async update(
    id: string,
    data: { zendeskId?: string; title?: string; url?: string; order?: number },
  ) {
    const guide = await this.prisma.guideReference.findUnique({ where: { id } })
    if (!guide) throw new NotFoundException('Guida non trovata')
    return this.prisma.guideReference.update({ where: { id }, data })
  }

  /** Elimina una singola guida */
  async remove(id: string) {
    const guide = await this.prisma.guideReference.findUnique({ where: { id } })
    if (!guide) throw new NotFoundException('Guida non trovata')
    return this.prisma.guideReference.delete({ where: { id } })
  }

  /** Elimina tutte le guide di un'unità */
  removeAllByUnit(unitId: string) {
    return this.prisma.guideReference.deleteMany({ where: { unitId } })
  }

  /**
   * Salva le guide di un'unità in blocco:
   * elimina le esistenti e ricrea tutte quelle fornite.
   * Usato dall'admin unità quando salva il form completo.
   */
  async saveAll(
    unitId: string,
    guides: { zendeskId: string; title: string; url: string; order?: number }[],
  ) {
    await this.removeAllByUnit(unitId)
    if (!guides.length) return []
    return this.prisma.guideReference.createMany({
      data: guides.map((g, i) => ({
        unitId,
        zendeskId: g.zendeskId,
        title: g.title,
        url: g.url,
        order: g.order ?? i,
      })),
    })
  }
}
