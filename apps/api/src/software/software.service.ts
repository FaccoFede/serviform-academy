import { Injectable } from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service'

@Injectable()
export class SoftwareService {

  constructor(private prisma: PrismaService) {}

  async findAll() {
    return this.prisma.software.findMany({
      orderBy: {
        name: "asc"
      }
    })
  }

  async create(data: {
    name: string
    slug: string
  }) {
    return this.prisma.software.create({
      data
    })
  }

}