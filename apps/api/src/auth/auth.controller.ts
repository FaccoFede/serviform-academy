import { Controller, Post, Get, Patch, Body, UseGuards, Request } from '@nestjs/common'
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
   * PATCH /auth/profile
   * Aggiorna nome, email del profilo.
   * Se l'email cambia, risponde con un nuovo accessToken.
   */
  @UseGuards(JwtAuthGuard)
  @Patch('profile')
  updateProfile(
    @Request() req: any,
    @Body() body: { name?: string; firstName?: string; lastName?: string; email?: string },
  ) {
    return this.authService.updateProfile(req.user.id, body)
  }

  /**
   * PATCH /auth/change-password
   * Cambia password richiedendo la password attuale per conferma.
   */
  @UseGuards(JwtAuthGuard)
  @Patch('change-password')
  changePassword(
    @Request() req: any,
    @Body() body: { currentPassword: string; newPassword: string },
  ) {
    if (!body.currentPassword || !body.newPassword) {
      return Promise.reject(
        new (require('@nestjs/common').BadRequestException)(
          'currentPassword e newPassword sono obbligatori',
        ),
      )
    }
    return this.authService.changePassword(req.user.id, body.currentPassword, body.newPassword)
  }

  /**
   * POST /auth/promote-admin
   * Promuove il primo utente ad ADMIN (bootstrap).
   */
  @UseGuards(JwtAuthGuard)
  @Post('promote-admin')
  promoteAdmin(@Request() req: any) {
    return this.authService.promoteToFirstAdmin(req.user.id)
  }
}
