import { ChannelSubscription } from '../../domain/entities/channel-subscription.entity';
import { ChannelSubscriptionPersistenceModel } from '../persistence/channel-subscription-persistence.model';

export class ChannelSubscriptionMapper {
  /**
   * Map MongoDB document to domain entity
   */
  static toDomain(document: any): ChannelSubscription {
    return ChannelSubscription.create({
      id: document._id,
      subscriberId: document.subscriberId,
      subscriberType: document.subscriberType,
      channel: document.channel,
      isActive: document.isActive,
    });
  }

  /**
   * Map multiple MongoDB documents to domain entities
   */
  static toDomainList(documents: any[]): ChannelSubscription[] {
    return documents.map((doc) => this.toDomain(doc));
  }

  /**
   * Map domain entity to MongoDB persistence format
   */
  static toPersistence(
    subscription: ChannelSubscription,
  ): Partial<ChannelSubscriptionPersistenceModel> {
    return {
      _id: subscription.id,
      subscriberId: subscription.subscriberId,
      subscriberType: subscription.subscriberType,
      channel: subscription.channel,
      isActive: subscription.isActive,
    };
  }
}
