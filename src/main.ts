import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Setup Swagger/OpenAPI
  const config = new DocumentBuilder()
    .setTitle('Crypto Tracker API')
    .setDescription(
      'API for cryptocurrency trading rule tracking and backtesting',
    )
    .setVersion('1.0')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description: 'Enter JWT token issued by external auth service',
      },
      'JWT-auth', // This name here is important for matching up with @ApiBearerAuth() in your controller!
    )
    .addTag('rules', 'Trading rule management')
    .addTag('orders', 'Order management and tracking')
    .addTag('backtest', 'Backtesting functionality')
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document);

  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
