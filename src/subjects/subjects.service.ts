import { Injectable, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class SubjectsService {
  constructor(private prisma: PrismaService) {}

  private async verifyOwnership(userId: string, subjectId: string) {
    const subject = await this.prisma.subjects.findUnique({
      where: { id: BigInt(subjectId) },
      include: { academic_terms: true }
    });
    if (!subject || subject.academic_terms.user_id !== userId) throw new ForbiddenException();
    return subject;
  }

  async create(userId: string, termId: string, data: { name: string, colorCode: string }) {
    const term = await this.prisma.academic_terms.findUnique({ where: { id: BigInt(termId) } });
    if (!term || term.user_id !== userId) throw new ForbiddenException();

    const subject = await this.prisma.subjects.create({
      data: {
        term_id: BigInt(termId),
        name: data.name,
        color_code: data.colorCode
      }
    });
    return { ...subject, id: subject.id.toString(), term_id: subject.term_id.toString() };
  }

  async update(userId: string, subjectId: string, data: { name?: string, colorCode?: string }) {
    await this.verifyOwnership(userId, subjectId);
    
    const updateData: any = {};
    if (data.name) updateData.name = data.name;
    if (data.colorCode) updateData.color_code = data.colorCode;

    const updated = await this.prisma.subjects.update({
      where: { id: BigInt(subjectId) },
      data: updateData
    });
    return { ...updated, id: updated.id.toString(), term_id: updated.term_id.toString() };
  }

  async delete(userId: string, subjectId: string) {
    await this.verifyOwnership(userId, subjectId);
    await this.prisma.subjects.delete({ where: { id: BigInt(subjectId) } });
    return { success: true };
  }
}