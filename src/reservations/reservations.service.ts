import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, LessThan, MoreThanOrEqual } from 'typeorm';
import { Reservation, ReservationStatus } from './entities/reservation.entity';
import { Court } from '../courts/entities/court.entity';
import { User } from '../users/entities/user.entity';
import { CreateReservationDto } from './dto/create-reservation.dto';
import { CancelReservationDto } from './dto/cancel-reservation.dto';
import { ReservationResponseDto, CourtResponseDto } from './dto/reservation-response.dto';

@Injectable()
export class ReservationsService {
  constructor(
    @InjectRepository(Reservation)
    private reservationRepository: Repository<Reservation>,
    @InjectRepository(Court)
    private courtRepository: Repository<Court>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
  ) {}

  async create(createReservationDto: CreateReservationDto, userId: string): Promise<ReservationResponseDto> {
    const { courtId, startTime, endTime, notes } = createReservationDto;

    // Validate court exists
    const court = await this.courtRepository.findOne({ where: { id: courtId } });
    if (!court) {
      throw new NotFoundException('Kort bulunamadı');
    }

    // Validate user exists
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('Kullanıcı bulunamadı');
    }

    // Validate court is available
    if (!court.isAvailable) {
      throw new BadRequestException('Kort şu anda müsait değil');
    }

    // Check for time conflicts
    const start = new Date(startTime);
    const end = new Date(endTime);

    if (start >= end) {
      throw new BadRequestException('Başlangıç saati bitiş saatinden önce olmalıdır');
    }

    // Check for time conflicts and daily limit in parallel
    const startOfDay = new Date(start);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(start);
    endOfDay.setHours(23, 59, 59, 999);

    const [conflictingReservation, overlappingReservation, existingDailyReservation] = await Promise.all([
      // Check if there are conflicting reservations for the same court (both CONFIRMED and PENDING)
      this.reservationRepository
        .createQueryBuilder('reservation')
        .where('reservation.courtId = :courtId', { courtId })
        .andWhere('reservation.status = :status', { status: ReservationStatus.CONFIRMED })
        .andWhere('(reservation.startTime < :endTime AND reservation.endTime > :startTime)', {
          startTime: start,
          endTime: end,
        })
        .getOne(),
      // Check if there are any overlapping reservations (any court, same time) (both CONFIRMED and PENDING)
      this.reservationRepository
        .createQueryBuilder('reservation')
        .where('reservation.status = :status', { status: ReservationStatus.CONFIRMED })
        .andWhere('(reservation.startTime < :endTime AND reservation.endTime > :startTime)', {
          startTime: start,
          endTime: end,
        })
        .getOne(),
      // Check if user already has a reservation for the same day (only CONFIRMED)
      this.reservationRepository.findOne({
        where: {
          userId,
          startTime: Between(startOfDay, endOfDay),
          status: ReservationStatus.CONFIRMED,
        },
      }),
    ]);

    if (conflictingReservation) {
      throw new BadRequestException('Bu kort için seçilen saat aralığında başka bir rezervasyon bulunmaktadır');
    }

    if (overlappingReservation) {
      throw new BadRequestException('Bu saat aralığında başka bir rezervasyon bulunmaktadır');
    }

    if (existingDailyReservation) {
      throw new BadRequestException('Gün içinde sadece bir rezervasyon yapabilirsiniz');
    }

    // Create reservation - direkt CONFIRMED olarak oluştur
    const reservation = this.reservationRepository.create({
      userId,
      courtId,
      startTime: start,
      endTime: end,
      notes,
      status: ReservationStatus.CONFIRMED,
    });

    const savedReservation = await this.reservationRepository.save(reservation);

    // Load the reservation with relations
    const reservationWithRelations = await this.reservationRepository.findOne({
      where: { id: savedReservation.id },
      relations: ['court', 'user'],
    });

    if (!reservationWithRelations) {
      throw new NotFoundException('Rezervasyon bulunamadı');
    }

