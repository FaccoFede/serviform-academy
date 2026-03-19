import { Controller, Post, Body } from '@nestjs/common'
import { CertificatesService } from './certificates.service'
import { IssueCertificateDto } from './dto/issue-certificate.dto'

/**
 * Controller per l'emissione dei certificati.
 *
 * Il certificato viene emesso solo dopo aver verificato
 * che l'utente ha completato tutte le unità del corso.
 *
 * Endpoint:
 * - POST /certificates/issue → emetti un certificato
 */
@Controller('certificates')
export class CertificatesController {

  constructor(private readonly certificatesService: CertificatesService) {}

  @Post('issue')
  issue(@Body() dto: IssueCertificateDto) {
    return this.certificatesService.issue(dto.userId, dto.courseSlug)
  }
}
