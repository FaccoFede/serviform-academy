import { Injectable, BadRequestException } from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service'

@Injectable()
export class CertificatesService {
  constructor(private prisma: PrismaService) {}

  async issue(userId: string, courseSlug: string) {
    const course = await this.prisma.course.findUnique({
      where: { slug: courseSlug },
      include: {
        units: { select: { id: true } }
      }
    })

    if (!course) throw new BadRequestException('Corso non trovato')

    const total = course.units.length

    const completed = await this.prisma.userProgress.count({
      where: {
        userId,
        completed: true,
        unitId: {
          in: course.units.map(u => u.id)
        }
      }
    })

    if (total === 0 || completed < total) {
      throw new BadRequestException('Corso non completato')
    }

    return this.prisma.certificate.upsert({
      where: {
        userId_courseId: {
          userId,
          courseId: course.id
        }
      },
      update: {},
      create: {
        userId,
        courseId: course.id
      }
    })
  }
}