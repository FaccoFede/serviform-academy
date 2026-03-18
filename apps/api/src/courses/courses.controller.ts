import { Controller, Get, Post, Body, Param } from '@nestjs/common'
import { CoursesService } from './courses.service'

@Controller('courses')
export class CoursesController {

  constructor(private coursesService: CoursesService) {}

  @Get()
  async findAll() {
    return this.coursesService.findAll()
  }

  @Get(':slug')
  async findBySlug(@Param('slug') slug: string) {
  return this.coursesService.findBySlug(slug)
}

  @Post()
  async create(@Body() body: any) {
    return this.coursesService.create(body)
  }

}