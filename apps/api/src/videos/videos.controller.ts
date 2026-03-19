import { Controller, Get, Post, Body, Param } from '@nestjs/common'
import { VideosService } from './videos.service'
import { CreateVideoPillDto } from './dto/create-video-pill.dto'

/**
 * Controller per le video pillole.
 *
 * Le video pillole sono contenuti brevi collegati a un software.
 * Ogni pillola ha un youtubeId per il player embedded.
 *
 * Endpoint:
 * - GET  /videos               → tutte le video pillole
 * - GET  /videos/software/:slug → video pillole filtrate per software
 * - POST /videos               → crea una nuova video pillola
 */
@Controller('videos')
export class VideosController {

  constructor(private readonly videosService: VideosService) {}

  @Post()
  create(@Body() dto: CreateVideoPillDto) {
    return this.videosService.create(dto)
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
