import { Controller, Get, Post, Put, Delete, Body, Param, NotFoundException, UseGuards } from '@nestjs/common'
import { UnitsService } from './units.service'
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard'
import { RolesGuard } from '../auth/guards/roles.guard'
import { Roles } from '../auth/decorators/roles.decorator'

@Controller('units')
export class UnitsController {
  constructor(private readonly svc: UnitsService) {}

  // ── Pubblici ──────────────────────────────────────────────────────────────────

  @Get('course/:courseId')
  findByCourse(@Param('courseId') courseId: string) {
    return this.svc.findByCourse(courseId)
  }

  @Get(':courseSlug/:unitSlug')
  async findBySlug(
    @Param('courseSlug') cs: string,
    @Param('unitSlug') us: string,
  ) {
    const unit = await this.svc.findBySlug(cs, us)
    if (!unit) throw new NotFoundException('Unità non trovata')
    return unit
  }

  // ── Admin ─────────────────────────────────────────────────────────────────────

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'TEAM_ADMIN')
  create(@Body() body: any) {
    return this.svc.create(body)
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'TEAM_ADMIN')
  update(@Param('id') id: string, @Body() body: any) {
    return this.svc.update(id, body)
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'TEAM_ADMIN')
  remove(@Param('id') id: string) {
    return this.svc.remove(id)
  }
}
