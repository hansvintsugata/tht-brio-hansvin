import { registerAs } from '@nestjs/config';

export default registerAs(
  'debug',
  (): Record<string, any> => ({
    enabled: process.env.DEBUG_ENABLE === 'true',
    logLevel: process.env.DEBUG_LEVEL ?? 'info',
  }),
);
