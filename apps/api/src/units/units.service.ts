import { Injectable, NotFoundException } from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service'

@Injectable()
export class UnitsService {
  constructor(private prisma: PrismaService) {}

  findByCourse(courseId: string) {
    return this.prisma.unit.findMany({
      where: { courseId, deletedAt: null },
      include: {
        guides: { orderBy: { order: 'asc' } },
        exercises: { orderBy: { order: 'asc' } },
      },
      orderBy: { order: 'asc' },
    })
  }

  async findBySlug(courseSlug: string, unitSlug: string) {
    const course = await this.prisma.course.findUnique({ where: { slug: courseSlug } })
    if (!course) throw new NotFoundException('Corso non trovato')

    const unit = await this.prisma.unit.findFirst({
      where: { courseId: course.id, slug: unitSlug, deletedAt: null },
      include: {
        guides: { orderBy: { order: 'asc' } },
        exercises: { orderBy: { order: 'asc' } },
        course: {
          include: {
            software: true,
            units: {
              where: { deletedAt: null },
              orderBy: { order: 'asc' },
              select: { id: true, title: true, slug: true, order: true, unitType: true, duration: true },
            },
          },
        },
      },
    })
    if (!unit) throw new NotFoundException('Unità non trovata')
    return unit
  }

  create(data: any) {
  // Genera slug automaticamente dal titolo se non fornito
  if (!data.slug && data.title) {
    const base = data.title
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')   // rimuove accenti
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '')
    data.slug = base + '-' + Date.now()
  }
  return this.prisma.unit.create({ data })
}

  async update(id: string, data: any) {
    const unit = await this.prisma.unit.findUnique({ where: { id } })
    if (!unit) throw new NotFoundException('Unità non trovata')
    return this.prisma.unit.update({ where: { id }, data })
  }

  async remove(id: string) {
    const unit = await this.prisma.unit.findUnique({ where: { id } })
    if (!unit) throw new NotFoundException('Unità non trovata')
    return this.prisma.unit.update({ where: { id }, data: { deletedAt: new Date() } })
  }
}
