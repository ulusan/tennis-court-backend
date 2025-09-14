import { Controller, Get, Patch, Param, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from './entities/user.entity';

@ApiTags('Users')
@Controller('users')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @ApiOperation({ summary: 'Tüm kullanıcıları listele (Admin/Manager)' })
  @ApiResponse({ status: 200, description: 'Kullanıcı listesi' })
  findAll() {
    return this.usersService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Kullanıcı detayını getir' })
  @ApiResponse({ status: 200, description: 'Kullanıcı detayı' })
  @ApiResponse({ status: 404, description: 'Kullanıcı bulunamadı' })
  findOne(@Param('id') id: string) {
    return this.usersService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Kullanıcı profilini güncelle' })
  @ApiResponse({ status: 200, description: 'Profil başarıyla güncellendi' })
  @ApiResponse({ status: 404, description: 'Kullanıcı bulunamadı' })
  updateProfile(
    @Param('id') id: string,
    @Body() updateData: Partial<{ name: string; phone: string; profileImageUrl: string }>,
  ) {
    return this.usersService.updateProfile(id, updateData);
  }
}
