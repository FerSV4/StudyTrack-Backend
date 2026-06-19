import { Injectable, UnauthorizedException, ConflictException, NotFoundException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../prisma/prisma.service';
import { RegisterDto, LoginDto } from './dto/auth.dto';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
  ) {}

  async register(dto: RegisterDto) {
    const userExists = await this.prisma.users.findUnique({
      where: { email: dto.email },
    });

    if (userExists) {
      throw new ConflictException('Email already in use');
    }

    const password_hash = await bcrypt.hash(dto.password, 10);

    const user = await this.prisma.users.create({
      data: {
        email: dto.email,
        password_hash,
        full_name: dto.fullName,
      },
    });

    await this.prisma.audit_logs.create({
      data: {
        user_id: user.id,
        action: 'REGISTRO',
        details: `Nuevo usuario registrado: ${user.email}`,
      },
    });

    return this.generateToken(user.id, user.email, user.role ?? 'user');
  }

  async login(dto: LoginDto) {
    const user = await this.prisma.users.findUnique({
      where: { email: dto.email },
    });

    if (!user) {
      await this.prisma.audit_logs.create({
        data: {
          user_id: null,
          action: 'LOGIN_FALLIDO',
          details: `Intento de acceso con correo inexistente: ${dto.email}`,
        },
      });
      throw new UnauthorizedException('Invalid credentials');
    }

    const isPasswordValid = await bcrypt.compare(dto.password, user.password_hash);

    if (!isPasswordValid) {
      await this.prisma.audit_logs.create({
        data: {
          user_id: user.id,
          action: 'LOGIN_FALLIDO',
          details: `Contraseña incorrecta para el correo: ${dto.email}`,
        },
      });
      throw new UnauthorizedException('Invalid credentials');
    }

    await this.prisma.audit_logs.create({
      data: {
        user_id: user.id,
        action: 'LOGIN_EXITOSO',
        details: `Inicio de sesión exitoso`,
      },
    });

    return this.generateToken(user.id, user.email, user.role ?? 'user');
  }

  private generateToken(id: string, email: string, role: string) {
    const payload = { sub: id, email, role };
    return {
      access_token: this.jwtService.sign(payload),
    };
  }

  async getUserProfile(userId: string) {
    const user = await this.prisma.users.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        full_name: true,
        role: true,
        subscription_tier: true,
        timezone: true,
        created_at: true,
      },
    });
    
    if (!user) throw new NotFoundException('Usuario no encontrado');
    
    return user;
  }
}