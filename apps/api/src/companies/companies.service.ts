import { Injectable, NotFoundException, ConflictException } from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service'

/**
 * Filtra il payload al solo set di campi scalari del modello Company.
 * Evita che relazioni/conteggi rimbalzati dal frontend (es. interests,
 * members, _count) finiscano nel `data` di Prisma e generino errori.
 */
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
        interests: { include: { software: true } },
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
        interests: { include: { software: true } },
      },
    })
  }

  async create(data: any) {
    const existing = await this.prisma.company.findFirst({ where: { slug: data.slug, deletedAt: null } })
    if (existing) throw new ConflictException('Slug già esistente')
    const scalars = pickCompanyScalars(data)
    const ids: string[] = Array.isArray(data.softwareIds) ? data.softwareIds.filter(Boolean) : []
    const company = await this.prisma.company.create({
      data: {
        ...scalars,
        assistanceExpiresAt: data.assistanceExpiresAt ? new Date(data.assistanceExpiresAt) : undefined,
        ...(ids.length > 0 && {
          interests: { create: ids.map((softwareId: string) => ({ softwareId })) },
        }),
      },
      include: { interests: { include: { software: true } } },
    })
    return company
  }

  async update(id: string, data: any) {
    const c = await this.prisma.company.findFirst({ where: { id, deletedAt: null } })
    if (!c) throw new NotFoundException('Azienda non trovata')

    // Sincronizza le preferenze software solo se il client invia esplicitamente `softwareIds`.
    // In questo modo gli update parziali (che non toccano le preferenze) non le cancellano.
    if (Array.isArray(data.softwareIds)) {
      await this.syncInterests(id, data.softwareIds.filter(Boolean))
    }

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
      include: { interests: { include: { software: true } } },
    })
  }

  async remove(id: string) {
    const c = await this.prisma.company.findFirst({ where: { id, deletedAt: null } })
    if (!c) throw new NotFoundException('Azienda non trovata')
    return this.prisma.company.update({ where: { id }, data: { deletedAt: new Date() } })
  }

  /**
   * Allinea le CompanyInterest al set di softwareIds fornito:
   * - rimuove le preferenze non più presenti
   * - aggiunge quelle nuove (skipDuplicates per l'unique composto)
   */
  private async syncInterests(companyId: string, softwareIds: string[]) {
    const current = await this.prisma.companyInterest.findMany({ where: { companyId } })
    const currentIds = new Set(current.map(i => i.softwareId))
    const desiredIds = new Set(softwareIds)

    const toRemove = current.filter(i => !desiredIds.has(i.softwareId)).map(i => i.id)
    const toAdd = softwareIds.filter(sid => !currentIds.has(sid))

    if (toRemove.length > 0) {
      await this.prisma.companyInterest.deleteMany({ where: { id: { in: toRemove } } })
    }
    if (toAdd.length > 0) {
      await this.prisma.companyInterest.createMany({
        data: toAdd.map(softwareId => ({ companyId, softwareId })),
        skipDuplicates: true,
      })
    }
  }
}
