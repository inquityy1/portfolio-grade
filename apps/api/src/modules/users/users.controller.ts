import { Controller, Get, Param } from '@nestjs/common';
import { UsersService } from './users.service';

@Controller('users')
export class UsersController {
    constructor(private readonly users: UsersService) { }

    @Get()
    getAll() {
        return this.users.findAll();
    }

    @Get(':id')
    getOne(@Param('id') id: string) {
        return this.users.findOne(id);
    }
}