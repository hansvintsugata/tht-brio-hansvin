import { NestFactory } from '@nestjs/core';
import { AppModule } from '@app/app.module';
import { ConfigService } from '@nestjs/config';
import { plainToInstance } from 'class-transformer';
import { AppEnvDto } from '@app/dtos/app.env.dto';
import { validate } from 'class-validator';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {});

  const configService = app.get(ConfigService);
  const env: string = configService.get<string>('app.env');
  const timezone: string = configService.get<string>('app.timezone');
  const host: string = configService.get<string>('app.http.host');
  const port: number = configService.get<number>('app.http.port');
  const globalPrefix: string = configService.get<string>('app.globalPrefix');

  process.env.NODE_ENV = env;
  process.env.TZ = timezone;

  app.setGlobalPrefix(globalPrefix);

  // Validate Env
  const classEnv = plainToInstance(AppEnvDto, process.env);
  const errors = await validate(classEnv);
  if (errors.length > 0) {
    throw new Error('Env Variable Invalid', {
      cause: errors,
    });
  }

  await app.listen(port, host);
}
bootstrap();
