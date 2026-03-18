import { Injectable } from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service'

@Injectable()
export class ProgressService {
  constructor(private prisma: PrismaService) {}

  async markCompleted(userId: string, unitId: string) {
    return this.prisma.userProgress.upsert({
      where: {
        userId_unitId: {
          userId,
          unitId
        }
      },
      update: {
        completed: true,
        completedAt: new Date()
      },
      create: {
        userId,
        unitId,
        completed: true,
        completedAt: new Date()
      }
    })
  }

  async getCourseProgress(userId: string, courseSlug: string) {
    const units = await this.prisma.unit.findMany({
      where: {
        course: {
          slug: courseSlug
        }
      },
      select: { id: true }
    })

    const total = units.length

    const completed = await this.prisma.userProgress.count({
      where: {
        userId,
        completed: true,
        unitId: {
          in: units.map(u => u.id)
        }
      }
    })

    return {
      total,
      completed,
      percent: total === 0 ? 0 : Math.round((completed / total) * 100)
    }
  }
}