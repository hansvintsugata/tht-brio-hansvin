import { NotificationChannel } from '@common/enums/notification-channel.enum';
import { SubscriberType } from '@common/enums/subscriber-types.enum';

/**
 * Pure domain entity for ChannelSubscription
 * Represents a subscriber's subscription to a specific notification channel
 */
export class ChannelSubscription {
  private constructor(
    private readonly _id: string,
    private readonly _subscriberId: string,
    private readonly _subscriberType: SubscriberType,
    private readonly _channel: NotificationChannel,
    private readonly _isActive: boolean,
    private readonly _createdAt: Date,
    private readonly _updatedAt: Date,
  ) {}

  /**
   * Factory method to create a new ChannelSubscription
   */
  static create(data: {
    id?: string;
    subscriberId: string;
    subscriberType: SubscriberType;
    channel: NotificationChannel;
    isActive?: boolean;
  }): ChannelSubscription {
    // Business validation
    if (!data.subscriberId || data.subscriberId.trim().length === 0) {
      throw new Error('Subscriber ID is required');
    }

    if (!data.subscriberType) {
      throw new Error('Subscriber type is required');
    }

    if (!data.channel) {
      throw new Error('Channel is required');
    }

    if (!this.isValidSubscriberType(data.subscriberType)) {
      throw new Error(`Invalid subscriber type: ${data.subscriberType}`);
    }

    if (!this.isValidChannelType(data.channel)) {
      throw new Error(`Invalid channel type: ${data.channel}`);
    }

    return new ChannelSubscription(
      data.id,
      data.subscriberId.trim(),
      data.subscriberType,
      data.channel,
      data.isActive ?? true,
      new Date(),
      new Date(),
    );
  }

  // Validation helpers
  private static isValidSubscriberType(type: string): boolean {
    return Object.values(SubscriberType).includes(type as SubscriberType);
  }

  private static isValidChannelType(channel: string): boolean {
    return Object.values(NotificationChannel).includes(
      channel as NotificationChannel,
    );
  }

  // Getters
  get id(): string {
    return this._id;
  }
  get subscriberId(): string {
    return this._subscriberId;
  }
  get subscriberType(): SubscriberType {
    return this._subscriberType;
  }
  get channel(): NotificationChannel {
    return this._channel;
  }
  get isActive(): boolean {
    return this._isActive;
  }
  get createdAt(): Date {
    return this._createdAt;
  }
  get updatedAt(): Date {
    return this._updatedAt;
  }
}
