import { Injectable } from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service'

@Injectable()
export class CoursesService {

  constructor(private prisma: PrismaService) {}

  async findAll() {
  return this.prisma.course.findMany({
    include: {
      software: true
    },
    orderBy: {
      createdAt: "desc"
    }
  })
}

  async findBySlug(slug: string) {
  return this.prisma.course.findUnique({
    where: { slug },
    include: {
      software: true,
      units: {
        orderBy: { order: "asc" }
      }
    }
  })
}

  async create(data: {
    title: string
    slug: string
    description?: string
    softwareId: string
  }) {
    return this.prisma.course.create({
      data
    })
  }

}