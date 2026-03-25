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
import { AccessControlModule } from './access-control/access-control.module'

/**
 * AppModule — radice dell'applicazione.
 *
 * Moduli ATTIVI: auth, users, courses, units, guides, software,
 *   progress, certificates, exercises, companies, assignments,
 *   announcements, access-control.
 *
 * Moduli ISOLATI (file presenti ma non registrati):
 *   - PricingModule  → fuori scope definitivo
 *   - VideosModule   → videopillole disabilitate
 *   - SyncModule     → dipendente da Videos, isolato insieme
 *   - EventsModule   → fuori scope attivo
 */
@Module({
  imports: [
    PrismaModule,
    AuthModule,
    UsersModule,
    CoursesModule,
    UnitsModule,
    GuidesModule,
    SoftwareModule,
    ProgressModule,
    CertificatesModule,
    ExercisesModule,
    CompaniesModule,
    AssignmentsModule,
    AnnouncementsModule,
    AccessControlModule,
  ],
})
export class AppModule {}
