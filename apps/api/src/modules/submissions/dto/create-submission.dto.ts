import { IsObject } from 'class-validator';

export class CreateSubmissionDto {
    @IsObject()
    data!: Record<string, unknown>;
}