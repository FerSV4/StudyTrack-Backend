import { Controller, Get, UseGuards } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { AdminGuard } from '../auth/admin.guard';

@Controller('admin')
@UseGuards(JwtAuthGuard, AdminGuard)
export class AdminController {
  constructor(private readonly prisma: PrismaService) {}

  @Get('logs')
  async getSystemLogs() {
    const logs = await this.prisma.audit_logs.findMany({
      take: 50,
      orderBy: { created_at: 'desc' },
      include: {
        users: {
          select: { email: true, full_name: true },
        },
      },
    });

    return logs.map((log) => ({
      ...log,
      id: log.id.toString(),
    }));
  }

  @Get('stats')
  async getDashboardStats() {
    const [totalUsers, totalTasks, completedTasks] = await Promise.all([
      this.prisma.users.count(),
      this.prisma.tasks.count(),
      this.prisma.tasks.count({ where: { status: 'completed' } }),
    ]);

    const completionRate = totalTasks > 0 
      ? Math.round((completedTasks / totalTasks) * 100) 
      : 0;

    return {
      totalUsers,
      totalTasks,
      completedTasks,
      completionRate,
    };
  }
}