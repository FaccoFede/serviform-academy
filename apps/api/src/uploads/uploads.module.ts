import { Module } from '@nestjs/common'
import { MulterModule } from '@nestjs/platform-express'
import { memoryStorage } from 'multer'
import { UploadsController } from './uploads.controller'
import { AuthModule } from '../auth/auth.module'

@Module({
  imports: [
    AuthModule,
    MulterModule.register({ storage: memoryStorage() }),
  ],
  controllers: [UploadsController],
})
export class UploadsModule {}
