import { IsString, IsNotEmpty, IsOptional, IsArray, IsNumber } from 'class-validator';
import { PaymentFrequency } from '@rental-saas/contracts';

export class CreateLeaseDto {
  @IsString()
  @IsNotEmpty()
  unitId: string;

  @IsOptional()
  @IsArray()
  unitIds?: string[];

  @IsString()
  @IsNotEmpty()
  propertyId: string;

  @IsString()
  @IsNotEmpty()
  tenantId: string;

  @IsString()
  @IsNotEmpty()
  startDate: string;

  @IsString()
  @IsNotEmpty()
  endDate: string;

  @IsString()
  @IsNotEmpty()
  annualRent: string;

  @IsOptional()
  paymentFrequency?: PaymentFrequency;

  @IsOptional()
  @IsNumber()
  numberOfCheques?: number;

  @IsOptional()
  @IsString()
  securityDeposit?: string;

  @IsOptional()
  @IsString()
  termsNotes?: string;

  @IsOptional()
  @IsArray()
  cheques?: any[];
}
