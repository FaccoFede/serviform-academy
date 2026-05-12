import { Injectable, NotFoundException, ConflictException } from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service'

@Injectable()
export class AssignmentsService {
  constructor(private readonly prisma: PrismaService) {}

  findByCompany(companyId: string) {
    return this.prisma.companyCourseAssignment.findMany({ where: { companyId }, include: { course: { include: { software: true } } }, orderBy: { createdAt: 'desc' } })
  }

  async assignToCompany(companyId: string, courseId: string, data: any, createdBy: string) {
    const existing = await this.prisma.companyCourseAssignment.findUnique({ where: { companyId_courseId: { companyId, courseId } } })
    if (existing) throw new ConflictException('Assegnazione già esistente')
    return this.prisma.companyCourseAssignment.create({ data: { companyId, courseId, accessType: data.accessType ?? 'ACTIVE', startsAt: data.startsAt ? new Date(data.startsAt) : new Date(), expiresAt: data.expiresAt ? new Date(data.expiresAt) : null, notes: data.notes, createdBy }, include: { course: { select: { title: true, slug: true } } } })
  }

  async updateCompany(id: string, data: any) {
    return this.prisma.companyCourseAssignment.update({ where: { id }, data: { ...(data.accessType ? { accessType: data.accessType } : {}), expiresAt: data.expiresAt !== undefined ? (data.expiresAt ? new Date(data.expiresAt) : null) : undefined, notes: data.notes, updatedAt: new Date() } })
  }

  async removeCompany(id: string) {
    const a = await this.prisma.companyCourseAssignment.findUnique({ where: { id } })
    if (!a) throw new NotFoundException('Assegnazione non trovata')
    return this.prisma.companyCourseAssignment.delete({ where: { id } })
  }

  findByUser(userId: string) {
    return this.prisma.userCourseAssignment.findMany({ where: { userId }, include: { course: { include: { software: true } } }, orderBy: { createdAt: 'desc' } })
  }

  async assignToUser(userId: string, courseId: string, data: any, createdBy: string) {
    return this.prisma.userCourseAssignment.upsert({ where: { userId_courseId: { userId, courseId } }, update: { accessType: data.accessType ?? 'ACTIVE', expiresAt: data.expiresAt ? new Date(data.expiresAt) : null, notes: data.notes, updatedAt: new Date() }, create: { userId, courseId, accessType: data.accessType ?? 'ACTIVE', startsAt: data.startsAt ? new Date(data.startsAt) : new Date(), expiresAt: data.expiresAt ? new Date(data.expiresAt) : null, notes: data.notes, createdBy } })
  }

  async removeUser(id: string) {
    const a = await this.prisma.userCourseAssignment.findUnique({ where: { id } })
    if (!a) throw new NotFoundException('Assegnazione non trovata')
    return this.prisma.userCourseAssignment.delete({ where: { id } })
  }

  async bulkAssignToCompany(companyId: string, data: any, createdBy: string) {
    const courses: Array<{ courseId: string; expiresAt?: string }> = data.courses || []
    if (!courses.length) return { created: 0 }

    const records = courses.map(({ courseId, expiresAt }) => ({
      companyId,
      courseId,
      accessType: data.accessType ?? 'ACTIVE',
      startsAt: new Date(),
      expiresAt: expiresAt ? new Date(expiresAt) : null,
      notes: data.notes ?? null,
      createdBy,
    }))

    const result = await this.prisma.companyCourseAssignment.createMany({
      data: records,
      skipDuplicates: true,
    })
    return { created: result.count }
  }
}
