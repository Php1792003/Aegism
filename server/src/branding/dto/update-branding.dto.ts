import { IsOptional, IsString, MaxLength } from 'class-validator';

export class UpdateBrandingDto {
  @IsOptional()
  @IsString()
  @MaxLength(100)
  appName?: string;

  @IsOptional()
  @IsString()
  @MaxLength(20)
  primaryColor?: string;

  @IsOptional()
  @IsString()
  logo?: string; // Expecting base64 string

  @IsOptional()
  logoHeight?: number;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  domain?: string;
}
