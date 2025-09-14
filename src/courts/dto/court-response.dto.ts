import { ApiProperty } from '@nestjs/swagger';

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

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;

  // Müsaitlik bilgileri
  @ApiProperty({ description: 'Kort şu anda müsait mi?' })
  isCurrentlyAvailable: boolean;

  @ApiProperty({ description: 'Belirli bir tarih için müsaitlik durumu', required: false })
  availabilityForDate?: {
    date: string;
    timeSlots: TimeSlot[];
    isAvailable: boolean;
  };

  @ApiProperty({ description: 'Gelecek 7 gün için müsaitlik durumu', required: false })
  weeklyAvailability?: {
    date: string;
    isAvailable: boolean;
    availableSlots: number;
  }[];
}
