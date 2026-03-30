import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards } from '@nestjs/common'
import { EventsService } from './events.service'
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard'
import { RolesGuard } from '../auth/guards/roles.guard'
import { Roles } from '../auth/decorators/roles.decorator'

/**
 * EventsController
 *
 * GET pubblici — nessuna autenticazione richiesta per leggere eventi.
 * POST / PUT / DELETE — richiede ADMIN o TEAM_ADMIN.
 *
 * FIX v2: separato il path admin/all dal path pubblico per evitare conflitti.
 * FIX v2: payload date ora viene parsato nel service con validazione esplicita.
 */
@Controller('events')
export class EventsController {
  constructor(private readonly svc: EventsService) {}

  @Get()
  findAll() { return this.svc.findAll() }

  @Get('admin/all')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'TEAM_ADMIN')
  findAllAdmin() { return this.svc.findAllAdmin() }

  @Get('upcoming')
  findUpcoming() { return this.svc.findUpcoming() }

  @Get('past')
  findPast() { return this.svc.findPast() }

  @Get(':id')
  findOne(@Param('id') id: string) { return this.svc.findOne(id) }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'TEAM_ADMIN')
  create(@Body() body: any) { return this.svc.create(body) }

  @Put(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'TEAM_ADMIN')
  update(@Param('id') id: string, @Body() body: any) { return this.svc.update(id, body) }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'TEAM_ADMIN')
  remove(@Param('id') id: string) { return this.svc.remove(id) }
}
