import { Injectable, NotFoundException } from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service'

@Injectable()
export class ExercisesService {
  constructor(private prisma: PrismaService) {}

  /**
   * Lista completa esercizi con unità e corso collegati — usata dall'admin.
   * Ritorna i dati piatti per popolare una tabella senza ulteriori round-trip.
   */
  async findAll() {
    const rows = await this.prisma.exercise.findMany({
      include: {
        unit: {
          select: {
            id: true, title: true, slug: true, unitType: true,
            course: { select: { id: true, title: true, slug: true } },
          },
        },
      },
      orderBy: [{ unitId: 'asc' }, { order: 'asc' }],
    })
    return rows.map((e) => ({
      ...e,
      unitTitle: e.unit?.title,
      courseTitle: e.unit?.course?.title,
      courseSlug: e.unit?.course?.slug,
    }))
  }

  findByUnit(unitId: string) {
    return this.prisma.exercise.findMany({
      where: { unitId },
      orderBy: { order: 'asc' },
    })
  }

  findOne(id: string) {
    return this.prisma.exercise.findUnique({ where: { id } })
  }

  create(data: { title: string; description?: string; htmlUrl?: string; evdUrl?: string; order?: number; unitId: string }) {
    return this.prisma.exercise.create({ data })
  }

  async update(id: string, data: { title?: string; description?: string; htmlUrl?: string; evdUrl?: string; order?: number }) {
    const ex = await this.prisma.exercise.findUnique({ where: { id } })
    if (!ex) throw new NotFoundException('Esercizio non trovato')
    return this.prisma.exercise.update({ where: { id }, data })
  }

  async remove(id: string) {
    const ex = await this.prisma.exercise.findUnique({ where: { id } })
    if (!ex) throw new NotFoundException('Esercizio non trovato')
    return this.prisma.exercise.delete({ where: { id } })
  }

  /**
   * Sostituisce tutte le esercitazioni di un'unità in blocco.
   * Elimina quelle esistenti e ricrea dalla lista fornita — stesso pattern di guides.saveAll.
   */
  async saveAll(
    unitId: string,
    exercises: Array<{ title: string; description?: string; htmlUrl?: string; evdUrl?: string }>,
  ) {
    await this.prisma.exercise.deleteMany({ where: { unitId } })
    if (!exercises.length) return []
    return this.prisma.exercise.createMany({
      data: exercises.map((e, i) => ({
        title: e.title,
        description: e.description || null,
        htmlUrl: e.htmlUrl || null,
        evdUrl: e.evdUrl || null,
        order: i,
        unitId,
      })),
    })
  }
}
