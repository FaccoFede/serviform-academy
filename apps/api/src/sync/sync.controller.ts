import { Controller, Post, Body } from '@nestjs/common'
import { SyncService } from './sync.service'

@Controller('sync')
export class SyncController {
  constructor(private readonly syncService: SyncService) {}

  @Post('video-pill')
  importVideoPill(@Body() body: {
    title: string
    youtubeId: string
    description?: string
    softwareSlug: string
  }) {
    return this.syncService.importVideoPill(body)
  }
}