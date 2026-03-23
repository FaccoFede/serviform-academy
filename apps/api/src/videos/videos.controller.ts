import { Controller, Get, Post, Put, Delete, Body, Param } from '@nestjs/common'
import { VideosService } from './videos.service'

@Controller('videos')
export class VideosController {
  constructor(private readonly svc: VideosService) {}
  @Get() findAll() { return this.svc.findAll() }
  @Get('software/:slug') findBySoftware(@Param('slug') slug: string) { return this.svc.findBySoftware(slug) }
  @Post() create(@Body() body: any) { return this.svc.create(body) }
  @Put(':id') update(@Param('id') id: string, @Body() body: any) { return this.svc.update(id, body) }
  @Delete(':id') remove(@Param('id') id: string) { return this.svc.remove(id) }
}
