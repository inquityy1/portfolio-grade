import { IsObject, IsString } from 'class-validator';

export class CreateFormDto {
  @IsString()
  name!: string;

  @IsObject()
  schema!: Record<string, unknown>;
}
