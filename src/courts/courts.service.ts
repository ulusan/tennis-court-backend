import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { Court } from './entities/court.entity';
import { CreateCourtDto } from './dto/create-court.dto';
import { UpdateCourtDto } from './dto/update-court.dto';
import { CourtResponseDto } from './dto/court-response.dto';
import { Reservation, ReservationStatus } from '../reservations/entities/reservation.entity';

export interface TimeSlot {
  startTime: {
    hour: number;
    minute: number;
  };
  endTime: {
    hour: number;
    minute: number;
  };
  status: 'available' | 'reserved';
  reservedBy: string | null;
  notes: string | null;
}

@Injectable()
export class CourtsService {
  constructor(
    @InjectRepository(Court)
    private courtRepository: Repository<Court>,
    @InjectRepository(Reservation)
    private reservationRepository: Repository<Reservation>,
  ) {}

  async create(createCourtDto: CreateCourtDto): Promise<Court> {
    const court = this.courtRepository.create(createCourtDto);
    return this.courtRepository.save(court);
  }

  async findAll(): Promise<Court[]> {
    return this.courtRepository.find({
      order: { createdAt: 'DESC' },
    });
  }

  async findAvailable(): Promise<Court[]> {
    return this.courtRepository.find({
      where: { isAvailable: true },
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(id: string): Promise<Court> {
    const court = await this.courtRepository.findOne({ where: { id } });
    if (!court) {
      throw new NotFoundException('Kort bulunamadı');
    }
    return court;
  }

  async findOneWithAvailability(id: string): Promise<CourtResponseDto> {
    const court = await this.findOne(id);
    return this.toCourtResponseDto(court);
  }

  // Sadece rezerve edilmiş saatleri döndür - Flutter için
  async getCourtReservedSlots(
    courtId: string,
    date?: string,
  ): Promise<{
    courtId: string;
    courtName: string;
    date: string;
    reservedSlots: {
      startTime: string;
      endTime: string;
      userId: string;
      notes?: string;
    }[];
  }> {
    const court = await this.findOne(courtId);
    const targetDate = date ? new Date(date) : new Date();

    const startOfDay = new Date(targetDate);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(targetDate);
    endOfDay.setHours(23, 59, 59, 999);

    const reservations = await this.reservationRepository.find({
      where: {
        courtId,
        startTime: Between(startOfDay, endOfDay),
        status: ReservationStatus.CONFIRMED,
      },
      relations: ['user'],
      order: { startTime: 'ASC' },
    });

    const reservedSlots = reservations.map(reservation => ({
      startTime: reservation.startTime.toISOString(),
      endTime: reservation.endTime.toISOString(),
      userId: reservation.userId,
      userName: reservation.user?.name || 'Bilinmeyen',
      notes: reservation.notes,
    }));

    return {
      courtId: court.id,
      courtName: court.name,
      date: targetDate.toISOString().split('T')[0],
      reservedSlots,
    };
  }

  async update(id: string, updateCourtDto: UpdateCourtDto): Promise<Court> {
    const court = await this.findOne(id);
    Object.assign(court, updateCourtDto);
    return this.courtRepository.save(court);
  }

  async remove(id: string): Promise<void> {
    const court = await this.findOne(id);
    await this.courtRepository.remove(court);
  }

  async getCourtAvailability(
    courtId: string,
    date: Date,
  ): Promise<{
    courtId: string;
    courtName: string;
    date: string;
    timeSlots: TimeSlot[];
    isAvailable: boolean;
  }> {
    const court = await this.findOne(courtId);

    // Gerçek rezervasyon verilerini al
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    const reservations = await this.reservationRepository.find({
      where: {
        courtId,
        startTime: Between(startOfDay, endOfDay),
        status: ReservationStatus.CONFIRMED,
      },
    });

    const timeSlots = this.generateTimeSlotsWithReservations(date, reservations);

    return {
      courtId: court.id,
      courtName: court.name,
      date: date.toISOString().split('T')[0],
      timeSlots,
      isAvailable: timeSlots.some(slot => slot.status === 'available'),
    };
  }

  private generateTimeSlotsWithReservations(date: Date, reservations: Reservation[]): TimeSlot[] {
    const slots: TimeSlot[] = [];
    const startHour = 8;
    const endHour = 22;

    for (let hour = startHour; hour < endHour; hour++) {
      const startTime = new Date(date);
      startTime.setHours(hour, 0, 0, 0);

      const endTime = new Date(date);
      endTime.setHours(hour + 1, 0, 0, 0);

      // Gerçek rezervasyon kontrolü
      const conflictingReservation = reservations.find(reservation => {
        const reservationStart = new Date(reservation.startTime);
        const reservationEnd = new Date(reservation.endTime);
        return startTime < reservationEnd && endTime > reservationStart;
      });

      const isAvailable = !conflictingReservation;

      slots.push({
        startTime: {
          hour: startTime.getHours(),
          minute: startTime.getMinutes(),
        },
        endTime: {
          hour: endTime.getHours(),
          minute: endTime.getMinutes(),
        },
        status: isAvailable ? 'available' : 'reserved',
        reservedBy: isAvailable ? null : conflictingReservation?.userId || null,
        notes: isAvailable ? null : conflictingReservation?.notes || 'Rezerve edilmiş',
      });
    }

    return slots;
  }

  private async toCourtResponseDto(court: Court): Promise<CourtResponseDto> {
    // Gelecek 7 gün için müsaitlik durumunu hesapla
    const weeklyAvailability = await this.getWeeklyAvailability(court.id);

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
      createdAt: court.createdAt,
      updatedAt: court.updatedAt,
      isCurrentlyAvailable: court.isCurrentlyAvailable,
      weeklyAvailability,
    };
  }

  private toCourtResponseDtoWithReservations(court: Court, reservations: Reservation[]): CourtResponseDto {
    // Mevcut rezervasyonlarla 7 günlük müsaitlik durumunu hesapla
    const weeklyAvailability = this.calculateWeeklyAvailabilityFromReservations(reservations);

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
      createdAt: court.createdAt,
      updatedAt: court.updatedAt,
      isCurrentlyAvailable: court.isCurrentlyAvailable,
      weeklyAvailability,
    };
  }

  private calculateWeeklyAvailabilityFromReservations(reservations: Reservation[]): {
    date: string;
    isAvailable: boolean;
    availableSlots: number;
  }[] {
    const weeklyData: {
      date: string;
      isAvailable: boolean;
      availableSlots: number;
    }[] = [];
    const today = new Date();

    // Her gün için müsaitlik hesapla
    for (let i = 0; i < 7; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);

      const dayReservations = reservations.filter(reservation => {
        const reservationDate = new Date(reservation.startTime);
        return reservationDate.toDateString() === date.toDateString();
      });

      const timeSlots = this.generateTimeSlotsWithReservations(date, dayReservations);
      const availableSlots = timeSlots.filter(slot => slot.status === 'available').length;

      weeklyData.push({
        date: date.toISOString().split('T')[0],
        isAvailable: availableSlots > 0,
        availableSlots,
      });
    }

    return weeklyData;
  }

