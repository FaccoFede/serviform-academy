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

  async getProfile(userId: string) {
    return this.prisma.user.findUnique({
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
        membership: {
          include: {
            company: { select: { id: true, name: true, slug: true } },
          },
        },
      },
    })
  }

  /**
   * Aggiorna il profilo dell'utente autenticato.
   * Gestisce: name, firstName, lastName, email (con verifica unicità).
   * Non permette il cambio di ruolo tramite questo endpoint.
   */
  async updateProfile(
    userId: string,
    data: { name?: string; firstName?: string; lastName?: string; email?: string },
  ) {
    // Validazione base name
    if (data.name !== undefined && data.name.trim().length < 2) {
      throw new BadRequestException('Il nome deve avere almeno 2 caratteri')
    }

    // Se cambia email, verifica unicità
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

    // Se l'email è cambiata, occorre un nuovo token (il payload del JWT contiene email)
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
   * Cambia password con verifica della password attuale.
   */
  async changePassword(
    userId: string,
    currentPassword: string,
    newPassword: string,
  ) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } })
    if (!user) throw new NotFoundException('Utente non trovato')

    if (!user.passwordHash) {
      throw new BadRequestException('Questo account non ha una password impostata')
    }

    const valid = await bcrypt.compare(currentPassword, user.passwordHash)
    if (!valid) throw new UnauthorizedException('La password attuale non è corretta')

    // Validazione nuova password
    if (newPassword.length < 8) {
      throw new BadRequestException('La nuova password deve avere almeno 8 caratteri')
    }
    if (newPassword === currentPassword) {
      throw new BadRequestException('La nuova password deve essere diversa da quella attuale')
    }

    const newHash = await bcrypt.hash(newPassword, 12)
    await this.prisma.user.update({
      where: { id: userId },
      data: { passwordHash: newHash },
    })

    return { message: 'Password aggiornata con successo' }
  }

  async validateToken(payload: { sub: string; email: string }) {
    return this.prisma.user.findUnique({
      where: { id: payload.sub },
      select: { id: true, email: true, role: true, name: true },
    })
  }

  async promoteToFirstAdmin(userId: string) {
    const existingAdmin = await this.prisma.user.findFirst({
      where: { role: 'ADMIN', deletedAt: null },
    })
    if (existingAdmin) throw new ForbiddenException('Un amministratore esiste già.')
    const user = await this.prisma.user.update({
      where: { id: userId },
      data: { role: 'ADMIN' },
    })
    return { message: 'Promosso ad ADMIN.', ...this.buildTokenResponse(user) }
  }

  private buildTokenResponse(user: {
    id: string
    email: string
    role: string
    name?: string | null
  }) {
    const payload = { sub: user.id, email: user.email, role: user.role }
    return {
      accessToken: this.jwt.sign(payload),
      user: { id: user.id, email: user.email, name: user.name, role: user.role },
    }
  }
}
