import { SubscriberType } from '@common/enums/subscriber-types.enum';
import { ChannelSubscription } from '../entities/channel-subscription.entity';

/**
 * Repository interface for ChannelSubscription
 * Defines the contract for data access operations
 */
export interface IChannelSubscriptionRepository {
  /**
   * Find all channel subscriptions by subscriber ID and type
   * Returns all active and inactive subscriptions for the given subscriber
   */
  findBySubscriberIdAndType(
    subscriberId: string,
    subscriberType: SubscriberType,
  ): Promise<ChannelSubscription[]>;
}
