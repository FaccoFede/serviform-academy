import { Injectable } from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service'

@Injectable()
export class SoftwareService {
  constructor(private prisma: PrismaService) {}
  findAll() { return this.prisma.software.findMany({ where: { deletedAt: null }, orderBy: { name: 'asc' } }) }
  findBySlug(slug: string) { return this.prisma.software.findUnique({ where: { slug } }) }
  create(data: any) { return this.prisma.software.create({ data }) }
  update(id: string, data: any) { return this.prisma.software.update({ where: { id }, data }) }
}
