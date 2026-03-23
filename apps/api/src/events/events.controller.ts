import { Controller, Get, Post, Put, Delete, Body, Param } from '@nestjs/common'
import { EventsService } from './events.service'

@Controller('events')
export class EventsController {
  constructor(private readonly svc: EventsService) {}

  @Get() findAll() { return this.svc.findAll() }
  @Get('upcoming') findUpcoming() { return this.svc.findUpcoming() }
  @Get('past') findPast() { return this.svc.findPast() }
  @Get(':id') findOne(@Param('id') id: string) { return this.svc.findOne(id) }
  @Post() create(@Body() body: any) { return this.svc.create(body) }
  @Put(':id') update(@Param('id') id: string, @Body() body: any) { return this.svc.update(id, body) }
  @Delete(':id') remove(@Param('id') id: string) { return this.svc.remove(id) }
}
