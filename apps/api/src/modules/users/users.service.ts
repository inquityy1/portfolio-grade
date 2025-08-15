import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../infra/prisma.service';

@Injectable()
export class UsersService {
    constructor(private prisma: PrismaService) { }

    findAll() {
        return this.prisma.user.findMany();
    }

    findOne(id: string) {
        return this.prisma.user.findUnique({ where: { id } });
    }

    findByEmail(email: string) {
        return this.prisma.user.findUnique({ where: { email } });
    }

    create(data: any) {
        return this.prisma.user.create({ data });
    }

    update(id: string, data: any) {
        return this.prisma.user.update({ where: { id }, data });
    }

    remove(id: string) {
        return this.prisma.user.delete({ where: { id } });
    }
}