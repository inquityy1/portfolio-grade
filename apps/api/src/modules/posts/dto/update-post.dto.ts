import { IsArray, IsNumber, IsOptional, IsString, Min, MinLength } from 'class-validator';

export class UpdatePostDto {
  // optimistic locking — client must send the current version they have
  @IsNumber()
  @Min(1)
  version!: number;

  @IsString()
  @IsOptional()
  @MinLength(2)
  title?: string;

  @IsString()
  @IsOptional()
  @MinLength(1)
  content?: string;

  // replace tags with this set (optional)
  @IsArray()
  @IsOptional()
  tagIds?: string[];
}
