import { IsEmail, IsString, MinLength, IsEnum, IsOptional } from 'class-validator';
type Role = 'OrgAdmin' | 'Editor' | 'Viewer';

export class CreateUserDto {
    @IsEmail()
    email: string;

    @IsString()
    @MinLength(6)
    password: string;

    @IsString()
    name: string;

    @IsEnum(['OrgAdmin', 'Editor', 'Viewer'])
    role: Role;

    @IsString()
    @IsOptional()
    organizationId?: string;
}
