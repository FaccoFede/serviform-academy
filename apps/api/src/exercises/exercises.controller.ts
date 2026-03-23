import { Controller, Get, Post, Put, Delete, Body, Param } from '@nestjs/common'
import { ExercisesService } from './exercises.service'

@Controller('exercises')
export class ExercisesController {
  constructor(private readonly svc: ExercisesService) {}

  @Get('unit/:unitId')
  findByUnit(@Param('unitId') unitId: string) { return this.svc.findByUnit(unitId) }

  @Get(':id')
  findOne(@Param('id') id: string) { return this.svc.findOne(id) }

  @Post()
  create(@Body() body: { title: string; description?: string; htmlUrl?: string; evdUrl?: string; order?: number; unitId: string }) {
    return this.svc.create(body)
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() body: { title?: string; description?: string; htmlUrl?: string; evdUrl?: string; order?: number }) {
    return this.svc.update(id, body)
  }

  @Delete(':id')
  remove(@Param('id') id: string) { return this.svc.remove(id) }
}
