import { Injectable, NotFoundException } from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service'

@Injectable()
export class CoursesService {
  constructor(private prisma: PrismaService) {}

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
