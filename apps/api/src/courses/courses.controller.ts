import { Controller, Get, Post, Put, Delete, Body, Param, NotFoundException, UseGuards } from '@nestjs/common'
import { CoursesService } from './courses.service'
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard'
import { RolesGuard } from '../auth/guards/roles.guard'
import { Roles } from '../auth/decorators/roles.decorator'

/**
 * CoursesController
 *
 * GET endpoints: pubblici (no auth) — servono alla home e al catalogo pubblico.
 * POST/PUT/DELETE: solo ADMIN e TEAM_ADMIN.
 */
@Controller('courses')
export class CoursesController {
  constructor(private readonly svc: CoursesService) {}

  // ── Endpoint pubblici ────────────────────────────────────────────────────────

  @Get()
  findAll() {
    return this.svc.findAll()
  }

  @Get(':slug')
  async findBySlug(@Param('slug') slug: string) {
    const course = await this.svc.findBySlug(slug)
    if (!course) throw new NotFoundException('Corso non trovato: ' + slug)
    return course
  }

  // ── Endpoint admin (solo ADMIN / TEAM_ADMIN) ─────────────────────────────────

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
