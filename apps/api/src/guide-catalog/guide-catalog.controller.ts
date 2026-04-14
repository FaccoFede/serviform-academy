import {
  Controller, Get, Post, Put, Delete,
  Param, Body, UseGuards,
} from '@nestjs/common'
import { GuideCatalogService } from './guide-catalog.service'
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard'
import { RolesGuard } from '../auth/guards/roles.guard'
import { Roles } from '../auth/decorators/roles.decorator'

@Controller('guide-catalog')
export class GuideCatalogController {
  constructor(private readonly svc: GuideCatalogService) {}

  /** GET /guide-catalog — lista catalogo (accessibile agli autenticati) */
  @Get()
  @UseGuards(JwtAuthGuard)
  findAll() {
    return this.svc.findAll()
  }

  /** POST /guide-catalog — aggiunge una guida al catalogo */
  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'TEAM_ADMIN')
  create(@Body() body: { url: string; title?: string; zendeskId?: string }) {
    return this.svc.create(body)
  }

  /** PUT /guide-catalog/:id — aggiorna titolo/URL */
  @Put(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'TEAM_ADMIN')
  update(@Param('id') id: string, @Body() body: any) {
    return this.svc.update(id, body)
  }

  /** POST /guide-catalog/:id/refresh-title — ricarica il titolo dalla pagina */
  @Post(':id/refresh-title')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'TEAM_ADMIN')
  refresh(@Param('id') id: string) {
    return this.svc.refreshTitle(id)
  }

  /** DELETE /guide-catalog/:id — rimuove dal catalogo */
  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'TEAM_ADMIN')
  remove(@Param('id') id: string) {
    return this.svc.remove(id)
  }
}
