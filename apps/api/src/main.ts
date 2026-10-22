import 'dotenv/config';
import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { AllExceptionsFilter } from './common/filters/http-exception.filter';
import { LoggingInterceptor } from './common/interceptors/logging.interceptor';

async function bootstrap() {
  const logger = new Logger('Bootstrap');
  const app = await NestFactory.create(AppModule);

  // Enable graceful shutdown hooks
  app.enableShutdownHooks();

  // Global prefix per PRD specification: /api/v1
  app.setGlobalPrefix('api/v1');

  // Global Validation Pipe with automatic payload transformation
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: false,
      transformOptions: {
        enableImplicitConversion: true,
      },
    })
  );

  // Standard exception filter
  app.useGlobalFilters(new AllExceptionsFilter());

  // Structured Logging Interceptor
  app.useGlobalInterceptors(new LoggingInterceptor());

  // Scoped CORS configuration for Web App
  const corsOrigin = process.env.CORS_ORIGIN || 'http://localhost:3000';
  app.enableCors({
    origin: [corsOrigin, 'http://localhost:3000', 'http://127.0.0.1:3000'],
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    credentials: true,
    allowedHeaders: [
      'Content-Type',
      'Authorization',
      'x-company-id',
      'x-workspace-id',
      'x-user-id',
      'x-request-id',
    ],
  });

  // Swagger OpenAPI Documentation
  const config = new DocumentBuilder()
    .setTitle('Rentora API')
    .setDescription(
      'Enterprise REST API for Rentora - UAE Smart Rental Property & Multi-Tenant SaaS.'
    )
    .setVersion('1.0')
    .addTag('super-admin')
    .addTag('properties')
    .addTag('tenants-leases')
    .addTag('expenses')
    .addTag('rent')
    .addTag('dashboard')
    .addTag('reports')
    .addTag('workspaces')
    .addTag('health')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  const port = process.env.PORT || 4000;
  await app.listen(port);
  logger.log(`Rentora Enterprise API running on: http://localhost:${port}/api/v1`);
  logger.log(`Rentora API Docs available at: http://localhost:${port}/api/docs`);
}

bootstrap();
