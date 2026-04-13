import { Controller, Get, Post, Put, Delete, Body, Param, NotFoundException, UseGuards, Request } from '@nestjs/common'
import { CoursesService } from './courses.service'
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard'
import { RolesGuard } from '../auth/guards/roles.guard'
import { Roles } from '../auth/decorators/roles.decorator'

@Controller('courses')
export class CoursesController {
  constructor(private readonly svc: CoursesService) {}

  /**
   * GET /courses — lista completa, nessun filtro aziendale.
   * Usata dall'admin e come lista pubblica del catalogo "marketing".
   */
  @Get()
  findAll() {
    return this.svc.findAll()
  }

  /**
   * GET /courses/portal — lista filtrata in base alle preferenze dell'azienda
   * dell'utente autenticato (visibleSoftwareIds). Richiede login.
   *
   * ⚠ IMPORTANTE: rotta definita PRIMA di `:slug` altrimenti Nest
   *    intenderebbe "portal" come uno slug corso.
   */
  @Get('portal')
  @UseGuards(JwtAuthGuard)
  findForPortal(@Request() req: any) {
    return this.svc.findVisibleForUser(req.user.id, req.user.role)
  }

  @Get(':slug')
  async findBySlug(@Param('slug') slug: string) {
    const c = await this.svc.findBySlug(slug)
    if (!c) throw new NotFoundException('Corso non trovato: ' + slug)
    return c
  }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'TEAM_ADMIN')
  create(@Body() body: any) {
    return this.svc.create(body)
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'TEAM_ADMIN')
  update(@Param('id') id: string, @Body() body: any) {
    return this.svc.update(id, body)
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'TEAM_ADMIN')
  remove(@Param('id') id: string) {
    return this.svc.remove(id)
  }
}
