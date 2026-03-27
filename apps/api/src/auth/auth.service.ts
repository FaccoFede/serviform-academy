import {
  Injectable, UnauthorizedException, ConflictException,
  ForbiddenException, NotFoundException,
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
    const resp = this.buildTokenResponse(user)
    // Se l'utente deve cambiare password, segnalarlo nel response
    return { ...resp, mustChangePassword: !!(user as any).mustChangePassword }
  }

  async changePassword(userId: string, currentPassword: string, newPassword: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } })
    if (!user) throw new NotFoundException('Utente non trovato')
    if (user.passwordHash) {
      const valid = await bcrypt.compare(currentPassword, user.passwordHash)
      if (!valid) throw new UnauthorizedException('Password attuale non corretta')
    }
    const passwordHash = await bcrypt.hash(newPassword, 12)
    await this.prisma.user.update({
      where: { id: userId },
      data: { passwordHash, mustChangePassword: false } as any,
    })
    return { message: 'Password aggiornata con successo' }
  }

  async adminResetPassword(adminUserId: string, targetUserId: string, newPassword: string, forceChange = true) {
    // Solo ADMIN può resettare password altrui
    const admin = await this.prisma.user.findUnique({ where: { id: adminUserId } })
    if (!admin || !['ADMIN', 'TEAM_ADMIN'].includes(admin.role)) {
      throw new ForbiddenException('Permessi insufficienti')
    }
    const target = await this.prisma.user.findUnique({ where: { id: targetUserId } })
    if (!target) throw new NotFoundException('Utente non trovato')
    const passwordHash = await bcrypt.hash(newPassword, 12)
    await this.prisma.user.update({
      where: { id: targetUserId },
      data: { passwordHash, mustChangePassword: forceChange } as any,
    })
    return { message: `Password reimpostata. Cambio obbligatorio al prossimo accesso: ${forceChange}` }
  }

  async generateImpersonationToken(adminUserId: string, targetUserId: string) {
    const admin = await this.prisma.user.findUnique({ where: { id: adminUserId } })
    if (!admin || admin.role !== 'ADMIN') throw new ForbiddenException('Solo ADMIN può impersonare')
    const target = await this.prisma.user.findUnique({ where: { id: targetUserId } })
    if (!target) throw new NotFoundException('Utente non trovato')
    // Token con scadenza corta (30 min) e flag impersonation per audit
    const payload = { sub: target.id, email: target.email, role: target.role, impersonatedBy: adminUserId }
    const accessToken = this.jwt.sign(payload, { expiresIn: '30m' })
    return { accessToken, message: `Accesso come ${target.email} (sessione 30 min, non viene salvata come login)` }
  }

  async getProfile(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true, email: true, name: true, firstName: true, lastName: true,
        role: true, avatarUrl: true, createdAt: true,
        mustChangePassword: true,
        membership: { include: { company: { select: { id: true, name: true, slug: true } } } },
      } as any,
    })
    return user
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
