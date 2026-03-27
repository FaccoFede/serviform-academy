import { Injectable, NotFoundException } from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service'

@Injectable()
export class AnnouncementsService {
  constructor(private readonly prisma: PrismaService) {}

  findPublished(section?: string) {
    const now = new Date()
    const where: any = {
      published: true,
      OR: [{ expiresAt: null }, { expiresAt: { gt: now } }],
    }
    if (section) where.section = section
    return this.prisma.announcement.findMany({
      where,
      orderBy: [{ isPinned: 'desc' }, { publishedAt: 'desc' }],
    } as any)
  }

  findAll(section?: string) {
    const where: any = {}
    if (section) where.section = section
    return this.prisma.announcement.findMany({
      where,
      orderBy: [{ isPinned: 'desc' }, { createdAt: 'desc' }],
    } as any)
  }

  findOne(id: string) {
    return this.prisma.announcement.findUnique({ where: { id } })
  }

  create(data: any, createdBy: string) {
    return this.prisma.announcement.create({
      data: {
        ...data,
        createdBy,
        publishedAt: data.published ? new Date() : undefined,
        isPinned: data.isPinned ?? false,
        section: data.section ?? 'NEWS',
      } as any,
    })
  }

  async update(id: string, data: any) {
    const a = await this.prisma.announcement.findUnique({ where: { id } })
    if (!a) throw new NotFoundException('Annuncio non trovato')
    const extra = data.published && !(a as any).publishedAt ? { publishedAt: new Date() } : {}
    return this.prisma.announcement.update({ where: { id }, data: { ...data, ...extra } as any })
  }

  async remove(id: string) {
    const a = await this.prisma.announcement.findUnique({ where: { id } })
    if (!a) throw new NotFoundException('Annuncio non trovato')
    return this.prisma.announcement.delete({ where: { id } })
  }
}
