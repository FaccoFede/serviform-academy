import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards, Request, Query } from '@nestjs/common'
import { AnnouncementsService } from './announcements.service'
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard'
import { RolesGuard } from '../auth/guards/roles.guard'
import { Roles } from '../auth/decorators/roles.decorator'

@Controller('announcements')
export class AnnouncementsController {
  constructor(private readonly svc: AnnouncementsService) {}

  @Get()
  @UseGuards(JwtAuthGuard)
  findPublished(@Query('section') section?: string) {
    return this.svc.findPublished(section)
  }

  @Get('public')
  findPublic(@Query('section') section?: string) {
    return this.svc.findPublished(section)
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  findOne(@Param('id') id: string) { return this.svc.findOne(id) }

  @Get('admin/all')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'TEAM_ADMIN')
  findAll(@Query('section') section?: string) { return this.svc.findAll(section) }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'TEAM_ADMIN')
  create(@Request() req: any, @Body() body: any) { return this.svc.create(body, req.user.id) }

  @Put(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'TEAM_ADMIN')
  update(@Param('id') id: string, @Body() body: any) { return this.svc.update(id, body) }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'TEAM_ADMIN')
  remove(@Param('id') id: string) { return this.svc.remove(id) }
}
