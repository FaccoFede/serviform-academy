import { Injectable, NotFoundException } from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service'

@Injectable()
export class VideosService {
  constructor(private prisma: PrismaService) {}

  findAll() { return this.prisma.videoPill.findMany({ include: { software: true }, orderBy: { createdAt: 'desc' } }) }

  findBySoftware(slug: string) {
    return this.prisma.videoPill.findMany({
      where: { software: { slug } }, include: { software: true }, orderBy: { createdAt: 'desc' },
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
