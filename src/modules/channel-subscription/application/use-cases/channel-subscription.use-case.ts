import { Injectable, Inject } from '@nestjs/common';
import { SubscriberType } from '@common/enums/subscriber-types.enum';
import { NotificationChannel } from '@common/enums/notification-channel.enum';
import { ChannelSubscription } from '../../domain/entities/channel-subscription.entity';
import type { IChannelSubscriptionRepository } from '../../domain/repository/channel-subscription-repository.interface';
import {
  GetChannelsRequestDto,
  ChannelGroupDto,
} from '../dto/get-channels.dto';

@Injectable()
export class ChannelSubscriptionUseCase {
  constructor(
    @Inject('IChannelSubscriptionRepository')
    private readonly channelSubscriptionRepository: IChannelSubscriptionRepository,
  ) {}

  /**
   * Get channels for user and/or company with simplified && logic
   * If both userId and companyId are provided, returns channels that exist in both subscriptions
   * If only one is provided, returns all channels for that subscriber
   * Returns all subscriptions (both active and inactive)
   * Results are grouped by channel
   */
  async getChannels(
    request: GetChannelsRequestDto,
  ): Promise<ChannelGroupDto[]> {
    const { userId, companyId } = request;

    // Validate that at least one ID is provided
    if (!userId && !companyId) {
      throw new Error('Either userId or companyId must be provided');
    }

    let userSubscriptions: ChannelSubscription[] = [];
    let companySubscriptions: ChannelSubscription[] = [];

    // Get user subscriptions if userId is provided
    if (userId) {
      userSubscriptions =
        await this.channelSubscriptionRepository.findBySubscriberIdAndType(
          userId,
          SubscriberType.USER,
        );
    }

    // Get company subscriptions if companyId is provided
    if (companyId) {
      companySubscriptions =
        await this.channelSubscriptionRepository.findBySubscriberIdAndType(
          companyId,
          SubscriberType.COMPANY,
        );
    }

    // Simplified logic: return all subscriptions based on && logic
    let filteredSubscriptions: ChannelSubscription[];

    if (userId && companyId) {
      // Both provided: find channels that exist in both user and company subscriptions
      const userChannels = new Set(userSubscriptions.map((sub) => sub.channel));
      const companyChannels = new Set(
        companySubscriptions.map((sub) => sub.channel),
      );

      // Find intersection (channels that exist in both) - simplified without isActive filter
      const commonChannels = new Set(
        [...userChannels].filter((channel) => companyChannels.has(channel)),
      );

      // Return all subscriptions for common channels (both active and inactive)
      filteredSubscriptions = [
        ...userSubscriptions.filter((sub) => commonChannels.has(sub.channel)),
        ...companySubscriptions.filter((sub) =>
          commonChannels.has(sub.channel),
        ),
      ];
    } else if (userId) {
      // Only userId provided - return all user subscriptions
      filteredSubscriptions = userSubscriptions;
    } else {
      // Only companyId provided - return all company subscriptions
      filteredSubscriptions = companySubscriptions;
    }

    // Group by channel
    const channelGroups = this.groupByChannel(filteredSubscriptions);

    return channelGroups;
  }

  private groupByChannel(
    subscriptions: ChannelSubscription[],
  ): ChannelGroupDto[] {
    const groups = new Map<NotificationChannel, ChannelSubscription[]>();

    // Group subscriptions by channel
    for (const subscription of subscriptions) {
      const existing = groups.get(subscription.channel) || [];
      existing.push(subscription);
      groups.set(subscription.channel, existing);
    }

    // Convert to array format
    return Array.from(groups.entries()).map(([channel, subs]) => ({
      channel,
      subscriptions: subs,
    }));
  }
}
