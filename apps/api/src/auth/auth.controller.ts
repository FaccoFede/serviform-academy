import { Controller, Post, Get, Body, Param, UseGuards, Request, ForbiddenException } from '@nestjs/common'
import { AuthService } from './auth.service'
import { LoginDto } from './dto/login.dto'
import { RegisterDto } from './dto/register.dto'
import { JwtAuthGuard } from './guards/jwt-auth.guard'

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  register(@Body() dto: RegisterDto) {
    return this.authService.register(dto.email, dto.password, dto.name)
  }

  @Post('login')
  login(@Body() dto: LoginDto) {
    return this.authService.login(dto.email, dto.password)
  }

  @UseGuards(JwtAuthGuard)
  @Get('profile')
  getProfile(@Request() req: any) {
    return this.authService.getProfile(req.user.id)
  }

  /**
   * POST /auth/promote-admin
   * Endpoint bootstrap: promuove l'utente autenticato ad ADMIN.
   *
   * Funziona SOLO se non esiste ancora nessun utente ADMIN nel sistema.
   * Dopo che il primo ADMIN è stato creato, questo endpoint restituisce 403
   * per chiunque, rendendo impossibile promozioni non autorizzate.
   *
   * Utilizzo:
   *   1. Registrati normalmente con /auth/register
   *   2. Fai login con /auth/login per ottenere il token
   *   3. Chiama POST /auth/promote-admin con il token nel header Authorization
   *
   * Dopo aver creato il primo admin, usa il pannello admin per creare altri utenti.
   */
  @UseGuards(JwtAuthGuard)
  @Post('promote-admin')
  async promoteAdmin(@Request() req: any) {
    return this.authService.promoteToFirstAdmin(req.user.id)
  }
}
