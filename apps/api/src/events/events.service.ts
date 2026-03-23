import { Injectable, NotFoundException } from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service'

@Injectable()
export class EventsService {
  constructor(private prisma: PrismaService) {}

  findAll() {
    return this.prisma.event.findMany({ where: { published: true }, orderBy: { date: 'asc' } })
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

  findOne(id: string) {
    return this.prisma.event.findUnique({ where: { id } })
  }

  create(data: any) {
    return this.prisma.event.create({ data })
  }

  async update(id: string, data: any) {
    const ev = await this.prisma.event.findUnique({ where: { id } })
    if (!ev) throw new NotFoundException('Evento non trovato')
    return this.prisma.event.update({ where: { id }, data })
  }

  async remove(id: string) {
    const ev = await this.prisma.event.findUnique({ where: { id } })
    if (!ev) throw new NotFoundException('Evento non trovato')
    return this.prisma.event.delete({ where: { id } })
  }
}
