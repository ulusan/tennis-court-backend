import { ApiProperty } from '@nestjs/swagger';
import { ReservationStatus } from '../entities/reservation.entity';

export class CourtResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  name: string;

  @ApiProperty()
  location: string;

  @ApiProperty()
  surface: string;

  @ApiProperty()
  isAvailable: boolean;

  @ApiProperty({ required: false })
  imageUrl?: string;

  @ApiProperty()
  amenities: string[];

  @ApiProperty()
  status: string;

  @ApiProperty()
  rating: number;

  @ApiProperty()
  capacity: number;
}

export class ReservationResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  userId: string;

  @ApiProperty({ type: CourtResponseDto })
  court: CourtResponseDto;

  @ApiProperty()
  startTime: Date;

  @ApiProperty()
  endTime: Date;

  @ApiProperty({ enum: ReservationStatus })
  status: ReservationStatus;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty({ required: false })
  notes?: string;

  @ApiProperty({ required: false })
  cancellationReason?: string;

  @ApiProperty({ required: false })
  cancelledAt?: Date;

  @ApiProperty()
  durationInMinutes: number;

  @ApiProperty()
  durationInHours: number;

  @ApiProperty()
  isCancelled: boolean;
}
