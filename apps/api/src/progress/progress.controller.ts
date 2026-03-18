import { Controller, Get, Post, Body, Param } from '@nestjs/common'
import { ProgressService } from './progress.service'

@Controller('progress')
export class ProgressController {
  constructor(private readonly progressService: ProgressService) {}

  @Post('complete')
  complete(@Body() body: { userId: string; unitId: string }) {
    return this.progressService.markCompleted(body.userId, body.unitId)
  }

  @Get(':userId/course/:courseSlug')
  getCourseProgress(
    @Param('userId') userId: string,
    @Param('courseSlug') courseSlug: string
  ) {
    return this.progressService.getCourseProgress(userId, courseSlug)
  }
}