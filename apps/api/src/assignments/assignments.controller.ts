import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards, Request } from '@nestjs/common'
import { AssignmentsService } from './assignments.service'
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard'
import { RolesGuard } from '../auth/guards/roles.guard'
import { Roles } from '../auth/decorators/roles.decorator'

@Controller('assignments')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN', 'TEAM_ADMIN')
export class AssignmentsController {
  constructor(private readonly svc: AssignmentsService) {}
  @Get('company/:id') findByCompany(@Param('id') id: string) { return this.svc.findByCompany(id) }
  @Post('company/:cid/course/:rid') assignToCompany(@Param('cid') cid: string, @Param('rid') rid: string, @Body() body: any, @Request() req: any) { return this.svc.assignToCompany(cid, rid, body, req.user.id) }
  @Put('company/:id') updateCompany(@Param('id') id: string, @Body() body: any) { return this.svc.updateCompany(id, body) }
  @Delete('company/:id') removeCompany(@Param('id') id: string) { return this.svc.removeCompany(id) }
  @Get('user/:id') findByUser(@Param('id') id: string) { return this.svc.findByUser(id) }
  @Post('user/:uid/course/:cid') assignToUser(@Param('uid') uid: string, @Param('cid') cid: string, @Body() body: any, @Request() req: any) { return this.svc.assignToUser(uid, cid, body, req.user.id) }
  @Delete('user/:id') removeUser(@Param('id') id: string) { return this.svc.removeUser(id) }
}
