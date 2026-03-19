import { Controller, Get, Post, Body } from '@nestjs/common'
import { SoftwareService } from './software.service'
import { CreateSoftwareDto } from './dto/create-software.dto'

/**
 * Controller per la gestione dei software.
 *
 * I software rappresentano i prodotti Serviform:
 * EngView, Sysform, ProjectO.
 *
 * Endpoint:
 * - GET  /software   → lista tutti i software
 * - POST /software   → crea un nuovo software
 */
@Controller('software')
export class SoftwareController {

  constructor(private readonly softwareService: SoftwareService) {}

  @Get()
  findAll() {
    return this.softwareService.findAll()
  }

  @Post()
  create(@Body() dto: CreateSoftwareDto) {
    return this.softwareService.create(dto)
  }
}
