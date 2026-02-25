import { Request as ExpressRequest } from 'express';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import type { User } from '@prisma/client';
interface RequestWithUser extends ExpressRequest {
    user: User;
}
export declare class AuthController {
    private readonly authService;
    constructor(authService: AuthService);
    register(dto: RegisterDto): Promise<{
        name: string;
        username: string;
        email: string;
        password: string;
        id: string;
        createdAt: Date;
        updatedAt: Date;
    }>;
    login(req: RequestWithUser): {
        access_token: string;
        user: {
            name: string;
            username: string;
            email: string;
            password: string;
            id: string;
            createdAt: Date;
            updatedAt: Date;
        };
    };
    logout(): {
        message: string;
    };
    getProfile(req: RequestWithUser): User;
}
export {};
