import { PrismaService } from '@/core/prisma/prisma.service';
import { User } from '@prisma/client';
export declare class UsersService {
    private readonly prismaService;
    constructor(prismaService: PrismaService);
    findOne(email: string): Promise<User | undefined | null>;
}
