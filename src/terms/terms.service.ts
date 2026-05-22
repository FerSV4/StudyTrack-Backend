import { ForbiddenException, Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateTermDto } from './dto/create-term.dto';

@Injectable()
export class TermsService {
  constructor(private prisma: PrismaService) {}

  async create(userId: string, dto: CreateTermDto) {
    const term = await this.prisma.academic_terms.create({
      data: {
        user_id: userId,
        name: dto.name,
        start_date: new Date(dto.startDate),
        end_date: new Date(dto.endDate),
        is_active: true,
      },
    });
    return { ...term, id: term.id.toString() };
  }

  async getActiveTree(userId: string) {
    const activeTerm = await this.prisma.academic_terms.findFirst({
      where: { user_id: userId, is_active: true },
      include: {
        subjects: {
          include: {
            tasks: {
              where: { status: 'pending' },
              orderBy: { due_date: 'asc' }
            }
          }
        }
      }
    });

    if (!activeTerm) return null;

    return {
      ...activeTerm,
      id: activeTerm.id.toString(),
      subjects: activeTerm.subjects.map(sub => ({
        ...sub,
        id: sub.id.toString(),
        term_id: sub.term_id.toString(),
        tasks: sub.tasks.map(task => ({
          ...task,
          id: task.id.toString(),
          subject_id: task.subject_id.toString()
        }))
      }))
    };
  }
  async delete(userId: string, termId: string) {
    const term = await this.prisma.academic_terms.findUnique({ where: { id: BigInt(termId) } });
    if (!term || term.user_id !== userId) throw new ForbiddenException();
  
    await this.prisma.academic_terms.delete({ where: { id: BigInt(termId) } });
  return { success: true };
}
}