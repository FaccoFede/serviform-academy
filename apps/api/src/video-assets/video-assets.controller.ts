import {
  Controller, Get, Post, Delete, Param,
  UseGuards, UseInterceptors, UploadedFile,
  BadRequestException, Request, Body,
} from '@nestjs/common'
import { FileInterceptor } from '@nestjs/platform-express'
import { memoryStorage } from 'multer'
import { VideoAssetsService } from './video-assets.service'
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard'
import { RolesGuard } from '../auth/guards/roles.guard'
import { Roles } from '../auth/decorators/roles.decorator'

const MAX_SIZE = 500 * 1024 * 1024 // 500 MB
const ALLOWED = ['video/mp4', 'video/webm', 'video/ogg', 'video/quicktime']

@Controller('video-assets')
export class VideoAssetsController {
  constructor(private readonly svc: VideoAssetsService) {}

  /** GET /video-assets — lista tutti i video del catalogo (admin) */
  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'TEAM_ADMIN')
  findAll() {
    return this.svc.findAll()
  }

  /** GET /video-assets/public — lista pubblica per il player (tutti gli autenticati) */
  @Get('public')
  @UseGuards(JwtAuthGuard)
  findPublic() {
    return this.svc.findAll()
  }

  /** POST /video-assets/upload — carica un video MP4 */
  @Post('upload')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'TEAM_ADMIN')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: memoryStorage(),
      limits: { fileSize: MAX_SIZE },
    }),
  )
  async upload(
    @UploadedFile() file: Express.Multer.File,
    @Body('title') title: string,
  ) {
    if (!file) throw new BadRequestException('Nessun file ricevuto')
    if (!ALLOWED.includes(file.mimetype)) {
      throw new BadRequestException(
        `Formato non supportato: ${file.mimetype}. Usa MP4, WebM o OGG.`,
      )
    }
    return this.svc.upload(file, title || file.originalname)
  }

  /** DELETE /video-assets/:id — elimina un video */
  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'TEAM_ADMIN')
  remove(@Param('id') id: string) {
    return this.svc.remove(id)
  }
}
