import { Injectable, BadRequestException } from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service'

@Injectable()
export class CertificatesService {
  constructor(private prisma: PrismaService) {}

  async issue(userId: string, courseSlug: string) {
    const course = await this.prisma.course.findUnique({
      where: { slug: courseSlug },
      include: {
        units: {
          where: { deletedAt: null, unitType: { not: 'OVERVIEW' } },
          select: { id: true },
        },
      },
    })

    if (!course) throw new BadRequestException('Corso non trovato')

    const total = course.units.length
    if (total === 0) throw new BadRequestException('Il corso non ha unità completabili')

    const completed = await this.prisma.userProgress.count({
      where: {
        userId,
        completed: true,
        unitId: { in: course.units.map(u => u.id) },
      },
    })

    if (completed < total) {
      throw new BadRequestException(
        `Corso non ancora completato: ${completed}/${total} unità completate`,
      )
    }

    return this.prisma.certificate.upsert({
      where: { userId_courseId: { userId, courseId: course.id } },
      update: {},
      create: { userId, courseId: course.id },
      include: {
        course: {
          include: { software: true },
        },
      },
    })
  }

  /** Restituisce tutti i certificati dell'utente con dettagli corso e software */
  async findByUser(userId: string) {
    return this.prisma.certificate.findMany({
      where: { userId },
      include: {
        course: {
          include: { software: true },
        },
      },
      orderBy: { issuedAt: 'desc' },
    })
  }
}
