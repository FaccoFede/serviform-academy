import { Module } from '@nestjs/common'
import { ExercisesService } from './exercises.service'
import { ExercisesController } from './exercises.controller'
import { PrismaModule } from '../prisma/prisma.module'
import { AuthModule } from '../auth/auth.module'

@Module({
  imports: [PrismaModule, AuthModule],
  providers: [ExercisesService],
  controllers: [ExercisesController],
})
export class ExercisesModule {}
