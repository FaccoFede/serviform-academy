import { Injectable, NotFoundException } from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service'
import * as bcrypt from 'bcrypt'

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  /** Lista utenti — passwordHash escluso dalla select */
  findAll() {
    return this.prisma.user.findMany({
      where: { deletedAt: null },
      select: {
        id: true,
        email: true,
        name: true,
        firstName: true,
        lastName: true,
        role: true,
        lastLoginAt: true,
        createdAt: true,
        membership: {
          include: { company: { select: { id: true, name: true, slug: true } } },
        },
      },
      orderBy: { createdAt: 'desc' },
    })
  }

  findById(id: string) {
    return this.prisma.user.findFirst({
      where: { id, deletedAt: null },
      select: {
        id: true,
        email: true,
        name: true,
        firstName: true,
        lastName: true,
        role: true,
        lastLoginAt: true,
        createdAt: true,
        membership: {
          include: { company: { select: { id: true, name: true, slug: true } } },
        },
      },
    })
  }

  async create(data: {
    email: string
    name?: string
    password?: string
    role?: string
    companyId?: string
  }) {
    const { password, companyId, ...rest } = data
    return this.prisma.$transaction(async tx => {
      const user = await tx.user.create({
        data: {
          ...rest,
          role: (rest.role as any) ?? 'USER',
          passwordHash: password ? await bcrypt.hash(password, 12) : undefined,
        },
      })
      if (companyId) {
        await tx.companyMembership.create({ data: { userId: user.id, companyId } })
      }
      return user
    })
  }

  async update(id: string, data: {
    name?: string
    firstName?: string
    lastName?: string
    role?: string
    companyId?: string | null
  }) {
    const user = await this.prisma.user.findFirst({ where: { id, deletedAt: null } })
    if (!user) throw new NotFoundException('Utente non trovato')

    const { companyId, ...rest } = data
    return this.prisma.$transaction(async tx => {
      if (companyId !== undefined) {
        await tx.companyMembership.deleteMany({ where: { userId: id } })
        if (companyId) {
          await tx.companyMembership.create({ data: { userId: id, companyId } })
        }
      }
      return tx.user.update({
        where: { id },
        data: { ...rest, role: (rest.role as any) },
      })
    })
  }

  async remove(id: string) {
    const user = await this.prisma.user.findFirst({ where: { id, deletedAt: null } })
    if (!user) throw new NotFoundException('Utente non trovato')
    return this.prisma.user.update({ where: { id }, data: { deletedAt: new Date() } })
  }
}
