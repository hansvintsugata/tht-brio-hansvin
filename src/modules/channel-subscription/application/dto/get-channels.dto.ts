import { SubscriberType } from '@common/enums/subscriber-types.enum';
import { NotificationChannel } from '@common/enums/notification-channel.enum';
import { ChannelSubscription } from '../../domain/entities/channel-subscription.entity';

/**
 * Request DTO for getting channels by user and/or company
 */
export class GetChannelsRequestDto {
  userId?: string;
  companyId?: string;
}

/**
 * Response DTO representing a group of subscriptions by channel
 */
export class ChannelGroupDto {
  channel: NotificationChannel;
  subscriptions: ChannelSubscription[];
}
