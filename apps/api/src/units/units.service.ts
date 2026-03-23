import { Injectable, NotFoundException } from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service'

@Injectable()
export class UnitsService {
  constructor(private prisma: PrismaService) {}

  findByCourse(courseId: string) {
    return this.prisma.unit.findMany({
      where: { courseId, deletedAt: null },
      orderBy: { order: 'asc' },
      include: { guide: true, exercises: { orderBy: { order: 'asc' } } },
    })
  }

  async findBySlug(courseSlug: string, unitSlug: string) {
    return this.prisma.unit.findFirst({
      where: { slug: unitSlug, course: { slug: courseSlug }, deletedAt: null },
      include: {
        guide: true,
        exercises: { orderBy: { order: 'asc' } },
        course: { include: { software: true, units: { where: { deletedAt: null }, orderBy: { order: 'asc' } } } },
      },
    })
  }

  async create(data: { title: string; order: number; courseId: string; subtitle?: string; duration?: string; unitType?: string; content?: string }) {
    let slug = data.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
    let counter = 1
    while (await this.prisma.unit.findFirst({ where: { slug, courseId: data.courseId } })) {
      slug = slug.replace(/-\d+$/, '') + '-' + counter++
    }
    return this.prisma.unit.create({ data: { ...data, slug } as any })
  }

  async update(id: string, data: any) {
    const u = await this.prisma.unit.findUnique({ where: { id } })
    if (!u) throw new NotFoundException('Unita non trovata')
    return this.prisma.unit.update({ where: { id }, data })
  }

  async remove(id: string) {
    const u = await this.prisma.unit.findUnique({ where: { id } })
    if (!u) throw new NotFoundException('Unita non trovata')
    return this.prisma.unit.update({ where: { id }, data: { deletedAt: new Date() } })
  }
}
