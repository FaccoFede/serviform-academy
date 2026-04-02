import { Injectable, NotFoundException } from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service'

/**
 * Converte una stringa data in Date | null.
 * Se la stringa è vuota, null, undefined o non è una data valida → restituisce null.
 * Questo previene il PrismaClientValidationError "premature end of input" quando
 * il frontend manda expiresAt: "" (stringa vuota dal form).
 */
function toDateOrNull(value: unknown): Date | null {
  if (!value || value === '') return null
  const d = new Date(value as string)
  return isNaN(d.getTime()) ? null : d
}

/**
 * Sanitizza il payload prima di passarlo a Prisma.
 * - Converte expiresAt e publishedAt in Date | null
 * - Normalizza booleani
 * - Rimuove campi che non esistono nello schema
 */
function sanitize(data: any): any {
  const out: any = { ...data }

  if ('expiresAt' in out) out.expiresAt = toDateOrNull(out.expiresAt)
  if ('publishedAt' in out) out.publishedAt = toDateOrNull(out.publishedAt)

  if ('published' in out) out.published = out.published === true || out.published === 'true'
  if ('isPinned' in out) out.isPinned = out.isPinned === true || out.isPinned === 'true'

  // Normalizza content e bannerUrl: stringa vuota → null
  if ('content' in out && out.content === '') out.content = null
  if ('bannerUrl' in out && out.bannerUrl === '') out.bannerUrl = null

  return out
}

@Injectable()
export class AnnouncementsService {
  constructor(private readonly prisma: PrismaService) {}

  findPublished(section?: string) {
    const now = new Date()
    const where: any = {
      published: true,
      OR: [{ expiresAt: null }, { expiresAt: { gt: now } }],
    }
    if (section) where.section = section
    return this.prisma.announcement.findMany({
      where,
      orderBy: [{ isPinned: 'desc' }, { publishedAt: 'desc' }],
    } as any)
  }

  findAll(section?: string) {
    const where: any = {}
    if (section) where.section = section
    return this.prisma.announcement.findMany({
      where,
      orderBy: [{ isPinned: 'desc' }, { createdAt: 'desc' }],
    } as any)
  }

  findOne(id: string) {
    return this.prisma.announcement.findUnique({ where: { id } })
  }

  create(data: any, createdBy: string) {
    const clean = sanitize(data)
    return this.prisma.announcement.create({
      data: {
        ...clean,
        createdBy,
        publishedAt: clean.published ? new Date() : null,
        isPinned: clean.isPinned ?? false,
        section: clean.section ?? 'NEWS',
      } as any,
    })
  }

  async update(id: string, data: any) {
    const a = await this.prisma.announcement.findUnique({ where: { id } })
    if (!a) throw new NotFoundException('Annuncio non trovato')

    const clean = sanitize(data)

    // Se viene pubblicato adesso e non aveva ancora publishedAt, impostalo
    const extra = clean.published && !(a as any).publishedAt
      ? { publishedAt: new Date() }
      : {}

    return this.prisma.announcement.update({
      where: { id },
      data: { ...clean, ...extra } as any,
    })
  }

  async remove(id: string) {
    const a = await this.prisma.announcement.findUnique({ where: { id } })
    if (!a) throw new NotFoundException('Annuncio non trovato')
    return this.prisma.announcement.delete({ where: { id } })
  }
}
