import { Injectable, NotFoundException } from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service'

@Injectable()
export class PricingService {
  constructor(private prisma: PrismaService) {}

  findAll() {
    return this.prisma.pricingPackage.findMany({ where: { active: true }, orderBy: { order: 'asc' } })
  }

  findOne(id: string) { return this.prisma.pricingPackage.findUnique({ where: { id } }) }
  create(data: any) { return this.prisma.pricingPackage.create({ data }) }

  async update(id: string, data: any) {
    const pkg = await this.prisma.pricingPackage.findUnique({ where: { id } })
    if (!pkg) throw new NotFoundException('Pacchetto non trovato')
    return this.prisma.pricingPackage.update({ where: { id }, data })
  }

  async remove(id: string) {
    const pkg = await this.prisma.pricingPackage.findUnique({ where: { id } })
    if (!pkg) throw new NotFoundException('Pacchetto non trovato')
    return this.prisma.pricingPackage.delete({ where: { id } })
  }
}
