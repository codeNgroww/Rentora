import { IsString, IsNotEmpty, IsOptional, IsNumber, IsArray } from 'class-validator';

export class RecordPaymentDto {
  @IsString()
  @IsNotEmpty()
  tenantId: string;

  @IsString()
  @IsNotEmpty()
  propertyId: string;

  @IsString()
  @IsNotEmpty()
  unitId: string;

  @IsString()
  @IsNotEmpty()
  amount: string;

  @IsOptional()
  @IsString()
  currency?: string;

  @IsString()
  @IsNotEmpty()
  paymentDate: string;

  @IsOptional()
  @IsString()
  paymentMethod?: string;

  @IsOptional()
  @IsString()
  reference?: string;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @IsString()
  subtotalAmount?: string;

  @IsOptional()
  @IsNumber()
  vatRate?: number;

  @IsOptional()
  @IsString()
  vatAmount?: string;

  @IsOptional()
  @IsString()
  totalAmount?: string;

  @IsOptional()
  @IsArray()
  allocations?: Array<{ rentChargeId: string; amount: string }>;

  @IsOptional()
  @IsString()
  proofUrl?: string;

  @IsOptional()
  @IsString()
  proofName?: string;

  @IsOptional()
  @IsString()
  invoiceNumber?: string;
}
