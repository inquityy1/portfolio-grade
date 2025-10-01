import { IsString, MinLength, IsNotEmpty } from 'class-validator';
import { Transform } from 'class-transformer';

export class CreateCommentDto {
    @IsString()
    @IsNotEmpty()
    @MinLength(1)
    @Transform(({ value }) => value?.trim())
    content!: string;
}