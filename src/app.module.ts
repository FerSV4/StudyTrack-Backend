import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AuthModule } from './auth/auth.module';
import { TasksModule } from './tasks/tasks.module';
import { TermsModule } from './terms/terms.module';
import { SubjectsModule } from './subjects/subjects.module';
import { StudySessionsModule } from './study-sessions/study-sessions.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    AuthModule,
    TasksModule,
    TermsModule,
    SubjectsModule,
    StudySessionsModule,
  ],
})
export class AppModule {}