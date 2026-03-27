import { Controller, Post, Get, Put, Body, Param, UseGuards, Request } from '@nestjs/common'
import { AuthService } from './auth.service'
import { LoginDto } from './dto/login.dto'
import { RegisterDto } from './dto/register.dto'
import { JwtAuthGuard } from './guards/jwt-auth.guard'
import { RolesGuard } from './guards/roles.guard'
import { Roles } from './decorators/roles.decorator'

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

  @UseGuards(JwtAuthGuard)
  @Post('promote-admin')
  promoteAdmin(@Request() req: any) {
    return this.authService.promoteToFirstAdmin(req.user.id)
  }

  /** Cambio password autonomo (utente loggato) */
  @UseGuards(JwtAuthGuard)
  @Put('change-password')
  changePassword(
    @Request() req: any,
    @Body() body: { currentPassword: string; newPassword: string },
  ) {
    return this.authService.changePassword(req.user.id, body.currentPassword, body.newPassword)
  }

  /** Reset password da admin su altro utente */
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'TEAM_ADMIN')
  @Put('admin/reset-password/:userId')
  adminResetPassword(
    @Request() req: any,
    @Param('userId') userId: string,
    @Body() body: { newPassword: string; forceChange?: boolean },
  ) {
    return this.authService.adminResetPassword(
      req.user.id, userId, body.newPassword, body.forceChange ?? true,
    )
  }

  /** Impersonation admin — restituisce token a breve scadenza per l'utente target */
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @Post('admin/impersonate/:userId')
  impersonate(@Request() req: any, @Param('userId') userId: string) {
    return this.authService.generateImpersonationToken(req.user.id, userId)
  }
}
