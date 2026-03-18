import { Controller, Post, Body, Get, Param } from '@nestjs/common'
import { GuidesService } from './guides.service'

@Controller('guides')
export class GuidesController {

  constructor(private guidesService: GuidesService) {}

  @Post()
  async create(@Body() body: any) {
    return this.guidesService.create(body)
  }

  @Get('unit/:unitId')
  async findByUnit(@Param('unitId') unitId: string) {
    return this.guidesService.findByUnit(unitId)
  }

}