import { Injectable } from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service'

export type CourseAccessState = 'HIDDEN' | 'VISIBLE_LOCKED' | 'ACTIVE' | 'EXPIRED'

export interface CourseAccessResult {
  state: CourseAccessState
  expiresAt: Date | null
  expiryLabel: string | null
}

/**
 * AccessControlService — unico punto di verità per la visibilità corso.
 *
 * Gerarchia (03_business_rules.md §3):
 *   1. publishState del corso
 *   2. policy azienda (CompanyCourseAssignment)
 *   3. override utente (UserCourseAssignment) — prevale sulla policy azienda
 *   4. verifica scadenza
 */
@Injectable()
export class AccessControlService {
  constructor(private readonly prisma: PrismaService) {}

  async resolveCourseAccess(userId: string, courseId: string): Promise<CourseAccessResult> {
    const now = new Date()

    const course = await this.prisma.course.findUnique({
      where: { id: courseId },
      select: { publishState: true },
    })

    if (!course || course.publishState === 'HIDDEN') return this.hidden()

    // Override utente — ha precedenza
    const userAssignment = await this.prisma.userCourseAssignment.findUnique({
      where: { userId_courseId: { userId, courseId } },
    })
    if (userAssignment) return this.resolveFromAssignment(userAssignment, now)

    // Policy azienda
    const membership = await this.prisma.companyMembership.findUnique({
      where: { userId },
      select: { companyId: true },
    })
    if (membership) {
      const companyAssignment = await this.prisma.companyCourseAssignment.findUnique({
        where: { companyId_courseId: { companyId: membership.companyId, courseId } },
      })
      if (companyAssignment) return this.resolveFromAssignment(companyAssignment, now)
    }

    // Nessuna assegnazione → comportamento di default basato su publishState
    if (course.publishState === 'PUBLISHED') {
      return { state: 'VISIBLE_LOCKED', expiresAt: null, expiryLabel: null }
    }
    return { state: 'VISIBLE_LOCKED', expiresAt: null, expiryLabel: null }
  }

  async resolveAllCoursesForUser(userId: string): Promise<Map<string, CourseAccessResult>> {
    const now = new Date()
    const result = new Map<string, CourseAccessResult>()

    const courses = await this.prisma.course.findMany({
      where: { deletedAt: null },
      select: { id: true, publishState: true },
    })

    const membership = await this.prisma.companyMembership.findUnique({
      where: { userId },
      select: { companyId: true },
    })

    const userAssignments = await this.prisma.userCourseAssignment.findMany({ where: { userId } })
    const userMap = new Map(userAssignments.map(a => [a.courseId, a]))

    const companyMap = new Map<string, any>()
    if (membership) {
      const companyAssignments = await this.prisma.companyCourseAssignment.findMany({
        where: { companyId: membership.companyId },
      })
      companyAssignments.forEach(a => companyMap.set(a.courseId, a))
    }

    for (const course of courses) {
      if (course.publishState === 'HIDDEN') {
        result.set(course.id, this.hidden())
        continue
      }
      const userAssignment = userMap.get(course.id)
      if (userAssignment) {
        result.set(course.id, this.resolveFromAssignment(userAssignment, now))
        continue
      }
      const companyAssignment = companyMap.get(course.id)
      if (companyAssignment) {
        result.set(course.id, this.resolveFromAssignment(companyAssignment, now))
        continue
      }
      result.set(course.id, { state: 'VISIBLE_LOCKED', expiresAt: null, expiryLabel: null })
    }

    return result
  }

  private hidden(): CourseAccessResult {
    return { state: 'HIDDEN', expiresAt: null, expiryLabel: null }
  }

  private resolveFromAssignment(
    assignment: { accessType: string; expiresAt: Date | null; startsAt: Date },
    now: Date,
  ): CourseAccessResult {
    if (assignment.accessType === 'HIDDEN') return this.hidden()
    if (assignment.accessType === 'LOCKED') {
      return { state: 'VISIBLE_LOCKED', expiresAt: null, expiryLabel: null }
    }
    // ACTIVE: verifica scadenza
    if (assignment.expiresAt && assignment.expiresAt < now) {
      return {
        state: 'EXPIRED',
        expiresAt: assignment.expiresAt,
        expiryLabel: assignment.expiresAt.toLocaleDateString('it-IT', {
          day: '2-digit', month: 'short', year: 'numeric',
        }),
      }
    }
    if (assignment.startsAt > now) {
      return { state: 'VISIBLE_LOCKED', expiresAt: null, expiryLabel: null }
    }
    return {
      state: 'ACTIVE',
      expiresAt: assignment.expiresAt ?? null,
      expiryLabel: assignment.expiresAt
        ? assignment.expiresAt.toLocaleDateString('it-IT', {
            day: '2-digit', month: 'short', year: 'numeric',
          })
        : null,
    }
  }
}
