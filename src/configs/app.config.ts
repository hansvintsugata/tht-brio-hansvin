import { registerAs } from '@nestjs/config';

export default registerAs(
  'app',
  (): Record<string, any> => ({
    name: process.env.APP_NAME,
    env: process.env.APP_ENV,
    timezone: process.env.APP_TIMEZONE,
    globalPrefix: '/api',

    http: {
      host: process.env.HTTP_HOST,
      port: Number.parseInt(process.env.HTTP_PORT),
    },
  }),
);
