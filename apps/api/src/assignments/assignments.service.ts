import { Injectable, NotFoundException, ConflictException } from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service'

@Injectable()
export class AssignmentsService {
  constructor(private readonly prisma: PrismaService) {}

  // ── Azienda ──────────────────────────────────────────────────────────────────

  async assignCourseToCompany(
    companyId: string,
    courseId: string,
    data: { accessType?: string; startsAt?: string; expiresAt?: string | null; notes?: string },
    createdBy: string,
  ) {
    const existing = await this.prisma.companyCourseAssignment.findUnique({
      where: { companyId_courseId: { companyId, courseId } },
    })
    if (existing) throw new ConflictException('Assegnazione già esistente per questa azienda')

    return this.prisma.companyCourseAssignment.create({
      data: {
        companyId,
        courseId,
        accessType: (data.accessType as any) ?? 'ACTIVE',
        startsAt: data.startsAt ? new Date(data.startsAt) : new Date(),
        expiresAt: data.expiresAt ? new Date(data.expiresAt) : null,
        notes: data.notes,
        createdBy,
      },
      include: {
        course: { select: { title: true, slug: true } },
        company: { select: { name: true } },
      },
    })
  }

  async updateCompanyAssignment(id: string, data: {
    accessType?: string
    expiresAt?: string | null
    notes?: string
  }) {
    return this.prisma.companyCourseAssignment.update({
      where: { id },
      data: {
        ...(data.accessType ? { accessType: data.accessType as any } : {}),
        expiresAt: data.expiresAt !== undefined
          ? (data.expiresAt ? new Date(data.expiresAt) : null)
          : undefined,
        notes: data.notes,
        updatedAt: new Date(),
      },
    })
  }

  async removeCompanyAssignment(id: string) {
    const a = await this.prisma.companyCourseAssignment.findUnique({ where: { id } })
    if (!a) throw new NotFoundException('Assegnazione non trovata')
    return this.prisma.companyCourseAssignment.delete({ where: { id } })
  }

  findCompanyAssignments(companyId: string) {
    return this.prisma.companyCourseAssignment.findMany({
      where: { companyId },
      include: { course: { include: { software: true } } },
      orderBy: { createdAt: 'desc' },
    })
  }

  // ── Utente (override) ────────────────────────────────────────────────────────

  async assignCourseToUser(
    userId: string,
    courseId: string,
    data: { accessType?: string; startsAt?: string; expiresAt?: string | null; notes?: string },
    createdBy: string,
  ) {
    return this.prisma.userCourseAssignment.upsert({
      where: { userId_courseId: { userId, courseId } },
      update: {
        accessType: (data.accessType as any) ?? 'ACTIVE',
        expiresAt: data.expiresAt !== undefined
          ? (data.expiresAt ? new Date(data.expiresAt) : null)
          : undefined,
        notes: data.notes,
        updatedAt: new Date(),
      },
      create: {
        userId,
        courseId,
        accessType: (data.accessType as any) ?? 'ACTIVE',
        startsAt: data.startsAt ? new Date(data.startsAt) : new Date(),
        expiresAt: data.expiresAt ? new Date(data.expiresAt) : null,
        notes: data.notes,
        createdBy,
      },
      include: {
        course: { select: { title: true, slug: true } },
        user: { select: { email: true, name: true } },
      },
    })
  }

  async removeUserAssignment(id: string) {
    const a = await this.prisma.userCourseAssignment.findUnique({ where: { id } })
    if (!a) throw new NotFoundException('Assegnazione non trovata')
    return this.prisma.userCourseAssignment.delete({ where: { id } })
  }

  findUserAssignments(userId: string) {
    return this.prisma.userCourseAssignment.findMany({
      where: { userId },
      include: { course: { include: { software: true } } },
      orderBy: { createdAt: 'desc' },
    })
  }
}
