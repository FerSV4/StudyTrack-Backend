import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { Test, TestingModule } from '@nestjs/testing';
import { TasksService } from './tasks.service';
import { PrismaService } from '../prisma/prisma.service';
import { NotFoundException } from '@nestjs/common';

describe('TasksService', () => {
  let service: TasksService;
  let prisma: PrismaService;

const mockPrismaService: any = {tasks: {
      findMany: jest.fn(),
      create: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    subjects: {
      findUnique: jest.fn(),
    }
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TasksService,
        { provide: PrismaService, useValue: mockPrismaService },
      ],
    }).compile();

    service = module.get<TasksService>(TasksService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  it('debería estar definido', () => {
    expect(service).toBeDefined();
  });

  it('debería retornar estrictamente las tareas del usuario y formatear los BigInt a String', async () => {
    const userId = 'user-123';
    
    const mockDbTasks = [
      { 
        id: BigInt(101), 
        subject_id: BigInt(10), 
        title: 'Terminar CI/CD', 
        subjects: { name: 'App Web', color_code: '#FF0000' } 
      }
    ];
    
    mockPrismaService.tasks.findMany.mockResolvedValue(mockDbTasks);
    
    const result = await service.findAllByUser(userId);
    
    expect(mockPrismaService.tasks.findMany).toHaveBeenCalledWith({
      where: { subjects: { academic_terms: { user_id: userId } } },
      include: { subjects: { select: { name: true, color_code: true } } },
      orderBy: { due_date: 'asc' },
    });
    
    expect(result).toEqual([
      {
        id: '101',
        subject_id: '10',
        title: 'Terminar CI/CD',
        subjects: { name: 'App Web', color_code: '#FF0000' }
      }
    ]);
  });

  it('debería crear una tarea previa verificación de propiedad de la materia (subject)', async () => {
    const userId = 'user-123';
    const dto: any = { 
      subjectId: '10', 
      title: 'Dormir', 
      description: 'Test', 
      dueDate: '2026-10-10', 
      estimatedHours: 2, 
      priority: 'HIGH' 
    };

    mockPrismaService.subjects.findUnique.mockResolvedValue({
      id: BigInt(10),
      academic_terms: { user_id: userId }
    });

    const mockCreatedTask = {
      id: BigInt(1),
      subject_id: BigInt(10),
      title: dto.title,
      description: dto.description
    };
    mockPrismaService.tasks.create.mockResolvedValue(mockCreatedTask);

    const result = await service.create(userId, dto);
    
    expect(mockPrismaService.subjects.findUnique).toHaveBeenCalled();
    expect(mockPrismaService.tasks.create).toHaveBeenCalled();
    
    expect(result.id).toBe('1');
    expect(result.subject_id).toBe('10');
  });
});