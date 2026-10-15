import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { AllExceptionsFilter } from './common/filters/http-exception.filter';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Global prefix per PRD specification: /api/v1
  app.setGlobalPrefix('api/v1');

  // Standard exception filter
  app.useGlobalFilters(new AllExceptionsFilter());

  // Enable CORS for frontend web app
  app.enableCors({
    origin: '*',
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    credentials: true,
  });

  // Swagger OpenAPI Documentation
  const config = new DocumentBuilder()
    .setTitle('Rentora API')
    .setDescription(
      'REST API for Rentora - UAE Smart Rental Property & Expense Management SaaS.'
    )
    .setVersion('1.0')
    .addTag('workspaces')
    .addTag('properties')
    .addTag('expenses')
    .addTag('rent')
    .addTag('reports')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  const port = process.env.PORT || 4000;
  await app.listen(port);
  console.log(`[Rentora API] running on: http://localhost:${port}/api/v1`);
  console.log(`[Rentora API Docs] available at: http://localhost:${port}/api/docs`);
}

bootstrap();
