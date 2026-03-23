import { Injectable, NotFoundException } from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service'

@Injectable()
export class ExercisesService {
  constructor(private prisma: PrismaService) {}

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
}
