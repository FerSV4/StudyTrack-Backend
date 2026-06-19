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
    audit_logs: {
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

  it('el servicio debe instanciarse correctamente', () => {
    expect(service).toBeDefined();
  });

  //PRUEBA LOGIN

  it('permite iniciar sesión y entrega un token si las credenciales de la universidad son correctas', async () => {
    const dto = { email: 'marcelo.justiniano@ucb.edu.bo', password: 'MiPasswordSeguro123' };
    const realHash = await bcrypt.hash(dto.password, 10);
    const mockUser = {
      id: 'uuid-estudiante-001',
      email: dto.email,
      password_hash: realHash,
      role: 'user',
    };

    mockPrismaService.users.findUnique.mockResolvedValue(mockUser);
    mockJwtService.sign.mockReturnValue('jwt_token_valido');

    const result = await service.login(dto);

    expect(mockPrismaService.users.findUnique).toHaveBeenCalledWith({ where: { email: dto.email } });
    expect(result).toEqual({ access_token: 'jwt_token_valido' });
  });

  it('bloquea el acceso y lanza una alerta si el estudiante ingresa mal su contraseña', async () => {
    const dto = { email: 'marcelo.justiniano@ucb.edu.bo', password: 'clave_equivocada' };
    const realHash = await bcrypt.hash('clave-correcta', 10);
    const mockUser = {
      id: 'uuid-estudiante-001',
      email: dto.email,
      password_hash: realHash,
      role: 'user',
    };

    mockPrismaService.users.findUnique.mockResolvedValue(mockUser);

    await expect(service.login(dto)).rejects.toThrow(UnauthorizedException);
  });

  //PRUEBA REGISTRO

  it('crea una cuenta nueva, protege la contraseña con un hash y autentica al usuario', async () => {
    const dto = { email: 'camila.vargas@ucb.edu.bo', password: 'NuevaClave', fullName: 'Camila Vargas' };
    const mockCreatedUser = {
      id: 'uuid-estudiante-002',
      email: dto.email,
      role: 'user',
    };

    mockPrismaService.users.findUnique.mockResolvedValue(null);
    mockPrismaService.users.create.mockResolvedValue(mockCreatedUser);
    mockJwtService.sign.mockReturnValue('token_de_bienvenida');

    const result = await service.register(dto);

    expect(mockPrismaService.users.create).toHaveBeenCalledWith({
      data: {
        email: dto.email,
        password_hash: expect.any(String),
        full_name: dto.fullName,
      }
    });
    expect(result).toEqual({ access_token: 'token_de_bienvenida' });
  });

  it('evita crear cuentas duplicadas si un estudiante intenta registrarse con un correo que ya existe', async () => {
    const dto = { email: 'ya.registrado@ucb.edu.bo', password: '123', fullName: 'Estudiante Antiguo' };
    
    mockPrismaService.users.findUnique.mockResolvedValue({ id: 'uuid-existente' });

    await expect(service.register(dto)).rejects.toThrow(ConflictException);
  });

  //PRUEBA PERFIL

  it('devuelve los datos públicos del perfil cuando se solicita un ID válido', async () => {
    const userId = 'uuid-estudiante-003';
    const mockProfile = { id: userId, email: 'rodrigo.saucedo@ucb.edu.bo', full_name: 'Rodrigo Saucedo' };

    mockPrismaService.users.findUnique.mockResolvedValue(mockProfile);

    const result = await service.getUserProfile(userId);
    expect(result).toEqual(mockProfile);
  });

  it('arroja un error de no encontrado si se intenta consultar el perfil de un usuario fantasma', async () => {
    const userId = 'uuid-inexistente';
    mockPrismaService.users.findUnique.mockResolvedValue(null);

    await expect(service.getUserProfile(userId)).rejects.toThrow(NotFoundException);
  });
});