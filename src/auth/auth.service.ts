import { Injectable, UnauthorizedException, ConflictException, BadRequestException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcryptjs';
import { User, UserRole } from '../users/entities/user.entity';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { AuthResponseDto } from './dto/auth-response.dto';
import { UserResponseDto } from './dto/user-response.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { ChangePasswordDto } from './dto/change-password.dto';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    private jwtService: JwtService,
  ) {}

  async register(registerDto: RegisterDto): Promise<AuthResponseDto> {
    const { email, password, name, phone, role } = registerDto;

    // Check if user already exists
    const existingUser = await this.userRepository.findOne({
      where: { email },
    });
    if (existingUser) {
      throw new ConflictException('Bu e-posta adresi zaten kullanılıyor');
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    const user = this.userRepository.create({
      email,
      password: hashedPassword,
      name,
      phone,
      role: role || UserRole.CUSTOMER,
    });

    const savedUser = await this.userRepository.save(user);

    // Generate JWT token
    const payload = {
      sub: savedUser.id,
      email: savedUser.email,
      role: savedUser.role,
    };
    const token = this.jwtService.sign(payload);

    const userResponse = this.toUserResponseDto(savedUser);
    return {
      success: true,
      message: 'Hesap başarıyla oluşturuldu',
      user: userResponse,
      token,
    };
  }

  async login(loginDto: LoginDto): Promise<AuthResponseDto> {
    const { email, password } = loginDto;

    // Find user
    const user = await this.userRepository.findOne({ where: { email } });
    if (!user) {
      throw new UnauthorizedException('Geçersiz e-posta veya şifre');
    }

    // Check password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Geçersiz e-posta veya şifre');
    }

    // Check if user is active
    if (!user.isActive) {
      throw new UnauthorizedException('Hesabınız deaktif durumda');
    }

    // Generate JWT token
    const payload = { sub: user.id, email: user.email, role: user.role };
    const token = this.jwtService.sign(payload);

    const userResponse = this.toUserResponseDto(user);
    return {
      success: true,
      message: 'Giriş başarılı',
      user: userResponse,
      token,
    };
  }

  async validateUser(userId: string): Promise<UserResponseDto> {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new UnauthorizedException('Kullanıcı bulunamadı');
    }
    return this.toUserResponseDto(user);
  }

  async updateProfile(userId: string, updateProfileDto: UpdateProfileDto): Promise<AuthResponseDto> {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new UnauthorizedException('Kullanıcı bulunamadı');
    }

    // Check if email is being changed and if it's already in use
    if (updateProfileDto.email !== undefined && updateProfileDto.email !== user.email) {
      const existingUser = await this.userRepository.findOne({
        where: { email: updateProfileDto.email },
      });
      if (existingUser) {
        throw new ConflictException('Bu e-posta adresi zaten kullanılıyor');
      }
    }

    // Update user fields
    if (updateProfileDto.name !== undefined) {
      user.name = updateProfileDto.name;
    }
    if (updateProfileDto.email !== undefined) {
      user.email = updateProfileDto.email;
    }
    if (updateProfileDto.phone !== undefined) {
      user.phone = updateProfileDto.phone;
    }
    if (updateProfileDto.profileImageUrl !== undefined) {
      user.profileImageUrl = updateProfileDto.profileImageUrl;
    }

    const updatedUser = await this.userRepository.save(user);
    const userResponse = this.toUserResponseDto(updatedUser);

    return {
      success: true,
      message: 'Profil başarıyla güncellendi',
      user: userResponse,
    };
  }

  async changePassword(userId: string, changePasswordDto: ChangePasswordDto): Promise<AuthResponseDto> {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new UnauthorizedException('Kullanıcı bulunamadı');
    }

    // Verify current password
    const isCurrentPasswordValid = await bcrypt.compare(changePasswordDto.currentPassword, user.password);
    if (!isCurrentPasswordValid) {
      throw new BadRequestException('Mevcut şifre yanlış');
    }

    // Hash new password
    const hashedNewPassword = await bcrypt.hash(changePasswordDto.newPassword, 10);
    user.password = hashedNewPassword;

    await this.userRepository.save(user);
    const userResponse = this.toUserResponseDto(user);

    return {
      success: true,
      message: 'Şifre başarıyla değiştirildi',
      user: userResponse,
    };
  }

  private toUserResponseDto(user: User): UserResponseDto {
    const userResponse: UserResponseDto = {
      id: user.id,
      email: user.email,
      name: user.name,
      phone: user.phone ?? undefined,
      role: user.role,
      isActive: user.isActive,
      profileImageUrl: user.profileImageUrl ?? undefined,
      createdAt: user.createdAt,
    };
    return userResponse;
  }
}
