import { Controller, Get, Post, Put, Delete, Body, Param } from '@nestjs/common'
import { PricingService } from './pricing.service'

@Controller('pricing')
export class PricingController {
  constructor(private readonly svc: PricingService) {}
  @Get() findAll() { return this.svc.findAll() }
  @Get(':id') findOne(@Param('id') id: string) { return this.svc.findOne(id) }
  @Post() create(@Body() body: any) { return this.svc.create(body) }
  @Put(':id') update(@Param('id') id: string, @Body() body: any) { return this.svc.update(id, body) }
  @Delete(':id') remove(@Param('id') id: string) { return this.svc.remove(id) }
}
