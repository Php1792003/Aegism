import { IsString, IsOptional, IsBoolean, IsInt, Min } from 'class-validator';

export class CreateCustomerDto {
  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  subscriptionPlan?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  maxUsers?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  maxProjects?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  maxQRCodes?: number;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class RenewPlanDto {
  @IsString()
  plan: string;

  @IsInt()
  @Min(1)
  months: number;

  @IsOptional()
  @IsString()
  note?: string;
}
