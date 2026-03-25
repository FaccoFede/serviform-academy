import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards } from '@nestjs/common'
import { CompaniesService } from './companies.service'
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard'
import { RolesGuard } from '../auth/guards/roles.guard'
import { Roles } from '../auth/decorators/roles.decorator'

@Controller('companies')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN', 'TEAM_ADMIN')
export class CompaniesController {
  constructor(private readonly svc: CompaniesService) {}

  @Get()
  findAll() { return this.svc.findAll() }

  @Get(':id')
  findById(@Param('id') id: string) { return this.svc.findById(id) }

  @Post()
  create(@Body() body: any) { return this.svc.create(body) }

  @Put(':id')
  update(@Param('id') id: string, @Body() body: any) { return this.svc.update(id, body) }

  @Delete(':id')
  remove(@Param('id') id: string) { return this.svc.remove(id) }
}
