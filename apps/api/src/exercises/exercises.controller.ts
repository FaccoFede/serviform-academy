import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards } from '@nestjs/common'
import { ExercisesService } from './exercises.service'
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard'
import { RolesGuard } from '../auth/guards/roles.guard'
import { Roles } from '../auth/decorators/roles.decorator'

@Controller('exercises')
export class ExercisesController {
  constructor(private readonly svc: ExercisesService) {}

  /** GET /exercises — lista COMPLETA con corso/unità (usata dall'admin) */
  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'TEAM_ADMIN')
  findAll() {
    return this.svc.findAll()
  }

  /** GET /exercises/unit/:unitId — esercizi di una specifica unità (pubblico) */
  @Get('unit/:unitId')
  findByUnit(@Param('unitId') unitId: string) {
    return this.svc.findByUnit(unitId)
  }

  /** PUT /exercises/unit/:unitId/save-all — sostituisce in blocco le esercitazioni di un'unità */
  @Put('unit/:unitId/save-all')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'TEAM_ADMIN')
  saveAll(
    @Param('unitId') unitId: string,
    @Body() body: { exercises: { title: string; description?: string; htmlUrl?: string; evdUrl?: string }[] },
  ) {
    return this.svc.saveAll(unitId, body.exercises || [])
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.svc.findOne(id)
  }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'TEAM_ADMIN')
  create(@Body() body: { title: string; description?: string; htmlUrl?: string; evdUrl?: string; order?: number; unitId: string }) {
    return this.svc.create(body)
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'TEAM_ADMIN')
  update(@Param('id') id: string, @Body() body: { title?: string; description?: string; htmlUrl?: string; evdUrl?: string; order?: number }) {
    return this.svc.update(id, body)
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'TEAM_ADMIN')
  remove(@Param('id') id: string) {
    return this.svc.remove(id)
  }
}
