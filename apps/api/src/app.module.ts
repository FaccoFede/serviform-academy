import { Module } from '@nestjs/common'
import { PrismaModule } from './prisma/prisma.module'
import { UsersModule } from './users/users.module'
import { CoursesModule } from './courses/courses.module'
import { UnitsModule } from './units/units.module'
import { VideosModule } from './videos/videos.module';
import { GuidesModule } from './guides/guides.module';
import { SoftwareModule } from './software/software.module';
import { ProgressModule } from './progress/progress.module';
import { CertificatesModule } from './certificates/certificates.module';
import { SyncModule } from './sync/sync.module';

@Module({
  imports: [
    PrismaModule,
    UsersModule,
    CoursesModule,
    UnitsModule,
    VideosModule,
    GuidesModule,
    SoftwareModule,
    ProgressModule,
    CertificatesModule,
    SyncModule
  ],
})
export class AppModule {}