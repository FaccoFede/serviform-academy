import { Controller, Get, Post, Body, Param } from '@nestjs/common'
import { VideosService } from './videos.service'

@Controller('videos')
export class VideosController {

  constructor(private readonly videosService: VideosService) {}

  @Post()
  create(@Body() body: {
    title: string
    youtubeId: string
    softwareId: string
    description?: string
  }) {
    return this.videosService.create(body)
  }

  @Get()
  findAll() {
    return this.videosService.findAll()
  }

  @Get('software/:slug')
  findBySoftware(@Param('slug') slug: string) {
    return this.videosService.findBySoftware(slug)
  }

}