  private async getWeeklyAvailability(courtId: string): Promise<
    {
      date: string;
      isAvailable: boolean;
      availableSlots: number;
    }[]
  > {
    const weeklyData: {
      date: string;
      isAvailable: boolean;
      availableSlots: number;
    }[] = [];
    const today = new Date();

    // 7 günlük veriyi tek sorguda al
    const startOfWeek = new Date(today);
    startOfWeek.setHours(0, 0, 0, 0);
    const endOfWeek = new Date(today);
    endOfWeek.setDate(today.getDate() + 6);
    endOfWeek.setHours(23, 59, 59, 999);

    const reservations = await this.reservationRepository.find({
      where: {
        courtId,
        startTime: Between(startOfWeek, endOfWeek),
        status: ReservationStatus.CONFIRMED,
      },
      order: { startTime: 'ASC' },
    });

    // Her gün için müsaitlik hesapla
    for (let i = 0; i < 7; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);

      const dayReservations = reservations.filter(reservation => {
        const reservationDate = new Date(reservation.startTime);
        return reservationDate.toDateString() === date.toDateString();
      });

      const timeSlots = this.generateTimeSlotsWithReservations(date, dayReservations);
      const availableSlots = timeSlots.filter(slot => slot.status === 'available').length;

      weeklyData.push({
        date: date.toISOString().split('T')[0],
        isAvailable: availableSlots > 0,
        availableSlots,
      });
    }

    return weeklyData;
  }
}
