import {
  Controller, Get, Post, Put, Patch, Delete,
  Body, Param, UseGuards, Request, Query,
} from '@nestjs/common'
import { AnnouncementsService } from './announcements.service'
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard'
import { RolesGuard }   from '../auth/guards/roles.guard'
import { Roles }        from '../auth/decorators/roles.decorator'

/**
 * AnnouncementsController
 *
 * MODIFICHE rispetto alla versione repo:
 *
 * 1. GET / — ora passa req.user.id al service, che restituisce il campo
 *    `read: boolean` per ogni comunicazione (tracking lettura per utente).
 *
 * 2. PATCH /:id/read — NUOVO endpoint.
 *    Segna una comunicazione come letta per l'utente autenticato.
 *    Chiamato automaticamente da AnnouncementModal.tsx all'apertura.
 */
@Controller('announcements')
export class AnnouncementsController {
  constructor(private readonly svc: AnnouncementsService) {}

  // GET /announcements — lista comunicazioni pubblicate con campo read per utente
  @Get()
  @UseGuards(JwtAuthGuard)
  findPublished(@Query('section') section?: string, @Request() req?: any) {
    return this.svc.findPublished(section, req?.user?.id)
  }

  // GET /announcements/public — stesso endpoint senza auth (read sempre false)
  @Get('public')
  findPublic(@Query('section') section?: string) {
    return this.svc.findPublished(section)
  }

  // GET /announcements/admin/all — tutti (anche non pubblicati), solo admin
  @Get('admin/all')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'TEAM_ADMIN')
  findAll(@Query('section') section?: string) {
    return this.svc.findAll(section)
  }

  // GET /announcements/:id
  @Get(':id')
  @UseGuards(JwtAuthGuard)
  findOne(@Param('id') id: string) {
    return this.svc.findOne(id)
  }

  // PATCH /announcements/:id/read — segna come letta
  @Patch(':id/read')
  @UseGuards(JwtAuthGuard)
  markRead(@Param('id') id: string, @Request() req: any) {
    return this.svc.markRead(id, req.user.id)
  }

  // POST /announcements — crea (solo admin)
  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'TEAM_ADMIN')
  create(@Request() req: any, @Body() body: any) {
    return this.svc.create(body, req.user.id)
  }

  // PUT /announcements/:id — aggiorna (solo admin)
  @Put(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'TEAM_ADMIN')
  update(@Param('id') id: string, @Body() body: any) {
    return this.svc.update(id, body)
  }

  // DELETE /announcements/:id — elimina (solo admin)
  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'TEAM_ADMIN')
  remove(@Param('id') id: string) {
    return this.svc.remove(id)
  }
}
