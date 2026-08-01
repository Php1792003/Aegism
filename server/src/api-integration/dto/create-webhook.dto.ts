import { IsNotEmpty, IsString, IsUrl, MaxLength } from 'class-validator';

export class CreateWebhookDto {
  @IsString()
  @IsNotEmpty({ message: 'Sự kiện không được để trống' })
  event: string;

  @IsString()
  @IsNotEmpty({ message: 'URL không được để trống' })
  @IsUrl({}, { message: 'URL không hợp lệ' })
  @MaxLength(500)
  url: string;
}
