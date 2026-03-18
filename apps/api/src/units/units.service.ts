import { Injectable } from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service'
import { CreateUnitDto } from './dto/create-unit.dto'
import { UnitResponseDto } from './dto/unit-response.dto'

@Injectable()
export class UnitsService {

  constructor(private prisma: PrismaService) {}

  async findByCourse(courseId: string) {
    return this.prisma.unit.findMany({
      where: { courseId },
      orderBy: { order: 'asc' }
    })
  }

  async create(data: CreateUnitDto) {

    let baseSlug = data.title
      .toLowerCase()
      .replace(/\s+/g, "-")

    let slug = baseSlug
    let counter = 1

    while (true) {

      const existing = await this.prisma.unit.findFirst({
        where: {
          slug,
          courseId: data.courseId
        }
      })

      if (!existing) break

      slug = `${baseSlug}-${counter}`
      counter++
    }

    return this.prisma.unit.create({
      data: {
        ...data,
        slug
      }
    }) as Promise<UnitResponseDto>

  }

  async findBySlug(courseSlug: string, unitSlug: string) {

  return this.prisma.unit.findFirst({
    where: {
      slug: unitSlug,
      course: {
        slug: courseSlug
      }
    },
    include: {
      guide: true,
      course: {
        include: {
          units: {
            orderBy: { order: "asc" }
          }
        }
      }
    }
  })

}

}