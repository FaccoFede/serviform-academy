import { Controller, Post, Get, Body, UseGuards, Request } from '@nestjs/common'
import { CertificatesService } from './certificates.service'
import { IssueCertificateDto } from './dto/issue-certificate.dto'
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard'

@Controller('certificates')
@UseGuards(JwtAuthGuard)
export class CertificatesController {
  constructor(private readonly certificatesService: CertificatesService) {}

  /** POST /certificates/issue — emette il certificato se corso completato al 100% */
  @Post('issue')
  issue(@Request() req: any, @Body() dto: IssueCertificateDto) {
    return this.certificatesService.issue(req.user.id, dto.courseSlug)
  }

  /** GET /certificates/my — lista attestati dell'utente autenticato */
  @Get('my')
  getMy(@Request() req: any) {
    return this.certificatesService.findByUser(req.user.id)
  }
}
