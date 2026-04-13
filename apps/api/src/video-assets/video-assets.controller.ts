import {
  Controller, Get, Post, Put, Delete, Param,
  UseGuards, UseInterceptors, UploadedFile,
  BadRequestException, Body,
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

  /** GET /video-assets/public — lista per il player (tutti gli autenticati) */
  @Get('public')
  @UseGuards(JwtAuthGuard)
  findPublic() {
    return this.svc.findAll()
  }

  /** POST /video-assets/upload — carica un video MP4/WebM/OGG */
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

  /**
   * POST /video-assets/external — registra un URL esterno nel catalogo
   * (YouTube, Vimeo, Bunny, MP4 remoto, ecc.) senza upload di file.
   */
  @Post('external')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'TEAM_ADMIN')
  createExternal(@Body() body: { title: string; url: string }) {
    return this.svc.createExternal(body)
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'TEAM_ADMIN')
  update(@Param('id') id: string, @Body() body: any) {
    return this.svc.update(id, body)
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'TEAM_ADMIN')
  remove(@Param('id') id: string) {
    return this.svc.remove(id)
  }
}
