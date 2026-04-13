import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service'

/**
 * UnitsService — gestione unità di un corso.
 *
 * Regole importanti:
 *  - order è gestito automaticamente:
 *      * OVERVIEW → order = 0 (una sola overview per corso)
 *      * LESSON / EXERCISE → order = max(order) + 1 (progressivo a partire da 1)
 *  - duration è una stringa formattata (es. "5h", "20min", "1h 30min")
 *    popolata automaticamente da durationHours / durationMinutes.
 *  - L'admin NON scrive mai l'unità di misura a mano.
 */

function formatDuration(h?: number | null, m?: number | null): string | null {
  const hh = Number(h || 0)
  const mm = Number(m || 0)
  if (!hh && !mm) return null
  if (hh && mm) return `${hh}h ${mm}min`
  if (hh) return `${hh}h`
  return `${mm}min`
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
}

@Injectable()
export class UnitsService {
  constructor(private prisma: PrismaService) {}

  findByCourse(courseId: string) {
    return this.prisma.unit.findMany({
      where: { courseId, deletedAt: null },
      include: {
        guides: { orderBy: { order: 'asc' } },
        exercises: { orderBy: { order: 'asc' } },
      },
      orderBy: { order: 'asc' },
    })
  }

  async findBySlug(courseSlug: string, unitSlug: string) {
    const course = await this.prisma.course.findUnique({ where: { slug: courseSlug } })
    if (!course) throw new NotFoundException('Corso non trovato')

    const unit = await this.prisma.unit.findFirst({
      where: { courseId: course.id, slug: unitSlug, deletedAt: null },
      include: {
        guides: { orderBy: { order: 'asc' } },
        exercises: { orderBy: { order: 'asc' } },
        course: {
          include: {
            software: true,
            units: {
              where: { deletedAt: null },
              orderBy: { order: 'asc' },
              select: { id: true, title: true, slug: true, order: true, unitType: true, duration: true },
            },
          },
        },
      },
    })
    if (!unit) throw new NotFoundException('Unità non trovata')
    return unit
  }

  /**
   * Crea una nuova unità con order e duration calcolati automaticamente.
   */
  async create(data: {
    title: string
    courseId: string
    unitType?: string
    subtitle?: string
    content?: string
    videoUrl?: string
    durationHours?: number
    durationMinutes?: number
    slug?: string
  }) {
    if (!data.title?.trim()) throw new BadRequestException('Titolo obbligatorio')
    if (!data.courseId) throw new BadRequestException('courseId obbligatorio')

    const unitType = (data.unitType as any) || 'LESSON'

    // ── ORDER automatico ───────────────────────────────────────────────
    let order: number
    if (unitType === 'OVERVIEW') {
      // Solo una overview per corso — se esiste già, rifiuta
      const existingOverview = await this.prisma.unit.findFirst({
        where: { courseId: data.courseId, unitType: 'OVERVIEW', deletedAt: null },
      })
      if (existingOverview) {
        throw new BadRequestException(
          'Il corso ha già un\'unità Overview. Modifica quella esistente.',
        )
      }
      order = 0
    } else {
      // Progressivo tra le unità non-overview esistenti
      const max = await this.prisma.unit.aggregate({
        where: {
          courseId: data.courseId,
          deletedAt: null,
          unitType: { not: 'OVERVIEW' },
        },
        _max: { order: true },
      })
      order = (max._max.order ?? 0) + 1
    }

    // ── SLUG automatico se mancante ────────────────────────────────────
    const slug = data.slug?.trim() || `${slugify(data.title)}-${Date.now().toString(36)}`

    // ── DURATA formattata ──────────────────────────────────────────────
    const duration = formatDuration(data.durationHours, data.durationMinutes)

    return this.prisma.unit.create({
      data: {
        title: data.title,
        slug,
        order,
        unitType: unitType as any,
        subtitle: data.subtitle || null,
        content: data.content || null,
        videoUrl: data.videoUrl || null,
        durationHours: data.durationHours ?? null,
        durationMinutes: data.durationMinutes ?? null,
        duration,
        courseId: data.courseId,
      },
    })
  }

  async update(id: string, data: any) {
    const unit = await this.prisma.unit.findUnique({ where: { id } })
    if (!unit) throw new NotFoundException('Unità non trovata')

    // Se vengono passati durationHours/Minutes, riformatta la stringa duration
    const patch: any = { ...data }
    if ('durationHours' in patch || 'durationMinutes' in patch) {
      const h = patch.durationHours ?? unit.durationHours
      const m = patch.durationMinutes ?? unit.durationMinutes
      patch.duration = formatDuration(h, m)
    }

    // L'order NON è modificabile liberamente: si gestisce solo tramite reorder().
    // Se l'admin ha passato un order manuale, lo ignoriamo per evitare conflitti.
    delete patch.order

    return this.prisma.unit.update({ where: { id }, data: patch })
  }

  /**
   * Riordina le unità di un corso.
   * Accetta la lista ordinata di id; il backend assegna order 1,2,3…
   * L'unità OVERVIEW resta sempre a 0 e viene ignorata se presente nella lista.
   */
  async reorder(courseId: string, unitIds: string[]) {
    // Applica in transazione per mantenere coerenza
    await this.prisma.$transaction(async (tx) => {
      let pos = 0
      for (const id of unitIds) {
        const u = await tx.unit.findUnique({ where: { id }, select: { unitType: true, courseId: true } })
        if (!u || u.courseId !== courseId) continue
        if (u.unitType === 'OVERVIEW') {
          await tx.unit.update({ where: { id }, data: { order: 0 } })
          continue
        }
        pos += 1
        await tx.unit.update({ where: { id }, data: { order: pos } })
      }
    })
    return this.findByCourse(courseId)
  }

  async remove(id: string) {
    const unit = await this.prisma.unit.findUnique({ where: { id } })
    if (!unit) throw new NotFoundException('Unità non trovata')
    return this.prisma.unit.update({ where: { id }, data: { deletedAt: new Date() } })
  }
}
