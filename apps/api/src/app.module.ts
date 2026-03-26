import { Module } from '@nestjs/common'
import { PrismaModule } from './prisma/prisma.module'
import { AuthModule } from './auth/auth.module'
import { UsersModule } from './users/users.module'
import { CoursesModule } from './courses/courses.module'
import { UnitsModule } from './units/units.module'
import { GuidesModule } from './guides/guides.module'
import { SoftwareModule } from './software/software.module'
import { ProgressModule } from './progress/progress.module'
import { CertificatesModule } from './certificates/certificates.module'
import { ExercisesModule } from './exercises/exercises.module'
import { CompaniesModule } from './companies/companies.module'
import { AssignmentsModule } from './assignments/assignments.module'
import { AnnouncementsModule } from './announcements/announcements.module'

@Module({
  imports: [
    PrismaModule, AuthModule, UsersModule, CoursesModule, UnitsModule,
    GuidesModule, SoftwareModule, ProgressModule, CertificatesModule,
    ExercisesModule, CompaniesModule, AssignmentsModule, AnnouncementsModule,
  ],
})
export class AppModule {}
