import { Module } from '@nestjs/common'
import { GuidesService } from './guides.service'
import { GuidesController } from './guides.controller'
import { PrismaModule } from '../prisma/prisma.module'
import { AuthModule } from '../auth/auth.module'

@Module({
  imports: [PrismaModule, AuthModule],
  providers: [GuidesService],
  controllers: [GuidesController],
})
export class GuidesModule {}
