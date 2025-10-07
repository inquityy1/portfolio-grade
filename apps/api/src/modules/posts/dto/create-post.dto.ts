import { IsArray, IsOptional, IsString, MinLength } from 'class-validator';

export class CreatePostDto {
  @IsString()
  @MinLength(2)
  title!: string;

  @IsString()
  @MinLength(1)
  content!: string;

  // optional tag IDs to attach
  @IsArray()
  @IsOptional()
  tagIds?: string[];
}
