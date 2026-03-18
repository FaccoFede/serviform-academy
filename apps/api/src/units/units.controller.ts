import { Controller, Post, Body, Get, Param } from '@nestjs/common'
import { UnitsService } from './units.service'
import { CreateUnitDto } from './dto/create-unit.dto'

@Controller('units')
export class UnitsController {

  constructor(private readonly unitsService: UnitsService) {}

  @Post()
  create(@Body() dto: CreateUnitDto) {
    return this.unitsService.create(dto)
  }

  @Get(':courseSlug/:unitSlug')
  findBySlug(
  @Param('courseSlug') courseSlug: string,
  @Param('unitSlug') unitSlug: string
) {
  return this.unitsService.findBySlug(courseSlug, unitSlug)
}

}