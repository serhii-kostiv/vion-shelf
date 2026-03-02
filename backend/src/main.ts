import { NestFactory } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import cookieParser from 'cookie-parser';

import { AppModule } from '@/app.module';
import { ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  const config = app.get(ConfigService);

  app.use(cookieParser());
  app.useGlobalPipes(new ValidationPipe({ transform: true }));

  app.enableCors({
    origin: config.getOrThrow<string>('ALLOWED_ORIGIN'),
    credentials: true,
    exposedHeaders: ['set-cookie'],
  });

  const port = config.getOrThrow<number>('APPLICATION_PORT');
  await app.listen(port);

  console.log('🚀 Application is starting...');
  console.log(`✅ Server is running on http://localhost:${port}`);
  console.log(
    `🌐 CORS enabled for: ${config.getOrThrow<string>('ALLOWED_ORIGIN')}`,
  );
  console.log('📝 Global validation pipe enabled');
}

void bootstrap();
