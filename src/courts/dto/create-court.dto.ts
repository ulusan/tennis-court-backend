import { IsString, IsNotEmpty, IsOptional, IsBoolean, IsArray, IsNumber, Min, Max } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateCourtDto {
  @ApiProperty({ example: 'Kort 1' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ example: 'Merkez Mahallesi, Spor Kompleksi' })
  @IsString()
  @IsNotEmpty()
  location: string;

  @ApiProperty({ example: 'clay', enum: ['clay', 'hard', 'grass'] })
  @IsString()
  @IsNotEmpty()
  surface: string;

  @ApiProperty({ example: true, required: false })
  @IsBoolean()
  @IsOptional()
  isAvailable?: boolean;

  @ApiProperty({ example: 'https://example.com/court1.jpg', required: false })
  @IsString()
  @IsOptional()
  imageUrl?: string;

  @ApiProperty({ example: ['lights', 'roof'], required: false })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  amenities?: string[];

  @ApiProperty({ example: 'available', required: false })
  @IsString()
  @IsOptional()
  status?: string;

  @ApiProperty({ example: 4.5, minimum: 0, maximum: 5, required: false })
  @IsNumber()
  @Min(0)
  @Max(5)
  @IsOptional()
  rating?: number;

  @ApiProperty({ example: 4, minimum: 1, required: false })
  @IsNumber()
  @Min(1)
  @IsOptional()
  capacity?: number;
}
