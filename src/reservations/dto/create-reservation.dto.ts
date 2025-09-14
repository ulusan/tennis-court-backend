import { IsString, IsNotEmpty, IsDateString, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateReservationDto {
  @ApiProperty({ example: 'court-uuid-here' })
  @IsString()
  @IsNotEmpty()
  courtId: string;

  @ApiProperty({ example: '2024-01-15T10:00:00.000Z' })
  @IsDateString()
  @IsNotEmpty()
  startTime: string;

  @ApiProperty({ example: '2024-01-15T11:00:00.000Z' })
  @IsDateString()
  @IsNotEmpty()
  endTime: string;

  @ApiProperty({ example: 'Özel notlar', required: false })
  @IsString()
  @IsOptional()
  notes?: string;
}
