import { Module } from '@nestjs/common'
import { AssignmentsService } from './assignments.service'
import { AssignmentsController } from './assignments.controller'
import { PrismaModule } from '../prisma/prisma.module'
import { AuthModule } from '../auth/auth.module'
@Module({ imports: [PrismaModule, AuthModule], providers: [AssignmentsService], controllers: [AssignmentsController], exports: [AssignmentsService] })
export class AssignmentsModule {}
