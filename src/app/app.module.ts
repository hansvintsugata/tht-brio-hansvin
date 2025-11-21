import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import mongoose from 'mongoose';
import configs from '@configs/index';
import { RouterModule } from '@router';
import { QueueModule } from './queue.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      load: configs,
      isGlobal: true,
      cache: true,
      envFilePath: ['.env'],
      expandVariables: true,
    }),
    MongooseModule.forRootAsync({
      useFactory: (configService: ConfigService) => {
        const databaseUri = configService.get<string>('database.uri');
        const databaseDebug = configService.get<boolean>('database.debug');

        // Enable Mongoose debug logging if specifically enabled for MongoDB or if general debug is enabled with appropriate log level
        if (databaseDebug) {
          mongoose.set('debug', true);
          console.log('[MongoDB] Debug logging enabled');
        }

        return {
          uri: databaseUri,
        };
      },
      inject: [ConfigService],
    }),
    RouterModule,
    QueueModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
