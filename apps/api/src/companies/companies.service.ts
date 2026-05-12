import { Injectable, NotFoundException, ConflictException } from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service'

function pickCompanyScalars(input: any) {
  const out: any = {}
  if (input.name !== undefined) out.name = input.name
  if (input.slug !== undefined) out.slug = input.slug
  if (input.contractType !== undefined) out.contractType = input.contractType
  if (input.notes !== undefined) out.notes = input.notes
  return out
}

@Injectable()
export class CompaniesService {
  constructor(private readonly prisma: PrismaService) {}

  findAll() {
    return this.prisma.company.findMany({
      where: { deletedAt: null },
      include: {
        _count: { select: { members: true, courseAssignments: true } },
      },
      orderBy: { name: 'asc' },
    })
  }

  findById(id: string) {
    return this.prisma.company.findFirst({
      where: { id, deletedAt: null },
      include: {
        members: { include: { user: { select: { id: true, email: true, name: true, role: true } } } },
        courseAssignments: { include: { course: { select: { id: true, title: true, slug: true } } } },
      },
    })
  }

  async create(data: any) {
    const existing = await this.prisma.company.findFirst({ where: { slug: data.slug, deletedAt: null } })
    if (existing) throw new ConflictException('Slug già esistente')

    const softDeleted = await this.prisma.company.findFirst({ where: { slug: data.slug, deletedAt: { not: null } } })
    if (softDeleted) {
      await this.prisma.$transaction([
        this.prisma.companyMembership.deleteMany({ where: { companyId: softDeleted.id } }),
        this.prisma.companyCourseAssignment.deleteMany({ where: { companyId: softDeleted.id } }),
        this.prisma.company.delete({ where: { id: softDeleted.id } }),
      ])
    }

    const scalars = pickCompanyScalars(data)
    return this.prisma.company.create({
      data: {
        ...scalars,
        assistanceExpiresAt: data.assistanceExpiresAt ? new Date(data.assistanceExpiresAt) : undefined,
      },
    })
  }

  async update(id: string, data: any) {
    const c = await this.prisma.company.findFirst({ where: { id, deletedAt: null } })
    if (!c) throw new NotFoundException('Azienda non trovata')

    const scalars = pickCompanyScalars(data)
    const assistanceExpiresAt =
      data.assistanceExpiresAt === null
        ? null
        : data.assistanceExpiresAt
          ? new Date(data.assistanceExpiresAt)
          : undefined

    return this.prisma.company.update({
      where: { id },
      data: {
        ...scalars,
        ...(assistanceExpiresAt !== undefined && { assistanceExpiresAt }),
        updatedAt: new Date(),
      },
    })
  }

  async remove(id: string) {
    const c = await this.prisma.company.findFirst({ where: { id, deletedAt: null } })
    if (!c) throw new NotFoundException('Azienda non trovata')
    return this.prisma.company.update({ where: { id }, data: { deletedAt: new Date() } })
  }
}
