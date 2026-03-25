import { Module } from '@nestjs/common'
import { CertificatesService } from './certificates.service'
import { CertificatesController } from './certificates.controller'
import { PrismaModule } from '../prisma/prisma.module'
import { AuthModule } from '../auth/auth.module'

@Module({
  imports: [PrismaModule, AuthModule],
  providers: [CertificatesService],
  controllers: [CertificatesController],
})
export class CertificatesModule {}
