import { Controller, Post, Get, Body, UseGuards, Request } from '@nestjs/common'
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
   * Promuove l'utente corrente ad ADMIN SOLO se non esiste ancora nessun ADMIN.
   * Dopo il primo admin, risponde 403 per chiunque.
   */
  @UseGuards(JwtAuthGuard)
  @Post('promote-admin')
  promoteAdmin(@Request() req: any) {
    return this.authService.promoteToFirstAdmin(req.user.id)
  }
}
