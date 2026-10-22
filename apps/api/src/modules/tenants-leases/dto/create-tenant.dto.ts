import { IsString, IsNotEmpty, IsOptional, IsEmail } from 'class-validator';

export class CreateTenantDto {
  @IsString()
  @IsNotEmpty()
  fullName: string;

  @IsEmail()
  @IsNotEmpty()
  email: string;

  @IsString()
  @IsNotEmpty()
  phoneNumber: string;

  @IsOptional()
  @IsString()
  emiratesId?: string;

  @IsOptional()
  @IsString()
  passportNumber?: string;

  @IsOptional()
  @IsString()
  preferredContact?: 'email' | 'phone' | 'whatsapp';

  @IsOptional()
  @IsString()
  notes?: string;
}
