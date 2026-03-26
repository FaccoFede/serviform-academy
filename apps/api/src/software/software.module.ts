import { Module } from '@nestjs/common'
import { SoftwareService } from './software.service'
import { SoftwareController } from './software.controller'
import { PrismaModule } from '../prisma/prisma.module'
import { AuthModule } from '../auth/auth.module'
@Module({ imports: [PrismaModule, AuthModule], providers: [SoftwareService], controllers: [SoftwareController], exports: [SoftwareService] })
export class SoftwareModule {}
