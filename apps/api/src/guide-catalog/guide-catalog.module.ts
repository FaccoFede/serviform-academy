import { Module } from '@nestjs/common'
import { PrismaModule } from '../prisma/prisma.module'
import { GuideCatalogService } from './guide-catalog.service'
import { GuideCatalogController } from './guide-catalog.controller'

@Module({
  imports: [PrismaModule],
  controllers: [GuideCatalogController],
  providers: [GuideCatalogService],
  exports: [GuideCatalogService],
})
export class GuideCatalogModule {}
