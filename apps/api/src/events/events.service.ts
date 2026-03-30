import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service'

// ─── Helper: converte qualsiasi formato data in Date valida ─────────────────
function parseDate(value: unknown, fieldName: string): Date {
  if (!value) throw new BadRequestException(`Il campo "${fieldName}" è obbligatorio`)
  const d = new Date(value as string)
  if (isNaN(d.getTime())) {
    throw new BadRequestException(
      `Il campo "${fieldName}" non è una data valida. Usa il formato ISO 8601, es: 2026-04-15T09:00:00`,
    )
  }
  return d
}

function parseOptionalDate(value: unknown): Date | undefined {
  if (!value || value === '') return undefined
  const d = new Date(value as string)
  if (isNaN(d.getTime())) return undefined
  return d
}

// ─── Sanitizzazione payload evento ──────────────────────────────────────────
function sanitizeEventPayload(data: any) {
  const { date, endDate, maxSeats, published, ...rest } = data

  const sanitized: any = {
    ...rest,
    date: parseDate(date, 'date'),
  }

  if (endDate !== undefined) {
    sanitized.endDate = parseOptionalDate(endDate) ?? null
  }

  // maxSeats: converti in intero, null se non presente
  if (maxSeats !== undefined && maxSeats !== '' && maxSeats !== null) {
    const n = parseInt(String(maxSeats), 10)
    sanitized.maxSeats = isNaN(n) ? null : n
  } else {
    sanitized.maxSeats = null
  }

  // published: booleano esplicito
  if (published !== undefined) {
    sanitized.published = published === true || published === 'true'
  }

  return sanitized
}

@Injectable()
export class EventsService {
  constructor(private prisma: PrismaService) {}

  findAll() {
    return this.prisma.event.findMany({
      where: { published: true },
      orderBy: { date: 'asc' },
    })
  }

  findAllAdmin() {
    // Admin vede tutti, inclusi non pubblicati
    return this.prisma.event.findMany({ orderBy: { date: 'asc' } })
  }

  findUpcoming() {
    return this.prisma.event.findMany({
      where: { published: true, date: { gte: new Date() } },
      orderBy: { date: 'asc' },
    })
  }

  findPast() {
    return this.prisma.event.findMany({
      where: { published: true, date: { lt: new Date() } },
      orderBy: { date: 'desc' },
    })
  }

  async findOne(id: string) {
    const ev = await this.prisma.event.findUnique({ where: { id } })
    if (!ev) throw new NotFoundException('Evento non trovato')
    return ev
  }

  async create(data: any) {
    try {
      const payload = sanitizeEventPayload(data)
      return await this.prisma.event.create({ data: payload })
    } catch (e) {
      if (e instanceof BadRequestException) throw e
      // Log dell'errore reale per il debug
      console.error('[EventsService.create] Errore Prisma:', e)
      throw new BadRequestException(
        `Impossibile creare l'evento: ${(e as any)?.message || 'errore sconosciuto'}`,
      )
    }
  }

  async update(id: string, data: any) {
    const ev = await this.prisma.event.findUnique({ where: { id } })
    if (!ev) throw new NotFoundException('Evento non trovato')

    try {
      // Per l'update, la date è opzionale
      const sanitized: any = { ...data }
      if (data.date !== undefined) {
        sanitized.date = parseDate(data.date, 'date')
      }
      if (data.endDate !== undefined) {
        sanitized.endDate = parseOptionalDate(data.endDate) ?? null
      }
      if (data.maxSeats !== undefined) {
        const n = data.maxSeats !== '' && data.maxSeats !== null
          ? parseInt(String(data.maxSeats), 10)
          : null
        sanitized.maxSeats = isNaN(n as number) ? null : n
      }
      if (data.published !== undefined) {
        sanitized.published = data.published === true || data.published === 'true'
      }

      return await this.prisma.event.update({ where: { id }, data: sanitized })
    } catch (e) {
      if (e instanceof BadRequestException || e instanceof NotFoundException) throw e
      console.error('[EventsService.update] Errore Prisma:', e)
      throw new BadRequestException(
        `Impossibile aggiornare l'evento: ${(e as any)?.message || 'errore sconosciuto'}`,
      )
    }
  }

  async remove(id: string) {
    const ev = await this.prisma.event.findUnique({ where: { id } })
    if (!ev) throw new NotFoundException('Evento non trovato')
    return this.prisma.event.delete({ where: { id } })
  }
}
