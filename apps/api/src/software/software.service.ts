import { Injectable, NotFoundException } from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service'

@Injectable()
export class SoftwareService {
  constructor(private prisma: PrismaService) {}
  findAll() { return this.prisma.software.findMany({ where: { deletedAt: null }, orderBy: { name: 'asc' } }) }
  findBySlug(slug: string) { return this.prisma.software.findFirst({ where: { slug, deletedAt: null } }) }
  create(data: any) { return this.prisma.software.create({ data }) }
  async update(id: string, data: any) {
    const s = await this.prisma.software.findFirst({ where: { id, deletedAt: null } })
    if (!s) throw new NotFoundException('Software non trovato')
    return this.prisma.software.update({ where: { id }, data })
  }
  async remove(id: string) {
    const s = await this.prisma.software.findFirst({ where: { id, deletedAt: null } })
    if (!s) throw new NotFoundException('Software non trovato')
    return this.prisma.software.update({ where: { id }, data: { deletedAt: new Date() } })
  }
}
