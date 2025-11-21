import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { ChannelSubscription } from '../../domain/entities/channel-subscription.entity';
import { IChannelSubscriptionRepository } from '../../domain/repository/channel-subscription-repository.interface';
import {
  ChannelSubscriptionDocument,
  ChannelSubscriptionPersistenceModel,
} from './channel-subscription-persistence.model';
import { ChannelSubscriptionMapper } from '../mappers/channel-subscription.mapper';

@Injectable()
export class ChannelSubscriptionRepository
  implements IChannelSubscriptionRepository
{
  constructor(
    @InjectModel(ChannelSubscriptionPersistenceModel.name)
    private channelSubscriptionModel: Model<ChannelSubscriptionDocument>,
  ) {}

  /**
   * Find all channel subscriptions by subscriber ID and type
   * Returns all active and inactive subscriptions for the given subscriber
   */
  async findBySubscriberIdAndType(
    subscriberId: string,
    subscriberType: string,
  ): Promise<ChannelSubscription[]> {
    const documents = await this.channelSubscriptionModel
      .find({
        subscriberId,
        subscriberType,
      })
      .exec();

    return ChannelSubscriptionMapper.toDomainList(documents);
  }
}
