import { Controller, Post, Body } from '@nestjs/common'
import { SyncService } from './sync.service'
import { ImportVideoPillDto } from './dto/import-video-pill.dto'

/**
 * Controller per la sincronizzazione di contenuti da fonti esterne.
 *
 * Attualmente gestisce l'import di video pillole da YouTube.
 * Usa upsert per gestire sia creazione che aggiornamento.
 *
 * Endpoint:
 * - POST /sync/video-pill → importa o aggiorna una video pillola
 */
@Controller('sync')
export class SyncController {

  constructor(private readonly syncService: SyncService) {}

  @Post('video-pill')
  importVideoPill(@Body() dto: ImportVideoPillDto) {
    return this.syncService.importVideoPill(dto)
  }
}
