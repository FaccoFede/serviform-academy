import { Injectable, NotFoundException, ConflictException } from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service'

@Injectable()
export class CompaniesService {
  constructor(private readonly prisma: PrismaService) {}

  findAll() {
    return this.prisma.company.findMany({
      where: { deletedAt: null },
      include: { _count: { select: { members: true, courseAssignments: true } } },
      orderBy: { name: 'asc' },
    })
  }

  findById(id: string) {
    return this.prisma.company.findFirst({ where: { id, deletedAt: null }, include: { members: { include: { user: { select: { id: true, email: true, name: true, role: true } } } }, courseAssignments: { include: { course: { select: { id: true, title: true, slug: true } } } } } })
  }

  async create(data: any) {
    const existing = await this.prisma.company.findFirst({ where: { slug: data.slug, deletedAt: null } })
    if (existing) throw new ConflictException('Slug già esistente')
    const { assistanceExpiresAt, ...rest } = data
    return this.prisma.company.create({ data: { ...rest, assistanceExpiresAt: assistanceExpiresAt ? new Date(assistanceExpiresAt) : undefined } })
  }

  async update(id: string, data: any) {
    const c = await this.prisma.company.findFirst({ where: { id, deletedAt: null } })
    if (!c) throw new NotFoundException('Azienda non trovata')
    const { assistanceExpiresAt, ...rest } = data
    return this.prisma.company.update({ where: { id }, data: { ...rest, assistanceExpiresAt: assistanceExpiresAt === null ? null : assistanceExpiresAt ? new Date(assistanceExpiresAt) : undefined, updatedAt: new Date() } })
  }

  async remove(id: string) {
    const c = await this.prisma.company.findFirst({ where: { id, deletedAt: null } })
    if (!c) throw new NotFoundException('Azienda non trovata')
    return this.prisma.company.update({ where: { id }, data: { deletedAt: new Date() } })
  }
}
