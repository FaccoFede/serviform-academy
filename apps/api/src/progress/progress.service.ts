import { Injectable } from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service'

export interface CourseProgressItem {
  courseId: string
  courseTitle: string
  courseSlug: string
  softwareName: string | null
  softwareSlug: string | null
  softwareColor: string | null
  total: number
  completed: number
  percent: number
}

@Injectable()
export class ProgressService {
  constructor(private readonly prisma: PrismaService) {}

  async markCompleted(userId: string, unitId: string) {
    return this.prisma.userProgress.upsert({
      where: { userId_unitId: { userId, unitId } },
      update: { completed: true, completedAt: new Date(), viewedAt: new Date() },
      create: { userId, unitId, completed: true, completedAt: new Date(), viewedAt: new Date() },
    })
  }

  async markViewed(userId: string, unitId: string) {
    return this.prisma.userProgress.upsert({
      where: { userId_unitId: { userId, unitId } },
      update: { viewedAt: new Date() },
      create: { userId, unitId, completed: false, viewedAt: new Date() },
    })
  }

  async getCourseProgress(userId: string, courseSlug: string) {
    const units = await this.prisma.unit.findMany({
      where: { course: { slug: courseSlug }, deletedAt: null },
      select: { id: true },
    })

    const total = units.length
    if (total === 0) return { total: 0, completed: 0, percent: 0 }

    const completed = await this.prisma.userProgress.count({
      where: { userId, completed: true, unitId: { in: units.map(u => u.id) } },
    })

    return { total, completed, percent: Math.round((completed / total) * 100) }
  }

  /**
   * Restituisce l'array degli unitId completati per un corso.
   * Usato dal frontend per pre-popolare il ProgressContext al caricamento.
   * Senza questo, il Set in memoria si azzera ad ogni navigazione tra pagine.
   */
  async getCompletedUnitIds(userId: string, courseSlug: string): Promise<string[]> {
    const units = await this.prisma.unit.findMany({
      where: { course: { slug: courseSlug }, deletedAt: null },
      select: { id: true },
    })

    const unitIds = units.map(u => u.id)

    const completed = await this.prisma.userProgress.findMany({
      where: { userId, completed: true, unitId: { in: unitIds } },
      select: { unitId: true },
    })

    return completed.map(p => p.unitId)
  }

  async getLastViewed(userId: string) {
    const progress = await this.prisma.userProgress.findFirst({
      where: { userId, viewedAt: { not: null } },
      orderBy: { viewedAt: 'desc' },
      include: {
        unit: {
          include: { course: { include: { software: true } } },
        },
      },
    })

    if (!progress) return null

    return {
      unitId: progress.unitId,
      unitTitle: progress.unit.title,
      unitSlug: progress.unit.slug,
      courseId: progress.unit.courseId,
      courseTitle: progress.unit.course.title,
      courseSlug: progress.unit.course.slug,
      softwareName: progress.unit.course.software?.name ?? null,
      softwareSlug: progress.unit.course.software?.slug ?? null,
      viewedAt: progress.viewedAt,
    }
  }

  async getAllCourseProgressForUser(userId: string): Promise<CourseProgressItem[]> {
    const viewed = await this.prisma.userProgress.findMany({
      where: { userId, viewedAt: { not: null } },
      include: { unit: { select: { courseId: true } } },
    })

    const courseIds = [...new Set(viewed.map(p => p.unit.courseId))]
    if (courseIds.length === 0) return []

    const courses = await this.prisma.course.findMany({
      where: { id: { in: courseIds }, deletedAt: null },
      include: {
        software: true,
        units: { where: { deletedAt: null }, select: { id: true } },
      },
    })

    const results: CourseProgressItem[] = []

    for (const course of courses) {
      const total = course.units.length
      const unitIds = course.units.map(u => u.id)

      const completed = await this.prisma.userProgress.count({
        where: { userId, completed: true, unitId: { in: unitIds } },
      })

      results.push({
        courseId: course.id,
        courseTitle: course.title,
        courseSlug: course.slug,
        softwareName: course.software?.name ?? null,
        softwareSlug: course.software?.slug ?? null,
        softwareColor: course.software?.color ?? null,
        total,
        completed,
        percent: total === 0 ? 0 : Math.round((completed / total) * 100),
      })
    }

    return results
  }
}
