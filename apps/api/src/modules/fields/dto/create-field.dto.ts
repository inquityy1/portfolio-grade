import { IsOptional, IsString, IsInt, Min, IsObject } from 'class-validator';

export class CreateFieldDto {
    @IsString()
    label!: string;

    @IsString()
    type!: string;

    @IsOptional()
    @IsObject()
    config?: Record<string, unknown>;

    @IsOptional()
    @IsInt()
    @Min(0)
    order?: number;
}