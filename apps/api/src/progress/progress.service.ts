import { Injectable } from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service'
import { CertificatesService } from '../certificates/certificates.service'

// Filtro condiviso: esclude OVERVIEW dal conteggio progress
// Le unità OVERVIEW sono introduttive — l'utente non le "completa"
const LESSON_FILTER = { deletedAt: null, unitType: { not: 'OVERVIEW' as const } }

@Injectable()
export class ProgressService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly certificates: CertificatesService,
  ) {}

  async markCompleted(userId: string, unitId: string) {
    const progress = await this.prisma.userProgress.upsert({
      where: { userId_unitId: { userId, unitId } },
      update: { completed: true, completedAt: new Date(), viewedAt: new Date() },
      create: { userId, unitId, completed: true, completedAt: new Date(), viewedAt: new Date() },
    })

    // Auto-emissione badge/certificato quando l'utente completa l'ultima unità
    // del corso. È un'operazione idempotente e silenziosa: non deve mai
    // interrompere il flusso di markCompleted.
    try {
      await this.certificates.autoIssueIfCompleted(userId, unitId)
    } catch { /* ignore */ }

    return progress
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
      where: { course: { slug: courseSlug }, ...LESSON_FILTER },
      select: { id: true },
    })
    const total = units.length
    if (total === 0) return { total: 0, completed: 0, percent: 0 }
    const completed = await this.prisma.userProgress.count({
      where: { userId, completed: true, unitId: { in: units.map(u => u.id) } },
    })
    return { total, completed, percent: Math.round((completed / total) * 100) }
  }

  async getCompletedUnitIds(userId: string, courseSlug: string): Promise<string[]> {
    const units = await this.prisma.unit.findMany({
      where: { course: { slug: courseSlug }, ...LESSON_FILTER },
      select: { id: true },
    })
    const rows = await this.prisma.userProgress.findMany({
      where: { userId, completed: true, unitId: { in: units.map(u => u.id) } },
      select: { unitId: true },
    })
    return rows.map(r => r.unitId)
  }

  async getLastViewed(userId: string) {
    const p = await this.prisma.userProgress.findFirst({
      where: { userId, viewedAt: { not: null } },
      orderBy: { viewedAt: 'desc' },
      include: { unit: { include: { course: { include: { software: true } } } } },
    })
    if (!p) return null
    return {
      unitId: p.unitId,
      unitTitle: p.unit.title,
      unitSlug: p.unit.slug,
      courseTitle: p.unit.course.title,
      courseSlug: p.unit.course.slug,
      softwareName: p.unit.course.software?.name ?? null,
      softwareSlug: p.unit.course.software?.slug ?? null,
      viewedAt: p.viewedAt,
    }
  }

  async getDashboard(userId: string) {
    const [courses, lastViewed] = await Promise.all([
      this.getAllCourseProgressForUser(userId),
      this.getLastViewed(userId),
    ])
    return { courses, lastViewed }
  }

  async getAllCourseProgressForUser(userId: string) {
    // 1. Assegnazioni dirette all'utente
    const userAssignments = await this.prisma.userCourseAssignment.findMany({
      where: { userId },
      select: { courseId: true },
    })

    // 2. Assegnazioni tramite azienda (via CompanyMembership)
    const membership = await this.prisma.companyMembership.findUnique({
      where: { userId },
      select: { companyId: true },
    })
    let companyCourseIds: string[] = []
    if (membership) {
      const companyAssignments = await this.prisma.companyCourseAssignment.findMany({
        where: { companyId: membership.companyId },
        select: { courseId: true },
      })
      companyCourseIds = companyAssignments.map(a => a.courseId)
    }

    // 3. Corsi con progresso reale (copertura per admin e utenti senza assegnazioni esplicite)
    const progressRows = await this.prisma.userProgress.findMany({
      where: { userId, viewedAt: { not: null } },
      include: { unit: { select: { courseId: true } } },
    })
    const progressCourseIds = progressRows.map(p => p.unit.courseId)

    // 4. Unione e deduplicazione
    const allCourseIds = [...new Set([
      ...userAssignments.map(a => a.courseId),
      ...companyCourseIds,
      ...progressCourseIds,
    ])]
    if (!allCourseIds.length) return []

    // 5. Fetch corsi — nessun filtro deletedAt: i corsi su cui l'utente
    //    ha già lavorato devono sempre comparire nella dashboard
    const courses = await this.prisma.course.findMany({
      where: { id: { in: allCourseIds } },
      include: {
        software: true,
        units: { where: LESSON_FILTER, select: { id: true } },
      },
    })

    // 6. Calcolo progresso per ciascun corso
    const results: any[] = []
    for (const course of courses) {
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
        total: unitIds.length,
        completed,
        percent: unitIds.length === 0 ? 0 : Math.round((completed / unitIds.length) * 100),
      })
    }
    return results
  }
}
