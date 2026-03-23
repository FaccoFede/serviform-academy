import { Controller, Get, Post, Put, Body, Param } from '@nestjs/common'
import { SoftwareService } from './software.service'

@Controller('software')
export class SoftwareController {
  constructor(private readonly svc: SoftwareService) {}
  @Get() findAll() { return this.svc.findAll() }
  @Get(':slug') findBySlug(@Param('slug') slug: string) { return this.svc.findBySlug(slug) }
  @Post() create(@Body() body: any) { return this.svc.create(body) }
  @Put(':id') update(@Param('id') id: string, @Body() body: any) { return this.svc.update(id, body) }
}
