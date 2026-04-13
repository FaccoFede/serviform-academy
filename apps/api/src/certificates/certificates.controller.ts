import { Controller, Post, Get, Delete, Body, Param, UseGuards, Request } from '@nestjs/common'
import { CertificatesService } from './certificates.service'
import { IssueCertificateDto } from './dto/issue-certificate.dto'
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard'
import { RolesGuard } from '../auth/guards/roles.guard'
import { Roles } from '../auth/decorators/roles.decorator'

@Controller('certificates')
@UseGuards(JwtAuthGuard)
export class CertificatesController {
  constructor(private readonly certificatesService: CertificatesService) {}

  /** POST /certificates/issue — emette il certificato se corso completato al 100% */
  @Post('issue')
  issue(@Request() req: any, @Body() dto: IssueCertificateDto) {
    return this.certificatesService.issue(req.user.id, dto.courseSlug)
  }

  /** GET /certificates/my — attestati dell'utente autenticato */
  @Get('my')
  getMy(@Request() req: any) {
    return this.certificatesService.findByUser(req.user.id)
  }

  /** GET /certificates/admin/all — TUTTI i certificati (admin only) */
  @Get('admin/all')
  @UseGuards(RolesGuard)
  @Roles('ADMIN', 'TEAM_ADMIN')
  getAllAdmin() {
    return this.certificatesService.findAllForAdmin()
  }

  /** DELETE /certificates/:id — revoca un certificato (admin only) */
  @Delete(':id')
  @UseGuards(RolesGuard)
  @Roles('ADMIN', 'TEAM_ADMIN')
  revoke(@Param('id') id: string) {
    return this.certificatesService.revoke(id)
  }
}
