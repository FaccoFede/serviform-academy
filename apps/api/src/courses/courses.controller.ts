import { Controller, Get, Post, Put, Delete, Body, Param, NotFoundException } from '@nestjs/common'
import { CoursesService } from './courses.service'

@Controller('courses')
export class CoursesController {
  constructor(private readonly svc: CoursesService) {}

  @Get()
  findAll() { return this.svc.findAll() }

  @Get(':slug')
  async findBySlug(@Param('slug') slug: string) {
    const course = await this.svc.findBySlug(slug)
    if (!course) throw new NotFoundException('Corso non trovato: ' + slug)
    return course
  }

  @Post()
  create(@Body() body: any) { return this.svc.create(body) }

  @Put(':id')
  update(@Param('id') id: string, @Body() body: any) { return this.svc.update(id, body) }

  @Delete(':id')
  remove(@Param('id') id: string) { return this.svc.remove(id) }
}
