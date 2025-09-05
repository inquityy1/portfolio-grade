import { IsObject, IsOptional, IsString } from 'class-validator';

export class UpdateFormDto {
    @IsOptional()
    @IsString()
    name?: string;

    @IsOptional()
    @IsObject()
    schema?: Record<string, unknown>;
}