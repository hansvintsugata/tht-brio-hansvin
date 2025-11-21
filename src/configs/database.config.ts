import { registerAs } from '@nestjs/config';

export default registerAs(
  'database',
  (): Record<string, any> => ({
    connection: process.env.DATABASE_CONNECTION || 'mongodb',
    host: process.env.DATABASE_HOST || 'localhost',
    port: Number.parseInt(process.env.DATABASE_PORT) || 27017,
    name: process.env.DATABASE_NAME || 'notification-service',
    user: process.env.DATABASE_USER || '',
    password: process.env.DATABASE_PASSWORD || '',
    uri:
      process.env.DATABASE_URI ||
      process.env.MONGODB_URI ||
      process.env.MONGO_URI ||
      'mongodb://localhost:27017/notification-service',
    debug: process.env.DATABASE_DEBUG === 'true',
    options: process.env.DATABASE_OPTIONS || '',
  }),
);
