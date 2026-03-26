import { Injectable, NotFoundException } from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service'
import * as bcrypt from 'bcrypt'

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll() {
    const users = await this.prisma.user.findMany({
      where: { deletedAt: null },
      select: {
        id: true, email: true, name: true, role: true,
        lastLoginAt: true, createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
    })
    // Aggiungi membership se la tabella esiste
    const result: any[] = []
    for (const user of users) {
      try {
        const membership = await (this.prisma as any).companyMembership?.findUnique({
          where: { userId: user.id },
          include: { company: { select: { id: true, name: true, slug: true } } },
        })
        result.push({ ...user, membership: membership || null })
      } catch {
        result.push({ ...user, membership: null })
      }
    }
    return result
  }

  async findById(id: string) {
    const user = await this.prisma.user.findFirst({
      where: { id, deletedAt: null },
      select: { id: true, email: true, name: true, role: true, lastLoginAt: true, createdAt: true },
    })
    if (!user) return null
    try {
      const membership = await (this.prisma as any).companyMembership?.findUnique({
        where: { userId: id },
        include: { company: { select: { id: true, name: true } } },
      })
      return { ...user, membership: membership || null }
    } catch {
      return { ...user, membership: null }
    }
  }

  async create(data: { email: string; name?: string; password?: string; role?: string; companyId?: string }) {
    const { password, companyId, ...rest } = data

    // Controlla email duplicata con messaggio chiaro
    const existing = await this.prisma.user.findUnique({ where: { email: rest.email } })
    if (existing) throw new Error('Email già in uso')

    const user = await this.prisma.user.create({
      data: {
        ...rest,
        role: (rest.role as any) ?? 'USER',
        passwordHash: password ? await bcrypt.hash(password, 12) : undefined,
      },
    })

    if (companyId) {
      try {
        await (this.prisma as any).companyMembership.create({ data: { userId: user.id, companyId } })
      } catch {
        // membership non disponibile — continua
      }
    }
    return user
  }

  async update(id: string, data: { name?: string; role?: string; companyId?: string | null }) {
    const user = await this.prisma.user.findFirst({ where: { id, deletedAt: null } })
    if (!user) throw new NotFoundException('Utente non trovato')

    const { companyId, ...rest } = data

    if (companyId !== undefined) {
      try {
        await (this.prisma as any).companyMembership.deleteMany({ where: { userId: id } })
        if (companyId) {
          await (this.prisma as any).companyMembership.create({ data: { userId: id, companyId } })
        }
      } catch {
        // membership non disponibile
      }
    }

    return this.prisma.user.update({
      where: { id },
      data: { ...rest, role: (rest.role as any) },
    })
  }

  async remove(id: string) {
    const user = await this.prisma.user.findFirst({ where: { id, deletedAt: null } })
    if (!user) throw new NotFoundException('Utente non trovato')
    return this.prisma.user.update({ where: { id }, data: { deletedAt: new Date() } })
  }
}
