import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service'

@Injectable()
export class CertificatesService {
  constructor(private prisma: PrismaService) {}

  /**
   * Emette (o restituisce) il certificato se l'utente ha completato il corso.
   * Non scatena errori se esiste già — è idempotente.
   */
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
        unitId: { in: course.units.map((u) => u.id) },
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
      include: { course: { include: { software: true } } },
    })
  }

  /**
   * Versione automatica chiamata dal ProgressService ad ogni completamento.
   *
   * - Controlla se tutte le unità non-OVERVIEW sono completate.
   * - Emette il certificato se il corso ha `issuesBadge = true`.
   * - Non solleva errori: se le condizioni non sono soddisfatte, ritorna null.
   *   (Non deve interrompere il normale flusso di progresso.)
   */
  async autoIssueIfCompleted(userId: string, unitId: string): Promise<any | null> {
    const unit = await this.prisma.unit.findUnique({
      where: { id: unitId },
      select: { courseId: true },
    })
    if (!unit) return null

    const course = await this.prisma.course.findUnique({
      where: { id: unit.courseId },
      include: {
        units: {
          where: { deletedAt: null, unitType: { not: 'OVERVIEW' } },
          select: { id: true },
        },
      },
    })
    if (!course || !course.issuesBadge) return null
    if (course.units.length === 0) return null

    const completed = await this.prisma.userProgress.count({
      where: {
        userId,
        completed: true,
        unitId: { in: course.units.map((u) => u.id) },
      },
    })
    if (completed < course.units.length) return null

    // Tutte le unità completate e badge abilitato → emissione idempotente
    return this.prisma.certificate.upsert({
      where: { userId_courseId: { userId, courseId: course.id } },
      update: {},
      create: { userId, courseId: course.id },
    })
  }

  /** Certificati (= badge) dell'utente autenticato. */
  async findByUser(userId: string) {
    return this.prisma.certificate.findMany({
      where: { userId },
      include: { course: { include: { software: true } } },
      orderBy: { issuedAt: 'desc' },
    })
  }

  /** Lista COMPLETA di tutti i certificati — admin only. */
  async findAllForAdmin() {
    return this.prisma.certificate.findMany({
      include: {
        user: { select: { id: true, email: true, name: true, firstName: true, lastName: true } },
        course: { include: { software: true } },
      },
      orderBy: { issuedAt: 'desc' },
    })
  }

  /** Revoca un certificato (admin). */
  async revoke(id: string) {
    const c = await this.prisma.certificate.findUnique({ where: { id } })
    if (!c) throw new NotFoundException('Certificato non trovato')
    return this.prisma.certificate.delete({ where: { id } })
  }
}
