import { Controller, Get, Post, Put, Delete, Body, Param, NotFoundException } from '@nestjs/common'
import { UnitsService } from './units.service'

@Controller('units')
export class UnitsController {
  constructor(private readonly svc: UnitsService) {}

  @Get('course/:courseId')
  findByCourse(@Param('courseId') courseId: string) { return this.svc.findByCourse(courseId) }

  @Get(':courseSlug/:unitSlug')
  async findBySlug(@Param('courseSlug') cs: string, @Param('unitSlug') us: string) {
    const unit = await this.svc.findBySlug(cs, us)
    if (!unit) throw new NotFoundException('Unita non trovata')
    return unit
  }

  @Post()
  create(@Body() body: any) { return this.svc.create(body) }

  @Put(':id')
  update(@Param('id') id: string, @Body() body: any) { return this.svc.update(id, body) }

  @Delete(':id')
  remove(@Param('id') id: string) { return this.svc.remove(id) }
}
