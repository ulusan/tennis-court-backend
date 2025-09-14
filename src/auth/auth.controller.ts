import { Controller, Post, Body, Get, Put, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { AuthResponseDto } from './dto/auth-response.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { UserResponseDto } from './dto/user-response.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { ChangePasswordDto } from './dto/change-password.dto';

interface AuthenticatedRequest extends Request {
  user: {
    userId: string;
    email: string;
    role: string;
  };
}

@ApiTags('Authentication')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  @ApiOperation({ summary: 'Kullanıcı kaydı' })
  @ApiResponse({
    status: 201,
    description: 'Hesap başarıyla oluşturuldu',
    type: AuthResponseDto,
  })
  @ApiResponse({
    status: 409,
    description: 'E-posta adresi zaten kullanılıyor',
  })
  async register(@Body() registerDto: RegisterDto): Promise<AuthResponseDto> {
    return this.authService.register(registerDto);
  }

  @Post('login')
  @ApiOperation({ summary: 'Kullanıcı girişi' })
  @ApiResponse({
    status: 200,
    description: 'Giriş başarılı',
    type: AuthResponseDto,
  })
  @ApiResponse({ status: 401, description: 'Geçersiz kimlik bilgileri' })
  async login(@Body() loginDto: LoginDto): Promise<AuthResponseDto> {
    return this.authService.login(loginDto);
  }

  @Get('profile')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Kullanıcı profili' })
  @ApiResponse({
    status: 200,
    description: 'Profil bilgileri',
    type: UserResponseDto,
  })
  @ApiResponse({ status: 401, description: 'Yetkilendirme gerekli' })
  async getProfile(@Request() req: AuthenticatedRequest): Promise<UserResponseDto> {
    const user = await this.authService.validateUser(req.user.userId);
    return user;
  }

  @Put('profile')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Profil güncelleme' })
  @ApiResponse({
    status: 200,
    description: 'Profil başarıyla güncellendi',
    type: AuthResponseDto,
  })
  @ApiResponse({ status: 401, description: 'Yetkilendirme gerekli' })
  @ApiResponse({ status: 400, description: 'Geçersiz veri' })
  async updateProfile(
    @Request() req: AuthenticatedRequest,
    @Body() updateProfileDto: UpdateProfileDto,
  ): Promise<AuthResponseDto> {
    return this.authService.updateProfile(req.user.userId, updateProfileDto);
  }

  @Put('change-password')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Şifre değiştirme' })
  @ApiResponse({
    status: 200,
    description: 'Şifre başarıyla değiştirildi',
    type: AuthResponseDto,
  })
  @ApiResponse({ status: 401, description: 'Yetkilendirme gerekli' })
  @ApiResponse({ status: 400, description: 'Mevcut şifre yanlış' })
  async changePassword(
    @Request() req: AuthenticatedRequest,
    @Body() changePasswordDto: ChangePasswordDto,
  ): Promise<AuthResponseDto> {
    return this.authService.changePassword(req.user.userId, changePasswordDto);
  }
}
