import { Controller, Get, Post, Body, Param, UseGuards, Request } from '@nestjs/common'
import { ProgressService } from './progress.service'
import { CompleteUnitDto } from './dto/complete-unit.dto'
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard'

@Controller('progress')
@UseGuards(JwtAuthGuard)
export class ProgressController {
  constructor(private readonly progressService: ProgressService) {}

  /** POST /progress/complete — userId dal JWT, mai dal body */
  @Post('complete')
  complete(@Request() req: any, @Body() dto: CompleteUnitDto) {
    return this.progressService.markCompleted(req.user.id, dto.unitId)
  }

  /** POST /progress/viewed — aggiorna lastViewed per "continua da dove eri" */
  @Post('viewed')
  markViewed(@Request() req: any, @Body() body: { unitId: string }) {
    return this.progressService.markViewed(req.user.id, body.unitId)
  }

  /** GET /progress/course/:courseSlug — { total, completed, percent } */
  @Get('course/:courseSlug')
  getCourseProgress(@Request() req: any, @Param('courseSlug') courseSlug: string) {
    return this.progressService.getCourseProgress(req.user.id, courseSlug)
  }

  /**
   * GET /progress/course/:courseSlug/completed-units
   * Restituisce l'array di unitId completate per un corso.
   * Usato dal frontend per pre-popolare il ProgressContext al caricamento del corso.
   * Senza questo endpoint, il Set si azzera ad ogni navigazione.
   */
  @Get('course/:courseSlug/completed-units')
  getCompletedUnits(@Request() req: any, @Param('courseSlug') courseSlug: string) {
    return this.progressService.getCompletedUnitIds(req.user.id, courseSlug)
  }

  /** GET /progress/last-viewed — resume widget dashboard */
  @Get('last-viewed')
  getLastViewed(@Request() req: any) {
    return this.progressService.getLastViewed(req.user.id)
  }

  /** GET /progress/all — KPI dashboard */
  @Get('all')
  getAllCourseProgress(@Request() req: any) {
    return this.progressService.getAllCourseProgressForUser(req.user.id)
  }
}
