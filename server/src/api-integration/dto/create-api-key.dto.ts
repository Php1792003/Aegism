import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class CreateApiKeyDto {
  @IsString()
  @IsNotEmpty({ message: 'Tên API Key không được để trống' })
  @MaxLength(100)
  name: string;
}
