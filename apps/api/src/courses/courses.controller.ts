import { Controller, Get, Post, Body, Param, NotFoundException } from '@nestjs/common'
import { CoursesService } from './courses.service'
import { CreateCourseDto } from './dto/create-course.dto'

/**
 * Controller per la gestione dei corsi.
 *
 * Endpoint:
 * - GET  /courses         → lista tutti i corsi (con software associato)
 * - GET  /courses/:slug   → dettaglio corso per slug (con unità ordinate)
 * - POST /courses         → crea un nuovo corso (validato da CreateCourseDto)
 */
@Controller('courses')
export class CoursesController {

  constructor(private readonly coursesService: CoursesService) {}

  /** Lista tutti i corsi, ordinati per data di creazione */
  @Get()
  async findAll() {
    return this.coursesService.findAll()
  }

  /** Dettaglio di un corso per slug, con unità didattiche ordinate */
  @Get(':slug')
  async findBySlug(@Param('slug') slug: string) {
    const course = await this.coursesService.findBySlug(slug)

    if (!course) {
      throw new NotFoundException(`Corso con slug "${slug}" non trovato`)
    }

    return course
  }

  /** Crea un nuovo corso — il body viene validato automaticamente dal ValidationPipe */
  @Post()
  async create(@Body() dto: CreateCourseDto) {
    return this.coursesService.create(dto)
  }
}
