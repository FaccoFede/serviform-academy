import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards } from '@nestjs/common'
import { UsersService } from './users.service'
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard'
import { RolesGuard } from '../auth/guards/roles.guard'
import { Roles } from '../auth/decorators/roles.decorator'

/**
 * UsersController — tutti gli endpoint richiedono ruolo ADMIN o TEAM_ADMIN.
 * Gli utenti normali non devono poter leggere la lista di altri utenti.
 */
@Controller('users')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN', 'TEAM_ADMIN')
export class UsersController {
  constructor(private readonly svc: UsersService) {}

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
