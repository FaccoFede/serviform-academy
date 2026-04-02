import {
  Controller, Post, Put, Get, Delete,
  Param, Body, UseGuards, NotFoundException,
} from '@nestjs/common'
import { GuidesService } from './guides.service'
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard'
import { RolesGuard } from '../auth/guards/roles.guard'
import { Roles } from '../auth/decorators/roles.decorator'

@Controller('guides')
export class GuidesController {
  constructor(private readonly svc: GuidesService) {}

  /**
   * GET /guides/unit/:unitId
   * Restituisce TUTTE le guide di un'unità (array, non oggetto singolo)
   */
  @Get('unit/:unitId')
  findByUnit(@Param('unitId') unitId: string) {
    return this.svc.findByUnit(unitId)
  }

  /**
   * POST /guides
   * Crea una nuova guida per un'unità (1:N — si possono creare quante se ne vuole)
   */
  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'TEAM_ADMIN')
  create(@Body() body: { unitId: string; zendeskId: string; title: string; url: string; order?: number }) {
    return this.svc.create(body)
  }

  /**
   * PUT /guides/:id
   * Aggiorna una guida esistente
   */
  @Put(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'TEAM_ADMIN')
  update(
    @Param('id') id: string,
    @Body() body: { zendeskId?: string; title?: string; url?: string; order?: number },
  ) {
    return this.svc.update(id, body)
  }

  /**
   * DELETE /guides/:id
   * Elimina una singola guida
   */
  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'TEAM_ADMIN')
  remove(@Param('id') id: string) {
    return this.svc.remove(id)
  }

  /**
   * DELETE /guides/unit/:unitId
   * Elimina TUTTE le guide di un'unità (usato quando si aggiornano le guide in blocco)
   */
  @Delete('unit/:unitId/all')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'TEAM_ADMIN')
  removeAll(@Param('unitId') unitId: string) {
    return this.svc.removeAllByUnit(unitId)
  }
}
