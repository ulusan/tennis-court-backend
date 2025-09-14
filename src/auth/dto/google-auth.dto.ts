import { IsEmail, IsNotEmpty, IsString, IsOptional } from 'class-validator';

export class GoogleAuthDto {
  @IsNotEmpty()
  @IsString()
  googleId: string;

  @IsEmail()
  @IsNotEmpty()
  email: string;

  @IsNotEmpty()
  @IsString()
  firstName: string;

  @IsNotEmpty()
  @IsString()
  lastName: string;

  @IsOptional()
  @IsString()
  picture?: string;
}
