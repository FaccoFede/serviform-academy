import { Controller, Post, Body, Get, Param, NotFoundException, UseGuards } from '@nestjs/common'
import { GuidesService } from './guides.service'
import { CreateGuideDto } from './dto/create-guide.dto'
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard'
import { RolesGuard } from '../auth/guards/roles.guard'
import { Roles } from '../auth/decorators/roles.decorator'

@Controller('guides')
export class GuidesController {
  constructor(private readonly guidesService: GuidesService) {}

  /** GET pubblico — usato dalla pagina unità per mostrare il link Zendesk */
  @Get('unit/:unitId')
  async findByUnit(@Param('unitId') unitId: string) {
    const guide = await this.guidesService.findByUnit(unitId)
    if (!guide) throw new NotFoundException(`Nessuna guida per l'unità ${unitId}`)
    return guide
  }

  /** POST admin — creazione guide da pannello */
  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'TEAM_ADMIN')
  create(@Body() dto: CreateGuideDto) {
    return this.guidesService.create(dto)
  }
}
