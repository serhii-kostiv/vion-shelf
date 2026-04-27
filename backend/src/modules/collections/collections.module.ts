import { Module } from '@nestjs/common';
import { CollectionsService } from './collections.service';
import { CollectionsController } from './collections.controller';
import { PrismaModule } from '@/core/prisma/prisma.module';
import { CollectionOwnershipGuard } from './guards';

@Module({
  imports: [PrismaModule],
  controllers: [CollectionsController],
  providers: [CollectionsService, CollectionOwnershipGuard],
})
export class CollectionsModule {}
