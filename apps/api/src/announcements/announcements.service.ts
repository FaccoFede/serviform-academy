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

  /**
   * findPublished — restituisce le comunicazioni pubblicate.
   *
   * MODIFICA: aggiunto parametro opzionale `userId`.
   * Se presente, include il campo `read: boolean` per ogni comunicazione,
   * che indica se l'utente ha già aperto quella comunicazione.
   * Logica: aperta (AnnouncementRead presente) = letta, non aperta = non letta.
   */
  async findPublished(section?: string, userId?: string) {
    const now = new Date()
    const where: any = {
      published: true,
      OR: [{ expiresAt: null }, { expiresAt: { gt: now } }],
    }
    if (section) where.section = section

    const items = await this.prisma.announcement.findMany({
      where,
      orderBy: [{ isPinned: 'desc' }, { publishedAt: 'desc' }],
      include: userId
        ? { reads: { where: { userId }, select: { id: true } } }
        : undefined,
    } as any)

    // Mappa: aggiunge campo read, rimuove array reads dal payload
    return items.map((item: any) => ({
      ...item,
      read: userId ? (item.reads?.length > 0) : false,
      reads: undefined,
    }))
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

  /**
   * markRead — segna una comunicazione come letta per l'utente specificato.
   *
   * NUOVO METODO: chiamato da PATCH /announcements/:id/read
   * (triggerato da AnnouncementModal.tsx ogni volta che si apre una comunicazione).
   *
   * Usa upsert per essere idempotente: aprire più volte la stessa comunicazione
   * aggiorna solo readAt senza creare duplicati.
   */
  async markRead(announcementId: string, userId: string) {
    // Verifica che l'announcement esista
    const a = await this.prisma.announcement.findUnique({ where: { id: announcementId } })
    if (!a) throw new NotFoundException('Comunicazione non trovata')

    return (this.prisma as any).announcementRead.upsert({
      where: {
        announcementId_userId: { announcementId, userId },
      },
      create: { announcementId, userId },
      update: { readAt: new Date() },
    })
  }
}
