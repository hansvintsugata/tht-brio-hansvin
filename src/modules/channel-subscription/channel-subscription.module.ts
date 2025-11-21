import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ChannelSubscriptionUseCase } from './application/use-cases/channel-subscription.use-case';
import { ChannelSubscriptionRepository } from './infrastructure/persistence/channel-subscription.repository';
import {
  ChannelSubscriptionPersistenceModel,
  ChannelSubscriptionSchema,
} from './infrastructure/persistence/channel-subscription-persistence.model';

@Module({
  imports: [
    MongooseModule.forFeature([
      {
        name: ChannelSubscriptionPersistenceModel.name,
        schema: ChannelSubscriptionSchema,
      },
    ]),
  ],
  controllers: [],
  providers: [
    // Use Cases
    ChannelSubscriptionUseCase,

    // Repository
    {
      provide: 'IChannelSubscriptionRepository',
      useClass: ChannelSubscriptionRepository,
    },
  ],
  exports: [
    // Export use cases for other modules to use
    ChannelSubscriptionUseCase,
  ],
})
export class ChannelSubscriptionModule {}
