import { IsEmail, IsString, MinLength, IsEnum, IsOptional } from 'class-validator';
import type { Role } from '../../common/types/role';

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
