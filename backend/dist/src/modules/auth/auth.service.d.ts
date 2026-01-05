import { PrismaService } from '@/core/prisma/prisma.service';
import { RegisterDto } from './dto/register.dto';
import { UsersService } from '@/modules/users/users.service';
import { JwtService } from '@nestjs/jwt';
import { User } from '@prisma/client';
export declare class AuthService {
    private readonly prismaService;
    private readonly usersService;
    private readonly jwtService;
    constructor(prismaService: PrismaService, usersService: UsersService, jwtService: JwtService);
    hashPassword(password: string): Promise<string>;
    verifyPassword(password: string, hash: string): Promise<boolean>;
    register(dto: RegisterDto): Promise<{
        id: string;
        username: string;
        name: string;
        email: string;
        password: string;
        createdAt: Date;
        updatedAt: Date;
    }>;
    validateUser(email: string, password: string): Promise<{
        id: string;
        username: string;
        name: string;
        email: string;
        password: string;
        createdAt: Date;
        updatedAt: Date;
    } | null>;
    login(user: User): {
        access_token: string;
        user: {
            id: string;
            username: string;
            name: string;
            email: string;
            password: string;
            createdAt: Date;
            updatedAt: Date;
        };
    };
}
