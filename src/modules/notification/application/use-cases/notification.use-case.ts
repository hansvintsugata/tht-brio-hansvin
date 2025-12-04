import { Injectable, Inject } from '@nestjs/common';
import { Notification } from '../../domain/entities/notification.entity';
import type { INotificationRepository } from '../../domain/repository/notification-repository.interface';
import { NotificationChannel } from '@common/enums/notification-channel.enum';
import { CreateNotificationDto } from '../dto/create-notification.dto';
import {
  PushNotificationRequestDto,
  PushNotificationResponseDto,
} from '../../presentation/dto/push-notification.dto';
import { ChannelSubscriptionUseCase } from '@modules/channel-subscription/application/use-cases/channel-subscription.use-case';
import { GetNotificationTemplateUseCase } from '@modules/notification-template/application/use-cases/get-notification-template.use-case';
import { UserDataService } from '../../infrastructure/outbound/user-data.service';
import { Queue } from 'bullmq';
import { InjectQueue } from '@nestjs/bullmq';

@Injectable()
export class NotificationUseCase {
  constructor(
    @Inject('INotificationRepository')
    private readonly notificationRepository: INotificationRepository,
    private readonly channelSubscriptionUseCase: ChannelSubscriptionUseCase,
    private readonly getNotificationTemplateUseCase: GetNotificationTemplateUseCase,
    private readonly userDataService: UserDataService,
    @InjectQueue('email-notifications') private emailQueue: Queue,
    @InjectQueue('ui-notifications') private uiQueue: Queue,
  ) {}

  async getUiNotificationsByUserPaginated(
    userId: string,
    page: number = 1,
    limit: number = 10,
  ): Promise<{
    notifications: Notification[];
    total: number;
    totalPages: number;
  }> {
    if (!userId || userId.trim() === '') {
      throw new Error('User ID is required');
    }

    if (page < 1) {
      throw new Error('Page must be greater than 0');
    }

    if (limit < 1 || limit > 100) {
      throw new Error('Limit must be between 1 and 100');
    }

    const uiChannel = NotificationChannel.UI;
    const result =
      await this.notificationRepository.getListByNotificationChannelAndUserIdPaginated(
        uiChannel,
        userId,
        page,
        limit,
      );

    return {
      notifications: result.notifications,
      total: result.total,
      totalPages: Math.ceil(result.total / limit),
    };
  }

  async createNotification(
    params: CreateNotificationDto,
  ): Promise<Notification> {
    const notification = Notification.create({
      notificationName: params.notificationName,
      subject: params.subject,
      content: params.content,
      userId: params.userId,
      notificationChannel: params.notificationChannel,
    });

    return await this.notificationRepository.insert(notification);
  }

  /**
   * Push notification to user based on their channel subscriptions
   * 1. Check what channels the user is subscribed to
   * 2. Get the notification template to determine which channels to use
   * 3. Create jobs for each active channel that matches subscriptions
   */
  async pushNotification(
    request: PushNotificationRequestDto,
  ): Promise<PushNotificationResponseDto> {
    const { userId, companyId, notificationName } = request;

    const response: PushNotificationResponseDto = {
      success: false,
      notifiedChannels: [],
      errors: [],
      totalJobsCreated: 0,
    };

    try {
      // Step 1: Get user's channel subscriptions
      const channelSubscriptions =
        await this.channelSubscriptionUseCase.getChannels({
          userId,
          companyId,
        });

      // Extract subscribed channels (only active ones)
      const subscribedChannels = new Set<NotificationChannel>();
      for (const group of channelSubscriptions) {
        const hasActiveSubscription = group.subscriptions.some(
          (sub) => sub.isActive,
        );
        if (hasActiveSubscription) {
          subscribedChannels.add(group.channel);
        }
      }

      if (subscribedChannels.size === 0) {
        response.errors.push({
          channel: 'general',
          error: 'No active channel subscriptions found for user',
        });
        return response;
      }

      // Step 2: Get notification template
      const notificationTemplate =
        await this.getNotificationTemplateUseCase.execute(notificationName);
      if (!notificationTemplate) {
        response.errors.push({
          channel: 'general',
          error: `Notification template '${notificationName}' not found`,
        });
        return response;
      }

      // Step 3: Determine which channels to notify based on template and subscriptions
      const channelsToNotify: NotificationChannel[] = [];

      for (const [channel, channelDetail] of Object.entries(
        notificationTemplate.channelDetails,
      )) {
        const notificationChannel = channel as NotificationChannel;

        // Check if channel is active in template and user is subscribed
        if (
          channelDetail.active &&
          subscribedChannels.has(notificationChannel)
        ) {
          channelsToNotify.push(notificationChannel);
        }
      }

      if (channelsToNotify.length === 0) {
        response.errors.push({
          channel: 'general',
          error:
            'No matching active channels found between template and user subscriptions',
        });
        return response;
      }

      // Step 4: Fetch user data and render templates in domain
      const userData = await this.userDataService.getUserById(userId);

      // Step 5: Create jobs for each channel using pre-rendered content
      const jobPromises = [];

      for (const channel of channelsToNotify) {
        const { subject, content } = notificationTemplate.render(
          channel,
          userData,
        );

        try {
          let jobPromise;
          switch (channel) {
            case NotificationChannel.EMAIL:
              jobPromise = this.emailQueue.add(
                'send-email',
                {
                  notificationName,
                  subject,
                  content,
                  userId,
                },
                {
                  delay: 0,
                  attempts: 3,
                  backoff: { type: 'exponential', delay: 2000 },
                },
              );
              break;

            case NotificationChannel.UI:
              // Use existing UI processor via ui-notifications queue
              jobPromise = this.uiQueue.add(
                'send-ui',
                {
                  notificationName,
                  subject,
                  content,
                  userId,
                },
                {
                  delay: 0,
                  attempts: 3,
                  backoff: { type: 'exponential', delay: 2000 },
                },
              );
              break;

            default:
              response.errors.push({
                channel,
                error: `Unsupported notification channel: ${channel}`,
              });
              continue;
          }

          if (jobPromise) {
            jobPromises.push(jobPromise);
            response.notifiedChannels.push(channel);
          }
        } catch (error) {
          response.errors.push({
            channel,
            error: `Failed to create job: ${error.message}`,
          });
        }
      }

      // Wait for all jobs to be created
      const jobs = await Promise.allSettled(jobPromises);
      response.totalJobsCreated = jobs.filter(
        (job) => job.status === 'fulfilled',
      ).length;

      response.success = response.totalJobsCreated > 0;
    } catch (error) {
      response.errors.push({
        channel: 'general',
        error: `Unexpected error: ${error.message}`,
      });
    }

    return response;
  }
}
