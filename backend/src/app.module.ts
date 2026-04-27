import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';

import { AuthModule } from '@/modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { PrismaModule } from './core/prisma/prisma.module';
import { CollectionsModule } from './modules/collections/collections.module';
import { SearchModule } from './modules/search/search.module';
import { HealthModule } from './modules/health/health.module';
import { ConfigModule } from './core/config/config.module';
import { OptionalJwtAuthGuard } from './common/guards/optional-auth.guard';

@Module({
  imports: [
    ConfigModule,
    PrismaModule,
    AuthModule,
    UsersModule,
    CollectionsModule,
    SearchModule,
    HealthModule,
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: OptionalJwtAuthGuard,
    },
  ],
})
export class AppModule {}
