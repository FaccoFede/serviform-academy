import { Controller, Get, Post, Body, Param } from '@nestjs/common'
import { ProgressService } from './progress.service'
import { CompleteUnitDto } from './dto/complete-unit.dto'

/**
 * Controller per il tracciamento del progresso utente.
 *
 * Endpoint:
 * - POST /progress/complete                 → segna un'unità come completata
 * - GET  /progress/:userId/course/:courseSlug → progresso di un utente su un corso
 */
@Controller('progress')
export class ProgressController {

  constructor(private readonly progressService: ProgressService) {}

  /** Segna un'unità come completata per un utente */
  @Post('complete')
  complete(@Body() dto: CompleteUnitDto) {
    return this.progressService.markCompleted(dto.userId, dto.unitId)
  }

  /** Ottieni il progresso di un utente su un corso (completate / totale / percentuale) */
  @Get(':userId/course/:courseSlug')
  getCourseProgress(
    @Param('userId') userId: string,
    @Param('courseSlug') courseSlug: string,
  ) {
    return this.progressService.getCourseProgress(userId, courseSlug)
  }
}
