import { Controller, Post, Body, Get, Param, NotFoundException } from '@nestjs/common'
import { GuidesService } from './guides.service'
import { CreateGuideDto } from './dto/create-guide.dto'

/**
 * Controller per le guide di riferimento Zendesk.
 *
 * Ogni guida è collegata a una singola unità (relazione 1:1).
 *
 * Endpoint:
 * - POST /guides            → crea una nuova guida
 * - GET  /guides/unit/:unitId → ottieni la guida di un'unità
 */
@Controller('guides')
export class GuidesController {

  constructor(private readonly guidesService: GuidesService) {}

  @Post()
  async create(@Body() dto: CreateGuideDto) {
    return this.guidesService.create(dto)
  }

  @Get('unit/:unitId')
  async findByUnit(@Param('unitId') unitId: string) {
    const guide = await this.guidesService.findByUnit(unitId)

    if (!guide) {
      throw new NotFoundException(`Nessuna guida trovata per l'unità ${unitId}`)
    }

    return guide
  }
}
