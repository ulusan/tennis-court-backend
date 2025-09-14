import { Controller, Get, Post, Body, Patch, Param, UseGuards, Request, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { ReservationsService } from './reservations.service';
import { CreateReservationDto } from './dto/create-reservation.dto';
import { CancelReservationDto } from './dto/cancel-reservation.dto';
import { ReservationResponseDto } from './dto/reservation-response.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

interface AuthenticatedRequest extends Request {
  user: {
    userId: string;
    role: string;
  };
}

@ApiTags('Reservations')
@Controller('reservations')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class ReservationsController {
  constructor(private readonly reservationsService: ReservationsService) {}

  @Post()
  @ApiOperation({ summary: 'Yeni rezervasyon oluştur' })
  @ApiResponse({ status: 201, description: 'Rezervasyon başarıyla oluşturuldu', type: ReservationResponseDto })
  @ApiResponse({ status: 400, description: 'Geçersiz rezervasyon verisi' })
  @ApiResponse({ status: 401, description: 'Yetkilendirme gerekli' })
  async create(
    @Body() createReservationDto: CreateReservationDto,
    @Request() req: AuthenticatedRequest,
  ): Promise<ReservationResponseDto> {
    return await this.reservationsService.create(createReservationDto, req.user.userId);
  }

  @Get()
  @ApiOperation({ summary: 'Tüm rezervasyonları listele' })
  @ApiResponse({ status: 200, description: 'Rezervasyon listesi', type: [ReservationResponseDto] })
  @ApiResponse({ status: 401, description: 'Yetkilendirme gerekli' })
  async findAll(@Request() req: AuthenticatedRequest): Promise<ReservationResponseDto[]> {
    return await this.reservationsService.findAll(req.user.userId, req.user.role);
  }

  @Get('past')
  @ApiOperation({ summary: 'Geçmiş rezervasyonları listele' })
  @ApiResponse({ status: 200, description: 'Geçmiş rezervasyon listesi', type: [ReservationResponseDto] })
  @ApiResponse({ status: 401, description: 'Yetkilendirme gerekli' })
  async getPastReservations(@Request() req: AuthenticatedRequest): Promise<ReservationResponseDto[]> {
    return await this.reservationsService.getPastReservations(req.user.userId, req.user.role);
  }

  @Get('upcoming')
  @ApiOperation({ summary: 'Gelecek rezervasyonları listele' })
  @ApiResponse({ status: 200, description: 'Gelecek rezervasyon listesi', type: [ReservationResponseDto] })
  @ApiResponse({ status: 401, description: 'Yetkilendirme gerekli' })
  async getUpcomingReservations(@Request() req: AuthenticatedRequest): Promise<ReservationResponseDto[]> {
    return await this.reservationsService.getUpcomingReservations(req.user.userId, req.user.role);
  }

  @Get('court/:courtId')
  @ApiOperation({ summary: 'Belirli bir kortun rezervasyonlarını listele' })
  @ApiResponse({ status: 200, description: 'Kort rezervasyon listesi', type: [ReservationResponseDto] })
  @ApiResponse({ status: 401, description: 'Yetkilendirme gerekli' })
  async getCourtReservations(
    @Param('courtId') courtId: string,
    @Query('date') date?: string,
  ): Promise<ReservationResponseDto[]> {
    return await this.reservationsService.getCourtReservations(courtId, date);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Rezervasyon detayını getir' })
  @ApiResponse({ status: 200, description: 'Rezervasyon detayı', type: ReservationResponseDto })
  @ApiResponse({ status: 401, description: 'Yetkilendirme gerekli' })
  @ApiResponse({ status: 403, description: 'Bu rezervasyona erişim yetkiniz yok' })
  @ApiResponse({ status: 404, description: 'Rezervasyon bulunamadı' })
  async findOne(@Param('id') id: string, @Request() req: AuthenticatedRequest): Promise<ReservationResponseDto> {
    return await this.reservationsService.findOne(id, req.user.userId, req.user.role);
  }

  @Patch(':id/cancel')
  @ApiOperation({ summary: 'Rezervasyonu iptal et' })
  @ApiResponse({ status: 200, description: 'Rezervasyon başarıyla iptal edildi', type: ReservationResponseDto })
  @ApiResponse({ status: 400, description: 'Rezervasyon iptal edilemez' })
  @ApiResponse({ status: 401, description: 'Yetkilendirme gerekli' })
  @ApiResponse({ status: 403, description: 'Bu rezervasyonu iptal etme yetkiniz yok' })
  @ApiResponse({ status: 404, description: 'Rezervasyon bulunamadı' })
  async cancel(
    @Param('id') id: string,
    @Body() cancelReservationDto: CancelReservationDto,
    @Request() req: AuthenticatedRequest,
  ): Promise<ReservationResponseDto> {
    return await this.reservationsService.cancel(id, cancelReservationDto, req.user.userId, req.user.role);
  }
}
