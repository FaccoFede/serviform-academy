import { Injectable } from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service'

@Injectable()
export class GuidesService {

  constructor(private prisma: PrismaService) {}

  async create(data: {
    zendeskId: string
    title: string
    url: string
    unitId: string
  }) {
    return this.prisma.guideReference.create({
      data
    })
  }

  async findByUnit(unitId: string) {
    return this.prisma.guideReference.findUnique({
      where: { unitId }
    })
  }

}