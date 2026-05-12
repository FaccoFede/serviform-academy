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

  findVisibleForUser(_userId: string, _role: string) {
    return this.findAll()
  }

  findBySlug(slug: string) {
    return this.prisma.course.findFirst({
      where: { slug, deletedAt: null },
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

  async create(data: {
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
    // Se esiste un corso soft-deleted con lo stesso slug, rimuovilo fisicamente
    // per liberare il vincolo di unicità e permettere la ricreazione
    const softDeleted = await this.prisma.course.findFirst({ where: { slug: data.slug, deletedAt: { not: null } } })
    if (softDeleted) {
      const unitIds = (await this.prisma.unit.findMany({
        where: { courseId: softDeleted.id },
        select: { id: true },
      })).map(u => u.id)

      await this.prisma.$transaction([
        this.prisma.userProgress.deleteMany({ where: { unitId: { in: unitIds } } }),
        this.prisma.exercise.deleteMany({ where: { unitId: { in: unitIds } } }),
        this.prisma.guideReference.deleteMany({ where: { unitId: { in: unitIds } } }),
        this.prisma.unit.deleteMany({ where: { courseId: softDeleted.id } }),
        this.prisma.certificate.deleteMany({ where: { courseId: softDeleted.id } }),
        this.prisma.userCourseAssignment.deleteMany({ where: { courseId: softDeleted.id } }),
        this.prisma.companyCourseAssignment.deleteMany({ where: { courseId: softDeleted.id } }),
        this.prisma.course.delete({ where: { id: softDeleted.id } }),
      ])
    }

    return this.prisma.course.create({ data: data as any })
  }

  async update(id: string, data: any) {
    const c = await this.prisma.course.findFirst({ where: { id, deletedAt: null } })
    if (!c) throw new NotFoundException('Corso non trovato')
    return this.prisma.course.update({ where: { id }, data })
  }

  async remove(id: string) {
    const c = await this.prisma.course.findFirst({ where: { id, deletedAt: null } })
    if (!c) throw new NotFoundException('Corso non trovato')
    return this.prisma.course.update({ where: { id }, data: { deletedAt: new Date() } })
  }
}
