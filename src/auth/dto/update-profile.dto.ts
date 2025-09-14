import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, IsNotEmpty, IsEmail } from 'class-validator';

export class UpdateProfileDto {
  @ApiProperty({ example: 'Ahmet Yılmaz', required: false })
  @IsString()
  @IsNotEmpty()
  @IsOptional()
  name?: string;

  @ApiProperty({ example: 'ahmet@example.com', required: false })
  @IsString()
  @IsEmail()
  @IsOptional()
  email?: string;

  @ApiProperty({ example: '+90 555 123 45 67', required: false })
  @IsString()
  @IsOptional()
  phone?: string;

  @ApiProperty({ example: 'https://example.com/profile.jpg', required: false })
  @IsString()
  @IsOptional()
  profileImageUrl?: string;
}
