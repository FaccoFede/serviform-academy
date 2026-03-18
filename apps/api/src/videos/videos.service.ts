import { Injectable } from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service'

@Injectable()
export class VideosService {

  constructor(private prisma: PrismaService) {}

  async create(data: {
    title: string
    youtubeId: string
    softwareId: string
    description?: string
  }) {

    return this.prisma.videoPill.create({
      data
    })

  }

  async findAll() {

    return this.prisma.videoPill.findMany({
      include: {
        software: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

  }

  async findBySoftware(softwareSlug: string) {

    return this.prisma.videoPill.findMany({
      where: {
        software: {
          slug: softwareSlug
        }
      },
      include: {
        software: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

  }

}