    return this.toReservationResponseDto(reservationWithRelations);
  }

  async findAll(userId: string, userRole: string): Promise<ReservationResponseDto[]> {
    let reservations: Reservation[];

    if (userRole === 'admin' || userRole === 'manager') {
      // Admin/Manager can see all reservations
      reservations = await this.reservationRepository.find({
        relations: ['court', 'user'],
        order: { createdAt: 'DESC' },
      });
    } else {
      // Regular users can only see their own reservations
      reservations = await this.reservationRepository.find({
        where: { userId },
        relations: ['court', 'user'],
        order: { createdAt: 'DESC' },
      });
    }

    return reservations.map(reservation => this.toReservationResponseDto(reservation));
  }

  // Geçmiş rezervasyonları getir (bugünden eski olanlar)
  async getPastReservations(userId: string, userRole: string): Promise<ReservationResponseDto[]> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    let reservations: Reservation[];

    if (userRole === 'admin' || userRole === 'manager') {
      // Admin/Manager can see all past reservations
      reservations = await this.reservationRepository.find({
        where: {
          startTime: LessThan(today),
        },
        relations: ['court', 'user'],
        order: { startTime: 'DESC' },
      });
    } else {
      // Regular users can only see their own past reservations
      reservations = await this.reservationRepository.find({
        where: {
          userId,
          startTime: LessThan(today),
        },
        relations: ['court', 'user'],
        order: { startTime: 'DESC' },
      });
    }

    return reservations.map(reservation => this.toReservationResponseDto(reservation));
  }

  // Gelecek rezervasyonları getir (bugünden yeni olanlar)
  async getUpcomingReservations(userId: string, userRole: string): Promise<ReservationResponseDto[]> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    let reservations: Reservation[];

    if (userRole === 'admin' || userRole === 'manager') {
      // Admin/Manager can see all upcoming reservations
      reservations = await this.reservationRepository.find({
        where: {
          startTime: MoreThanOrEqual(today),
        },
        relations: ['court', 'user'],
        order: { startTime: 'ASC' },
      });
    } else {
      // Regular users can only see their own upcoming reservations
      reservations = await this.reservationRepository.find({
        where: {
          userId,
          startTime: MoreThanOrEqual(today),
        },
        relations: ['court', 'user'],
        order: { startTime: 'ASC' },
      });
    }

    return reservations.map(reservation => this.toReservationResponseDto(reservation));
  }

  async findOne(id: string, userId: string, userRole: string): Promise<ReservationResponseDto> {
    const reservation = await this.reservationRepository.findOne({
      where: { id },
      relations: ['court', 'user'],
    });

    if (!reservation) {
      throw new NotFoundException('Rezervasyon bulunamadı');
    }

    // Check if user can access this reservation
    if (userRole !== 'admin' && userRole !== 'manager' && reservation.userId !== userId) {
      throw new ForbiddenException('Bu rezervasyona erişim yetkiniz yok');
    }

    return this.toReservationResponseDto(reservation);
  }

  async cancel(
    id: string,
    cancelReservationDto: CancelReservationDto,
    userId: string,
    userRole: string,
  ): Promise<ReservationResponseDto> {
    const reservation = await this.reservationRepository.findOne({
      where: { id },
      relations: ['court', 'user'],
    });

    if (!reservation) {
      console.log('Reservation not found');
      throw new NotFoundException('Rezervasyon bulunamadı');
    }

    console.log(`Found reservation - Status: ${reservation.status}, UserID: ${reservation.userId}`);

    // Check if user can cancel this reservation
    if (userRole !== 'admin' && userRole !== 'manager' && reservation.userId !== userId) {
      console.log('User not authorized to cancel this reservation');
      throw new ForbiddenException('Bu rezervasyonu iptal etme yetkiniz yok');
    }

    // Check if reservation can be cancelled
    if (reservation.status === ReservationStatus.CANCELLED) {
      console.log('Reservation already cancelled');
      throw new BadRequestException('Bu rezervasyon zaten iptal edilmiş');
    }

    // Update reservation
    reservation.status = ReservationStatus.CANCELLED;
    reservation.cancellationReason = cancelReservationDto.cancellationReason;
    reservation.cancelledAt = new Date();

    console.log('Updating reservation status to CANCELLED');
    const updatedReservation = await this.reservationRepository.save(reservation);
    console.log('Reservation cancelled successfully');

    return this.toReservationResponseDto(updatedReservation);
  }

  async getCourtReservations(courtId: string, date?: string): Promise<ReservationResponseDto[]> {
    if (date) {
      const targetDate = new Date(date);
      const startOfDay = new Date(targetDate.setHours(0, 0, 0, 0));
      const endOfDay = new Date(targetDate.setHours(23, 59, 59, 999));

      const reservations = await this.reservationRepository.find({
        where: {
          courtId,
          startTime: Between(startOfDay, endOfDay),
        },
        relations: ['court', 'user'],
        order: { startTime: 'ASC' },
      });
      return reservations.map(reservation => this.toReservationResponseDto(reservation));
    }

    const reservations = await this.reservationRepository.find({
      where: { courtId },
      relations: ['court', 'user'],
      order: { startTime: 'ASC' },
    });
    return reservations.map(reservation => this.toReservationResponseDto(reservation));
  }

  private toReservationResponseDto(reservation: Reservation): ReservationResponseDto {
    return {
      id: reservation.id,
      userId: reservation.userId,
      court: this.toCourtResponseDto(reservation.court),
      startTime: reservation.startTime,
      endTime: reservation.endTime,
      status: reservation.status,
      createdAt: reservation.createdAt,
      notes: reservation.notes,
      cancellationReason: reservation.cancellationReason,
      cancelledAt: reservation.cancelledAt,
      durationInMinutes: reservation.durationInMinutes,
      durationInHours: reservation.durationInHours,
      isCancelled: reservation.isCancelled,
    };
  }

  private toCourtResponseDto(court: Court): CourtResponseDto {
    return {
      id: court.id,
      name: court.name,
      location: court.location,
      surface: court.surface,
      isAvailable: court.isAvailable,
      imageUrl: court.imageUrl,
      amenities: court.amenities,
      status: court.status,
      rating: court.rating,
      capacity: court.capacity,
    };
  }
}
