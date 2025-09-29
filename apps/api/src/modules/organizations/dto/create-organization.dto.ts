import { IsString, MinLength, MaxLength, Matches } from 'class-validator';

export class CreateOrganizationDto {
    @IsString()
    @MinLength(2, { message: 'Organization name must be at least 2 characters long' })
    @MaxLength(100, { message: 'Organization name must be at most 100 characters long' })
    @Matches(/^[a-zA-Z0-9\s\-_]+$/, {
        message: 'Organization name can only contain letters, numbers, spaces, hyphens, and underscores'
    })
    name: string;
}
