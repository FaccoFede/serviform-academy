import { Controller, Post, Body, UseGuards, Request } from '@nestjs/common'
import { CertificatesService } from './certificates.service'
import { IssueCertificateDto } from './dto/issue-certificate.dto'
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard'

/**
 * CertificatesController — richiede autenticazione JWT.
 * userId viene sempre dal token, non dal body.
 */
@Controller('certificates')
@UseGuards(JwtAuthGuard)
export class CertificatesController {
  constructor(private readonly certificatesService: CertificatesService) {}

  /**
   * POST /certificates/issue
   * Emette un certificato per l'utente autenticato se ha completato il corso.
   */
  @Post('issue')
  issue(@Request() req: any, @Body() dto: IssueCertificateDto) {
    return this.certificatesService.issue(req.user.id, dto.courseSlug)
  }
}
