import {
  Controller, Post, UseGuards, UseInterceptors,
  UploadedFile, Body, Request, BadRequestException,
} from '@nestjs/common'
import { FileInterceptor } from '@nestjs/platform-express'
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard'
import { RolesGuard } from '../auth/guards/roles.guard'
import { Roles } from '../auth/decorators/roles.decorator'
import { ImportsService } from './imports.service'

@Controller('imports')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN', 'TEAM_ADMIN')
export class ImportsController {
  constructor(private readonly svc: ImportsService) {}

  @Post('csv')
  @UseInterceptors(FileInterceptor('file'))
  async importCsv(
    @UploadedFile() file: Express.Multer.File,
    @Body('type') type: string,
    @Request() req: any,
  ) {
    if (!file) throw new BadRequestException('File CSV mancante')
    if (!['companies', 'users'].includes(type)) {
      throw new BadRequestException('type deve essere "companies" o "users"')
    }
    const csv = file.buffer.toString('utf-8')
    if (type === 'companies') return this.svc.importCompanies(csv, req.user.id)
    return this.svc.importUsers(csv, req.user.id)
  }
}
