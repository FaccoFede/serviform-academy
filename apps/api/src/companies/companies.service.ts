import { Injectable, NotFoundException, ConflictException } from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service'

@Injectable()
export class CompaniesService {
  constructor(private readonly prisma: PrismaService) {}

  findAll() {
    return this.prisma.company.findMany({
      where: { deletedAt: null },
      include: {
        interests: { include: { software: true } },
        _count: { select: { members: true, courseAssignments: true } },
      },
      orderBy: { name: 'asc' },
    })
  }

  findById(id: string) {
    return this.prisma.company.findFirst({
      where: { id, deletedAt: null },
      include: {
        interests: { include: { software: true } },
        members: {
          include: { user: { select: { id: true, email: true, name: true, role: true } } },
        },
        courseAssignments: {
          include: { course: { select: { id: true, title: true, slug: true } } },
        },
      },
    })
  }

  async create(data: {
    name: string
    slug: string
    contractType?: string
    assistanceExpiresAt?: string
    notes?: string
    softwareIds?: string[]
  }) {
    const existing = await this.prisma.company.findFirst({
      where: { slug: data.slug, deletedAt: null },
    })
    if (existing) throw new ConflictException('Slug azienda già esistente')

    const { softwareIds, assistanceExpiresAt, ...rest } = data
    return this.prisma.company.create({
      data: {
        ...rest,
        assistanceExpiresAt: assistanceExpiresAt ? new Date(assistanceExpiresAt) : undefined,
        interests: softwareIds?.length
          ? { create: softwareIds.map(softwareId => ({ softwareId })) }
          : undefined,
      },
      include: { interests: { include: { software: true } } },
    })
  }

  async update(id: string, data: {
    name?: string
    contractType?: string
    assistanceExpiresAt?: string | null
    notes?: string
    softwareIds?: string[]
  }) {
    const company = await this.prisma.company.findFirst({ where: { id, deletedAt: null } })
    if (!company) throw new NotFoundException('Azienda non trovata')

    const { softwareIds, assistanceExpiresAt, ...rest } = data
    return this.prisma.$transaction(async tx => {
      if (softwareIds !== undefined) {
        await tx.companyInterest.deleteMany({ where: { companyId: id } })
        if (softwareIds.length) {
          await tx.companyInterest.createMany({
            data: softwareIds.map(softwareId => ({ companyId: id, softwareId })),
            skipDuplicates: true,
          })
        }
      }
      return tx.company.update({
        where: { id },
        data: {
          ...rest,
          assistanceExpiresAt:
            assistanceExpiresAt === null ? null
            : assistanceExpiresAt ? new Date(assistanceExpiresAt)
            : undefined,
          updatedAt: new Date(),
        },
        include: { interests: { include: { software: true } } },
      })
    })
  }

  async remove(id: string) {
    const company = await this.prisma.company.findFirst({ where: { id, deletedAt: null } })
    if (!company) throw new NotFoundException('Azienda non trovata')
    return this.prisma.company.update({ where: { id }, data: { deletedAt: new Date() } })
  }
}
