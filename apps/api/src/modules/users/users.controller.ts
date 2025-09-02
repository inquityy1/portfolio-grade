import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '@prisma/client';

@Controller('users')
@UseGuards(JwtAuthGuard, RolesGuard)
export class UsersController {
    constructor(private readonly users: UsersService) { }

    @Roles('OrgAdmin' as Role)
    @Get()
    getAll() {
        return this.users.findAll();
    }

    @Roles('OrgAdmin' as Role, 'Editor' as Role)
    @Get(':id')
    getOne(@Param('id') id: string) {
        return this.users.findOne(id);
    }
}