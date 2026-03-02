import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import { AuthModule } from '@/modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { PrismaModule } from './core/prisma/prisma.module';
import { CollectionsModule } from './modules/collections/collections.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    PrismaModule,
    AuthModule,
    UsersModule,
    CollectionsModule,
  ],
})
export class AppModule {}
