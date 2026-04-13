import { Injectable, NotFoundException } from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service'

@Injectable()
export class CoursesService {
  constructor(private prisma: PrismaService) {}

  /**
   * Lista completa dei corsi (usata dall'admin e come fallback pubblico).
   * Nessun filtro aziendale.
   */
  findAll() {
    return this.prisma.course.findMany({
      where: { deletedAt: null },
      include: {
        software: true,
        units: { where: { deletedAt: null }, orderBy: { order: 'asc' } },
      },
      orderBy: { createdAt: 'desc' },
    })
  }

  /**
   * Lista dei corsi visibili nel portale per un utente.
   *
   * Regole:
   *  - se l'utente è ADMIN/TEAM_ADMIN → vede tutti i corsi (nessun filtro)
   *  - se l'utente appartiene ad un'azienda con `visibleSoftwareIds` non vuoto
   *    → restituisce solo i corsi dei software inclusi in quell'elenco
   *  - in tutti gli altri casi → comportamento di default (tutti i corsi)
   *
   * ⚠ Questo filtro si applica SOLO ai corsi / contenuti formativi.
   *    Comunicazioni ed Eventi non passano da qui e restano visibili a tutti.
   */
  async findVisibleForUser(userId: string, role: string) {
    if (role === 'ADMIN' || role === 'TEAM_ADMIN') return this.findAll()

    const membership = await this.prisma.companyMembership.findUnique({
      where: { userId },
      include: { company: { select: { visibleSoftwareIds: true } } },
    })

    const visibleIds = membership?.company?.visibleSoftwareIds || []
    if (!visibleIds.length) return this.findAll()

    return this.prisma.course.findMany({
      where: {
        deletedAt: null,
        softwareId: { in: visibleIds },
      },
      include: {
        software: true,
        units: { where: { deletedAt: null }, orderBy: { order: 'asc' } },
      },
      orderBy: { createdAt: 'desc' },
    })
  }

  findBySlug(slug: string) {
    return this.prisma.course.findUnique({
      where: { slug },
      include: {
        software: true,
        units: {
          where: { deletedAt: null },
          orderBy: { order: 'asc' },
          include: { guides: true, exercises: { orderBy: { order: 'asc' } } },
        },
      },
    })
  }

  create(data: {
    title: string
    slug: string
    description?: string
    objective?: string
    softwareId: string
    level?: string
    duration?: string
    available?: boolean
    publishState?: string
    thumbnailUrl?: string
    issuesBadge?: boolean
  }) {
    return this.prisma.course.create({ data: data as any })
  }

  async update(id: string, data: any) {
    const c = await this.prisma.course.findUnique({ where: { id } })
    if (!c) throw new NotFoundException('Corso non trovato')
    return this.prisma.course.update({ where: { id }, data })
  }

  async remove(id: string) {
    const c = await this.prisma.course.findUnique({ where: { id } })
    if (!c) throw new NotFoundException('Corso non trovato')
    return this.prisma.course.update({ where: { id }, data: { deletedAt: new Date() } })
  }
}
