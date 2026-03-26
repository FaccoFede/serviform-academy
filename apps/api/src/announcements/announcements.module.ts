import { Module } from '@nestjs/common'
import { AnnouncementsService } from './announcements.service'
import { AnnouncementsController } from './announcements.controller'
import { PrismaModule } from '../prisma/prisma.module'
import { AuthModule } from '../auth/auth.module'
@Module({ imports: [PrismaModule, AuthModule], providers: [AnnouncementsService], controllers: [AnnouncementsController], exports: [AnnouncementsService] })
export class AnnouncementsModule {}
