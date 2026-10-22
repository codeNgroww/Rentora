import { IsString, IsNotEmpty, IsOptional, IsNumber, Min } from 'class-validator';
import { UnitType, UnitOccupancyStatus } from '@rental-saas/contracts';

export class CreateUnitDto {
  @IsString()
  @IsNotEmpty()
  unitNumber: string;

  @IsOptional()
  @IsString()
  type?: UnitType;

  @IsOptional()
  isShop?: boolean;

  @IsOptional()
  @IsString()
  floor?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  bedrooms?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  bathrooms?: number;

  @IsOptional()
  @IsNumber()
  squareFeet?: number;

  @IsOptional()
  @IsString()
  marketRent?: string;

  @IsOptional()
  @IsString()
  status?: UnitOccupancyStatus;
}
