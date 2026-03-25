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

  // ── Azienda ──────────────────────────────────────────────────────────────────

  @Get('company/:companyId')
  findCompanyAssignments(@Param('companyId') companyId: string) {
    return this.svc.findCompanyAssignments(companyId)
  }

  @Post('company/:companyId/course/:courseId')
  assignToCompany(
    @Param('companyId') companyId: string,
    @Param('courseId') courseId: string,
    @Body() body: any,
    @Request() req: any,
  ) {
    return this.svc.assignCourseToCompany(companyId, courseId, body, req.user.id)
  }

  @Put('company/:id')
  updateCompanyAssignment(@Param('id') id: string, @Body() body: any) {
    return this.svc.updateCompanyAssignment(id, body)
  }

  @Delete('company/:id')
  removeCompanyAssignment(@Param('id') id: string) {
    return this.svc.removeCompanyAssignment(id)
  }

  // ── Utente ───────────────────────────────────────────────────────────────────

  @Get('user/:userId')
  findUserAssignments(@Param('userId') userId: string) {
    return this.svc.findUserAssignments(userId)
  }

  @Post('user/:userId/course/:courseId')
  assignToUser(
    @Param('userId') userId: string,
    @Param('courseId') courseId: string,
    @Body() body: any,
    @Request() req: any,
  ) {
    return this.svc.assignCourseToUser(userId, courseId, body, req.user.id)
  }

  @Delete('user/:id')
  removeUserAssignment(@Param('id') id: string) {
    return this.svc.removeUserAssignment(id)
  }
}
