import { Module } from '@nestjs/common'
import { MulterModule } from '@nestjs/platform-express'
import { memoryStorage } from 'multer'
import { VideoAssetsController } from './video-assets.controller'
import { VideoAssetsService } from './video-assets.service'
import { PrismaModule } from '../prisma/prisma.module'
import { AuthModule } from '../auth/auth.module'

@Module({
  imports: [
    PrismaModule,
    AuthModule,
    MulterModule.register({ storage: memoryStorage() }),
  ],
  controllers: [VideoAssetsController],
  providers: [VideoAssetsService],
  exports: [VideoAssetsService],
})
export class VideoAssetsModule {}
