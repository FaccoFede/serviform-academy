import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards } from '@nestjs/common'
import { ExercisesService } from './exercises.service'
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard'
import { RolesGuard } from '../auth/guards/roles.guard'
import { Roles } from '../auth/decorators/roles.decorator'

@Controller('exercises')
export class ExercisesController {
  constructor(private readonly svc: ExercisesService) {}

  /** GET pubblici — usati dalla pagina unità */
  @Get('unit/:unitId')
  findByUnit(@Param('unitId') unitId: string) { return this.svc.findByUnit(unitId) }

  @Get(':id')
  findOne(@Param('id') id: string) { return this.svc.findOne(id) }

  /** Mutanti — solo ADMIN */
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
