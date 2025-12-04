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
   * Get channels for user and/or company with AND semantics on active subscriptions
   * If both userId and companyId are provided, returns channels that are active for BOTH
   * If only one is provided, returns all channels for that subscriber (active and inactive)
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

    // AND semantics on active subscriptions when both IDs provided
    let filteredSubscriptions: ChannelSubscription[];

    if (userId && companyId) {
      // Both provided: consider only ACTIVE channels common to user and company
      const userActiveChannels = new Set(
        userSubscriptions.filter((s) => s.isActive).map((s) => s.channel),
      );
      const companyActiveChannels = new Set(
        companySubscriptions.filter((s) => s.isActive).map((s) => s.channel),
      );

      // Intersection of active channels
      const commonActiveChannels = new Set(
        [...userActiveChannels].filter((channel) =>
          companyActiveChannels.has(channel),
        ),
      );

      // Return only ACTIVE subscriptions for common active channels
      filteredSubscriptions = [
        ...userSubscriptions.filter(
          (sub) => sub.isActive && commonActiveChannels.has(sub.channel),
        ),
        ...companySubscriptions.filter(
          (sub) => sub.isActive && commonActiveChannels.has(sub.channel),
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
