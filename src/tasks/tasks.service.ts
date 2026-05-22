import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';

@Injectable()
export class TasksService {
  constructor(private prisma: PrismaService) {}

  private async verifyOwnership(userId: string, taskId: string) {
    const task = await this.prisma.tasks.findUnique({
      where: { id: BigInt(taskId) },
      include: { subjects: { include: { academic_terms: true } } }
    });

    if (!task) throw new NotFoundException();
    if (task.subjects.academic_terms.user_id !== userId) throw new ForbiddenException();

    return task;
  }

  async create(userId: string, dto: CreateTaskDto) {
    const subject = await this.prisma.subjects.findUnique({
      where: { id: BigInt(dto.subjectId) },
      include: { academic_terms: true }
    });

    if (!subject || subject.academic_terms.user_id !== userId) {
      throw new NotFoundException();
    }

    const task = await this.prisma.tasks.create({
      data: {
        subject_id: BigInt(dto.subjectId),
        title: dto.title,
        description: dto.description,
        due_date: new Date(dto.dueDate),
        estimated_hours: dto.estimatedHours,
        priority: dto.priority,
      },
    });

    return { ...task, id: task.id.toString(), subject_id: task.subject_id.toString() };
  }

  async findAllByUser(userId: string) {
    const tasks = await this.prisma.tasks.findMany({
      where: { subjects: { academic_terms: { user_id: userId } } },
      include: { subjects: { select: { name: true, color_code: true } } },
      orderBy: { due_date: 'asc' },
    });

    return tasks.map(task => ({
      ...task,
      id: task.id.toString(),
      subject_id: task.subject_id.toString()
    }));
  }

  async updateDetails(userId: string, taskId: string, dto: UpdateTaskDto) {
    await this.verifyOwnership(userId, taskId);

    const data: any = {};
    if (dto.title) data.title = dto.title;
    if (dto.description !== undefined) data.description = dto.description;
    if (dto.dueDate) data.due_date = new Date(dto.dueDate);
    if (dto.priority) data.priority = dto.priority;
    if (dto.estimatedHours) data.estimated_hours = dto.estimatedHours;
    
    if (dto.subjectId) {
      const subject = await this.prisma.subjects.findUnique({
        where: { id: BigInt(dto.subjectId) },
        include: { academic_terms: true }
      });
      if (!subject || subject.academic_terms.user_id !== userId) throw new ForbiddenException();
      data.subject_id = BigInt(dto.subjectId);
    }

    data.updated_at = new Date();

    const updated = await this.prisma.tasks.update({
      where: { id: BigInt(taskId) },
      data,
    });

    return { ...updated, id: updated.id.toString(), subject_id: updated.subject_id.toString() };
  }

  async updateStatus(userId: string, taskId: string, status: any) {
    await this.verifyOwnership(userId, taskId);

    const updated = await this.prisma.tasks.update({
      where: { id: BigInt(taskId) },
      data: { status, updated_at: new Date() },
    });

    return { ...updated, id: updated.id.toString(), subject_id: updated.subject_id.toString() };
  }

  async delete(userId: string, taskId: string) {
    await this.verifyOwnership(userId, taskId);

    await this.prisma.tasks.delete({
      where: { id: BigInt(taskId) },
    });

    return { success: true };
  }
}