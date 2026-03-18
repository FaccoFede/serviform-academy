import { Injectable } from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service'

@Injectable()
export class SyncService {
  constructor(private prisma: PrismaService) {}

  async importVideoPill(data: {
    title: string
    youtubeId: string
    description?: string
    softwareSlug: string
  }) {
    const software = await this.prisma.software.findUnique({
      where: { slug: data.softwareSlug }
    })

    if (!software) {
      throw new Error('Software non trovato')
    }

    return this.prisma.videoPill.upsert({
      where: {
        youtubeId: data.youtubeId
      },
      update: {
        title: data.title,
        description: data.description
      },
      create: {
        title: data.title,
        youtubeId: data.youtubeId,
        description: data.description,
        softwareId: software.id
      }
    })
  }
}