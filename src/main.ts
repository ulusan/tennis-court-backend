import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // CORS ayarları - Flutter uygulaması için
  app.enableCors({
    origin: [
      'http://localhost:3000', // Flutter web development
      'http://127.0.0.1:3000',
      'http://localhost:8080', // Flutter web production
      'http://127.0.0.1:8080',
      // Android emulator için
      'http://10.0.2.2:3000',
      // iOS simulator için
      'http://localhost:3000',
    ],
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Accept', 'Accept-Language', 'X-Requested-With'],
    credentials: true,
  });

  // Global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  // Swagger API dokümantasyonu
  const config = new DocumentBuilder()
    .setTitle('Tennis Court API')
    .setDescription('Tenis Kortu Rezervasyon Sistemi API Dokümantasyonu')
    .setVersion('1.0')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        name: 'JWT',
        description: 'JWT token girin',
        in: 'header',
      },
      'JWT-auth',
    )
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document, {
    swaggerOptions: {
      persistAuthorization: true,
    },
  });

  const port = process.env.PORT || 3000;
  await app.listen(port);

  console.log(`�� Backend çalışıyor: http://localhost:${port}`);
  console.log(`📚 API Dokümantasyonu: http://localhost:${port}/api`);
}

void bootstrap();
