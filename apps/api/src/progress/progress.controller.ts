import { Controller, Get, Post, Body, Param, UseGuards, Request } from '@nestjs/common'
import { ProgressService } from './progress.service'
import { CompleteUnitDto } from './dto/complete-unit.dto'
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard'

@Controller('progress')
@UseGuards(JwtAuthGuard)
export class ProgressController {
  constructor(private readonly progressService: ProgressService) {}

  @Post('complete')
  complete(@Request() req: any, @Body() dto: CompleteUnitDto) {
    return this.progressService.markCompleted(req.user.id, dto.unitId)
  }

  @Post('viewed')
  markViewed(@Request() req: any, @Body() body: { unitId: string }) {
    return this.progressService.markViewed(req.user.id, body.unitId)
  }

  @Get('course/:courseSlug')
  getCourseProgress(@Request() req: any, @Param('courseSlug') courseSlug: string) {
    return this.progressService.getCourseProgress(req.user.id, courseSlug)
  }

  @Get('course/:courseSlug/completed-units')
  getCompletedUnits(@Request() req: any, @Param('courseSlug') courseSlug: string) {
    return this.progressService.getCompletedUnitIds(req.user.id, courseSlug)
  }

  @Get('last-viewed')
  getLastViewed(@Request() req: any) {
    return this.progressService.getLastViewed(req.user.id)
  }

  @Get('all')
  getAll(@Request() req: any) {
    return this.progressService.getAllCourseProgressForUser(req.user.id)
  }
}
