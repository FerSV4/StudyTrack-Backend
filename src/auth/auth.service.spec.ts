import { describe, it, expect, jest, beforeEach, afterEach } from '@jest/globals';
import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { PrismaService } from '../prisma/prisma.service';
import { JwtService } from '@nestjs/jwt';
import { UnauthorizedException, ConflictException, NotFoundException } from '@nestjs/common';
import * as bcrypt from 'bcryptjs';

describe('AuthService', () => {
  let service: AuthService;
  let prisma: PrismaService;
  let jwtService: JwtService;

  const mockPrismaService: any = {
    users: {
      findUnique: jest.fn(),
      create: jest.fn(),
    },
  };

  const mockJwtService: any = {
    sign: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: JwtService, useValue: mockJwtService },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    prisma = module.get<PrismaService>(PrismaService);
    jwtService = module.get<JwtService>(JwtService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('debería estar definido', () => {
    expect(service).toBeDefined();
  });

  //LOGIN

  it('debería retornar un access_token cuando el login es exitoso', async () => {
    const dto = { email: 'test@estudio.com', password: 'password123' };
    const realHash = await bcrypt.hash(dto.password, 10);

    const mockUser = {
      id: 'uuid-123',
      email: dto.email,
      password_hash: realHash,
      role: 'admin',
    };

    mockPrismaService.users.findUnique.mockResolvedValue(mockUser);
    mockJwtService.sign.mockReturnValue('jwt_token_generado');

    const result = await service.login(dto);

    expect(mockPrismaService.users.findUnique).toHaveBeenCalledWith({ where: { email: dto.email } });
    expect(result).toEqual({ access_token: 'jwt_token_generado' });
  });

  it('debería lanzar UnauthorizedException si la contraseña es incorrecta', async () => {
    const dto = { email: 'test@estudio.com', password: 'wrongpassword' };
    
    const realHash = await bcrypt.hash('password_correcta', 10);

    const mockUser = {
      id: 'uuid-123',
      email: dto.email,
      password_hash: realHash,
      role: 'user',
    };

    mockPrismaService.users.findUnique.mockResolvedValue(mockUser);

    await expect(service.login(dto)).rejects.toThrow(UnauthorizedException);
  });

  //REGISTER

  it('debería registrar un usuario nuevo, encriptar la contraseña y retornar un token', async () => {
    const dto = { email: 'nuevo@estudio.com', password: '123', fullName: 'Juan Perez' };
    const mockCreatedUser = {
      id: 'uuid-999',
      email: dto.email,
      role: 'user',
    };

    mockPrismaService.users.findUnique.mockResolvedValue(null);
    mockPrismaService.users.create.mockResolvedValue(mockCreatedUser);
    mockJwtService.sign.mockReturnValue('token_registro');

    const result = await service.register(dto);

    expect(mockPrismaService.users.create).toHaveBeenCalledWith({
      data: {
        email: dto.email,
        password_hash: expect.any(String),
        full_name: dto.fullName,
      }
    });
    expect(result).toEqual({ access_token: 'token_registro' });
  });

  it('debería lanzar ConflictException si el email de registro ya existe', async () => {
    const dto = { email: 'existe@estudio.com', password: '123', fullName: 'Juan' };
    mockPrismaService.users.findUnique.mockResolvedValue({ id: '1' });

    await expect(service.register(dto)).rejects.toThrow(ConflictException);
  });

  //PERFIL

  it('debería retornar el perfil del usuario si existe', async () => {
    const userId = 'uuid-123';
    const mockProfile = { id: userId, email: 'test@estudio.com', full_name: 'Test' };

    mockPrismaService.users.findUnique.mockResolvedValue(mockProfile);

    const result = await service.getUserProfile(userId);
    expect(result).toEqual(mockProfile);
  });

  it('debería lanzar NotFoundException si el perfil no existe', async () => {
    const userId = 'uuid-fantasma';
    mockPrismaService.users.findUnique.mockResolvedValue(null);

    await expect(service.getUserProfile(userId)).rejects.toThrow(NotFoundException);
  });
});