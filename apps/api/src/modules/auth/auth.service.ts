import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { UsersService } from '../users/users.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';

@Injectable()
export class AuthService {
    constructor(
        private readonly users: UsersService,
        private readonly jwt: JwtService
    ) { }

    async register(dto: RegisterDto) {
        const hashedPassword = await bcrypt.hash(dto.password, 10);
        return this.users.create({
            email: dto.email,
            password: hashedPassword,
            name: dto.name,
        });
    }

    async login(dto: LoginDto) {
        const user = await this.users.findByEmail(dto.email);
        if (!user) throw new UnauthorizedException('Invalid credentials');

        const ok = await bcrypt.compare(dto.password, user.password);
        if (!ok) throw new UnauthorizedException('Invalid credentials');

        // Add role/orgId later when we wire RBAC/tenancy
        const payload = { sub: user.id, email: user.email };
        return { access_token: this.jwt.sign(payload) };
    }
}