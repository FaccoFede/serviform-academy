import {
  Injectable,
  UnauthorizedException,
  ConflictException,
  ForbiddenException,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common'
import { JwtService } from '@nestjs/jwt'
import * as bcrypt from 'bcrypt'
import { PrismaService } from '../prisma/prisma.service'

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
  ) {}

  async register(email: string, password: string, name?: string) {
    const existing = await this.prisma.user.findUnique({ where: { email } })
    if (existing) throw new ConflictException('Email già registrata')
    const passwordHash = await bcrypt.hash(password, 12)
    const user = await this.prisma.user.create({ data: { email, passwordHash, name } })
    return this.buildTokenResponse(user)
  }

  async login(email: string, password: string) {
    const user = await this.prisma.user.findUnique({ where: { email } })
    if (!user || !user.passwordHash) throw new UnauthorizedException('Credenziali non valide')
    const valid = await bcrypt.compare(password, user.passwordHash)
    if (!valid) throw new UnauthorizedException('Credenziali non valide')
    await this.prisma.user.update({ where: { id: user.id }, data: { lastLoginAt: new Date() } })
    return this.buildTokenResponse(user)
  }

  /**
   * getProfile — select esplicita e sicura.
   * NON usare select: { ...campi } con campi che potrebbero non esistere nel DB.
   * Se lo schema Prisma è disallineato dal DB, usare solo campi certi.
   *
   * FIX: rimosso il campo 'colonna' che causava PrismaClientKnownRequestError
   * "The column `colonna` does not exist in the current database."
   * Quel campo era stato aggiunto per errore in uno schema Prisma locale
   * senza la corrispondente migration sul DB.
   */
  async getProfile(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        firstName: true,
        lastName: true,
        role: true,
        avatarUrl: true,
        createdAt: true,
        // Relazione membership → company
        membership: {
          select: {
            company: {
              select: {
                id: true,
                name: true,
                slug: true,
              },
            },
          },
        },
      },
    })
    if (!user) return null
    // Normalizza: porta company al livello radice per comodità del frontend
    return {
      ...user,
      company: user.membership?.company ?? null,
      membership: undefined,
    }
  }

  /**
   * updateProfile — aggiorna nome, email.
   * Se l'email cambia, restituisce un nuovo accessToken.
   */
  async updateProfile(
    userId: string,
    data: { name?: string; firstName?: string; lastName?: string; email?: string },
  ) {
    if (data.name !== undefined && data.name.trim().length < 2) {
      throw new BadRequestException('Il nome deve avere almeno 2 caratteri')
    }
    if (data.email !== undefined) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (!emailRegex.test(data.email)) {
        throw new BadRequestException('Email non valida')
      }
      const existing = await this.prisma.user.findFirst({
        where: { email: data.email, id: { not: userId } },
      })
      if (existing) throw new ConflictException('Email già in uso da un altro account')
    }

    const updated = await this.prisma.user.update({
      where: { id: userId },
      data: {
        ...(data.name !== undefined && { name: data.name.trim() }),
        ...(data.firstName !== undefined && { firstName: data.firstName.trim() }),
        ...(data.lastName !== undefined && { lastName: data.lastName.trim() }),
        ...(data.email !== undefined && { email: data.email.toLowerCase().trim() }),
      },
      select: {
        id: true,
        email: true,
        name: true,
        firstName: true,
        lastName: true,
        role: true,
        avatarUrl: true,
      },
    })

    if (data.email !== undefined) {
      return {
        user: updated,
        accessToken: this.jwt.sign({ sub: updated.id, email: updated.email, role: updated.role }),
        tokenRefreshed: true,
      }
    }
    return { user: updated, tokenRefreshed: false }
  }

  /**
   * changePassword — richiede la password attuale.
   */
  async changePassword(userId: string, currentPassword: string, newPassword: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } })
    if (!user) throw new NotFoundException('Utente non trovato')
    if (!user.passwordHash) throw new BadRequestException('Questo account non ha una password impostata')

    const valid = await bcrypt.compare(currentPassword, user.passwordHash)
    if (!valid) throw new UnauthorizedException('La password attuale non è corretta')
    if (newPassword.length < 8) throw new BadRequestException('La nuova password deve avere almeno 8 caratteri')
    if (newPassword === currentPassword) throw new BadRequestException('La nuova password deve essere diversa da quella attuale')

    const newHash = await bcrypt.hash(newPassword, 12)
    await this.prisma.user.update({ where: { id: userId }, data: { passwordHash: newHash } })
    return { message: 'Password aggiornata con successo' }
  }

  async validateToken(payload: { sub: string; email: string }) {
    return this.prisma.user.findUnique({
      where: { id: payload.sub },
      select: { id: true, email: true, role: true, name: true },
    })
  }

  async promoteToFirstAdmin(userId: string) {
    const existingAdmin = await this.prisma.user.findFirst({ where: { role: 'ADMIN', deletedAt: null } })
    if (existingAdmin) throw new ForbiddenException('Un amministratore esiste già.')
    const user = await this.prisma.user.update({ where: { id: userId }, data: { role: 'ADMIN' } })
    return { message: 'Promosso ad ADMIN.', ...this.buildTokenResponse(user) }
  }

  private buildTokenResponse(user: { id: string; email: string; role: string; name?: string | null }) {
    const payload = { sub: user.id, email: user.email, role: user.role }
    return {
      accessToken: this.jwt.sign(payload),
      user: { id: user.id, email: user.email, name: user.name, role: user.role },
    }
  }
}
