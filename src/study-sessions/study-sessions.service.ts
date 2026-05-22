import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class StudySessionsService {
  constructor(private prisma: PrismaService) {}

  async startSession(userId: string, taskId: string) {
    const task = await this.prisma.tasks.findUnique({
      where: { id: BigInt(taskId) },
      include: { subjects: { include: { academic_terms: true } } }
    });

    if (!task || task.subjects.academic_terms.user_id !== userId) {
      throw new NotFoundException('Tarea no encontrada');
    }

    const session = await this.prisma.study_sessions.create({
      data: {
        task_id: BigInt(taskId),
        start_time: new Date(),
      }
    });

    return { 
      ...session, 
      id: session.id.toString(), 
      task_id: session.task_id.toString() 
    };
  }

  async finishSession(userId: string, sessionId: string) {
    const session = await this.prisma.study_sessions.findUnique({
      where: { id: BigInt(sessionId) },
      include: { tasks: { include: { subjects: { include: { academic_terms: true } } } } }
    });

    if (!session || session.tasks.subjects.academic_terms.user_id !== userId) {
      throw new NotFoundException('Sesión no encontrada');
    }

    const updated = await this.prisma.study_sessions.update({
      where: { id: BigInt(sessionId) },
      data: {
        end_time: new Date(),
        is_completed: true // Asumiendo que tienes este campo por el error de Prisma
      }
    });

    return { 
      ...updated, 
      id: updated.id.toString(), 
      task_id: updated.task_id.toString() 
    };
  }
}