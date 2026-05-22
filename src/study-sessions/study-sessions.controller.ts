import { Controller, Post, Body, Param, UseGuards, Req, Patch } from '@nestjs/common';
import { StudySessionsService } from './study-sessions.service';
import { StartSessionDto } from './dto/start-session.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('study-sessions')
@UseGuards(JwtAuthGuard)
export class StudySessionsController {
  constructor(private readonly sessionsService: StudySessionsService) {}

  @Post('start')
  start(@Req() req: any, @Body() dto: StartSessionDto) {
    return this.sessionsService.startSession(req.user.userId, dto.taskId);
  }

  @Patch('finish/:id')
  finish(@Req() req: any, @Param('id') id: string) {
    return this.sessionsService.finishSession(req.user.userId, id);
  }
}