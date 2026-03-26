import { Module } from '@nestjs/common'
import { GuidesController } from './guides.controller'
import { GuidesService } from './guides.service'
import { PrismaModule } from '../prisma/prisma.module'
import { AuthModule } from '../auth/auth.module'

@Module({
  imports: [PrismaModule, AuthModule],
  controllers: [GuidesController],
  providers: [GuidesService],
})
export class GuidesModule {}
