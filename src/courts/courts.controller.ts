import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { CourtsService } from './courts.service';
import { CreateCourtDto } from './dto/create-court.dto';
import { UpdateCourtDto } from './dto/update-court.dto';
import { Court } from './entities/court.entity';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../users/entities/user.entity';

@ApiTags('Courts')
@Controller('courts')
export class CourtsController {
  constructor(private readonly courtsService: CourtsService) {}

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Yeni kort oluştur (Admin/Manager)' })
  @ApiResponse({ status: 201, description: 'Kort başarıyla oluşturuldu' })
  @ApiResponse({ status: 401, description: 'Yetkilendirme gerekli' })
  @ApiResponse({ status: 403, description: 'Yetki yetersiz' })
  create(@Body() createCourtDto: CreateCourtDto) {
    return this.courtsService.create(createCourtDto);
  }

  @Get()
  @ApiOperation({ summary: 'Tüm kortları listele' })
  @ApiResponse({ status: 200, description: 'Kort listesi' })
  findAll(@Query('available') available?: string): Promise<Court[]> {
    if (available === 'true') {
      return this.courtsService.findAvailable();
    }
    return this.courtsService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Kort detayını getir' })
  @ApiResponse({ status: 200, description: 'Kort detayı' })
  @ApiResponse({ status: 404, description: 'Kort bulunamadı' })
  findOne(@Param('id') id: string): Promise<Court> {
    return this.courtsService.findOne(id);
  }

  @Get(':id/reserved-slots')
  @ApiOperation({ summary: 'Kortun rezerve edilmiş saatlerini getir (Flutter için)' })
  @ApiResponse({ status: 200, description: 'Rezerve edilmiş saatler' })
  @ApiResponse({ status: 404, description: 'Kort bulunamadı' })
  getReservedSlots(@Param('id') id: string, @Query('date') date?: string) {
    return this.courtsService.getCourtReservedSlots(id, date);
  }

  @Get(':id/availability')
  @ApiOperation({ summary: 'Kort müsaitlik durumunu getir (detaylı)' })
  @ApiResponse({ status: 200, description: 'Müsaitlik durumu' })
  @ApiResponse({ status: 404, description: 'Kort bulunamadı' })
  getAvailability(@Param('id') id: string, @Query('date') date: string) {
    const targetDate = date ? new Date(date) : new Date();
    return this.courtsService.getCourtAvailability(id, targetDate);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Kort güncelle (Admin/Manager)' })
  @ApiResponse({ status: 200, description: 'Kort başarıyla güncellendi' })
  @ApiResponse({ status: 401, description: 'Yetkilendirme gerekli' })
  @ApiResponse({ status: 403, description: 'Yetki yetersiz' })
  @ApiResponse({ status: 404, description: 'Kort bulunamadı' })
  update(@Param('id') id: string, @Body() updateCourtDto: UpdateCourtDto) {
    return this.courtsService.update(id, updateCourtDto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Kort sil (Admin)' })
  @ApiResponse({ status: 200, description: 'Kort başarıyla silindi' })
  @ApiResponse({ status: 401, description: 'Yetkilendirme gerekli' })
  @ApiResponse({ status: 403, description: 'Yetki yetersiz' })
  @ApiResponse({ status: 404, description: 'Kort bulunamadı' })
  remove(@Param('id') id: string) {
    return this.courtsService.remove(id);
  }
}
