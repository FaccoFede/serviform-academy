import { Injectable, NotFoundException } from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service'

@Injectable()
export class AnnouncementsService {
  constructor(private readonly prisma: PrismaService) {}

  findPublished() {
    const now = new Date()
    return this.prisma.announcement.findMany({ where: { published: true, OR: [{ expiresAt: null }, { expiresAt: { gt: now } }] }, orderBy: { publishedAt: 'desc' } })
  }

  findAll() { return this.prisma.announcement.findMany({ orderBy: { createdAt: 'desc' } }) }

  create(data: any, createdBy: string) {
    return this.prisma.announcement.create({ data: { ...data, createdBy, publishedAt: data.published ? new Date() : undefined } })
  }

  async update(id: string, data: any) {
    const a = await this.prisma.announcement.findUnique({ where: { id } })
    if (!a) throw new NotFoundException('Annuncio non trovato')
    const extra = data.published && !a.publishedAt ? { publishedAt: new Date() } : {}
    return this.prisma.announcement.update({ where: { id }, data: { ...data, ...extra } })
  }

  async remove(id: string) {
    const a = await this.prisma.announcement.findUnique({ where: { id } })
    if (!a) throw new NotFoundException('Annuncio non trovato')
    return this.prisma.announcement.delete({ where: { id } })
  }
}
