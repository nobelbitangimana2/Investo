import { NestFactory, Reflector } from '@nestjs/core';
import { ValidationPipe, ClassSerializerInterceptor } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { TransformInterceptor } from './common/interceptors/transform.interceptor';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // ── CORS ──────────────────────────────────────────────────────────
  app.enableCors({
    origin: process.env.FRONTEND_URL ?? '*',
    credentials: true,
  });

  // ── Global prefix ─────────────────────────────────────────────────
  app.setGlobalPrefix('api');

  // ── Global pipes ──────────────────────────────────────────────────
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,          // strip unknown properties from body
      forbidNonWhitelisted: false, // allow extra query params silently
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );

  // ── Global filters ────────────────────────────────────────────────
  app.useGlobalFilters(new HttpExceptionFilter());

  // ── Global interceptors ───────────────────────────────────────────
  const reflector = app.get(Reflector);
  app.useGlobalInterceptors(
    new ClassSerializerInterceptor(reflector),
    new TransformInterceptor(),
  );

  // ── Swagger ───────────────────────────────────────────────────────
  const config = new DocumentBuilder()
    .setTitle('Investo API')
    .setDescription('Investment management and deposit-tracking platform API')
    .setVersion('1.0')
    .addBearerAuth(
      { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' },
      'access-token',
    )
    .addTag('auth', 'Authentication endpoints')
    .addTag('users', 'User management')
    .addTag('clients', 'Client profiles')
    .addTag('deposits', 'Deposit management')
    .addTag('investments', 'Investment portfolio')
    .addTag('withdrawals', 'Withdrawal requests')
    .addTag('interest-rates', 'Interest rate configuration')
    .addTag('notifications', 'User notifications')
    .addTag('audit-logs', 'Audit trail')
    .addTag('reports', 'Reports and analytics')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document, {
    swaggerOptions: { persistAuthorization: true },
  });

  const port = process.env.PORT ?? 3001;
  await app.listen(port);
  console.log(`🚀 Investo API running at http://localhost:${port}/api`);
  console.log(`📚 Swagger docs at    http://localhost:${port}/api/docs`);
}

bootstrap();
