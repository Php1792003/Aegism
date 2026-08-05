import { IsNotEmpty, IsString, IsOptional } from 'class-validator';

export class SendReplyDto {
  @IsNotEmpty()
  @IsString()
  content: string;

  @IsOptional()
  @IsString()
  subject?: string;
}
