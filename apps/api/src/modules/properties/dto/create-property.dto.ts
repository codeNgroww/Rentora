import { IsString, IsNotEmpty, IsOptional, IsNumber, Min } from 'class-validator';
import { PropertyType, UAEEmirate } from '@rental-saas/contracts';

export class CreatePropertyDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsNotEmpty()
  address: string;

  @IsString()
  @IsNotEmpty()
  emirate: UAEEmirate;

  @IsOptional()
  @IsString()
  type?: PropertyType;

  @IsOptional()
  @IsString()
  communityArea?: string;

  @IsOptional()
  @IsString()
  buildingReference?: string;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @IsNumber()
  @Min(1)
  numberOfFloors?: number;

  @IsOptional()
  @IsNumber()
  @Min(1)
  unitsPerFloor?: number;
}
