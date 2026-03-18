import { Controller, Get, Post, Body } from '@nestjs/common'
import { SoftwareService } from './software.service'

@Controller('software')
export class SoftwareController {

  constructor(private readonly softwareService: SoftwareService) {}

  @Get()
  findAll() {
    return this.softwareService.findAll()
  }

  @Post()
  create(@Body() body: { name: string; slug: string }) {
    return this.softwareService.create(body)
  }

}