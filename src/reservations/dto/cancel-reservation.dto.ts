import { IsString, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CancelReservationDto {
  @ApiProperty({ example: 'Hastalık nedeniyle iptal', required: false })
  @IsString()
  @IsOptional()
  cancellationReason?: string;
}
