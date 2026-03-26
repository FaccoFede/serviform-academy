import { Injectable, UnauthorizedException, ConflictException, ForbiddenException } from '@nestjs/common'
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
        id: true, email: true, name: true, firstName: true,
        lastName: true, role: true, avatarUrl: true, createdAt: true,
        membership: { include: { company: { select: { id: true, name: true, slug: true } } } },
      },
    })
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
    return { accessToken: this.jwt.sign(payload), user: { id: user.id, email: user.email, name: user.name, role: user.role } }
  }
}
