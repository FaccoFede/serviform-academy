import { Controller, Get, Post, Put, Body, Param, UseGuards } from '@nestjs/common'
import { SoftwareService } from './software.service'
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard'
import { RolesGuard } from '../auth/guards/roles.guard'
import { Roles } from '../auth/decorators/roles.decorator'

/**
 * SoftwareController
 * GET: pubblici — usati dal catalogo e dalla home per i brand.
 * POST/PUT: solo ADMIN/TEAM_ADMIN.
 */
@Controller('software')
export class SoftwareController {
  constructor(private readonly svc: SoftwareService) {}

  @Get()
  findAll() { return this.svc.findAll() }

  @Get(':slug')
  findBySlug(@Param('slug') slug: string) { return this.svc.findBySlug(slug) }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'TEAM_ADMIN')
  create(@Body() body: any) { return this.svc.create(body) }

  @Put(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'TEAM_ADMIN')
  update(@Param('id') id: string, @Body() body: any) { return this.svc.update(id, body) }
}
