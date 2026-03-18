import { Controller, Post, Body } from '@nestjs/common'
import { CertificatesService } from './certificates.service'

@Controller('certificates')
export class CertificatesController {
  constructor(private readonly certificatesService: CertificatesService) {}

  @Post('issue')
  issue(@Body() body: { userId: string; courseSlug: string }) {
    return this.certificatesService.issue(body.userId, body.courseSlug)
  }
}