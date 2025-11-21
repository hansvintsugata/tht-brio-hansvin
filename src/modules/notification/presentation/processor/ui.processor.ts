import { Processor, WorkerHost, OnWorkerEvent } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { Logger } from '@nestjs/common';
import { NotificationChannel } from '@common/enums/notification-channel.enum';
import { NotificationUseCase } from '../../application/use-cases/notification.use-case';
import { UiJobData } from '../../application/dto/ui-job-data.dto';
import { UserDataService } from '../../infrastructure/outbound/user-data.service';

@Processor('ui-notifications')
export class UiProcessor extends WorkerHost {
  private readonly logger = new Logger(UiProcessor.name);

  constructor(
    private readonly notificationUseCase: NotificationUseCase,
    private readonly userDataService: UserDataService,
  ) {
    super();
  }

  async process(job: Job<UiJobData>): Promise<any> {
    const { notificationName, content, userId } = job.data;

    this.logger.log(
      `Processing UI notification job ${job.id} for user ${userId}`,
    );
    this.logger.log(`Notification: ${notificationName}`);

    try {
      // Fetch user data from UserDataService
      const userData = await this.userDataService.getUserById(userId);

      // Process template variables with user data
      const processedContent = this.processTemplate(content, userData);

      // Console log the UI notification content with user data from service
      console.log('=== UI NOTIFICATION ===');
      console.log(`To: ${userData.fullName} (${userData.companyName})`);
      console.log('Content:');
      console.log(processedContent);
      console.log('========================');

      // Create notification record after successful UI processing
      try {
        await this.notificationUseCase.createNotification({
          notificationName: notificationName,
          subject: '',
          content: processedContent,
          userId: userId,
          notificationChannel: NotificationChannel.UI,
        });
        this.logger.log(
          `Notification record created for user ${userId} with notification ${notificationName}`,
        );
      } catch (notificationError) {
        this.logger.error(
          `Failed to create notification record for user ${userId}:`,
          notificationError,
        );
        // Don't throw here - UI notification was processed successfully, just log the notification creation error
      }

      this.logger.log(
        `UI notification processed successfully for user ${userId}`,
      );

      // Mark job as completed
      await job.updateProgress(100);
    } catch (error) {
      this.logger.error(
        `Failed to process UI notification job ${job.id}:`,
        error,
      );
      throw error;
    }
  }

  /**
   * Simple template variable replacement
   * Replaces {{variableName}} with actual values from templateData
   */
  private processTemplate(template: string, data: Record<string, any>): string {
    return template.replace(/\{\{(\w+)\}\}/g, (match, variableName: string) => {
      return (data[variableName] as string) || match;
    });
  }

  @OnWorkerEvent('completed')
  onCompleted() {
    this.logger.log('UI notification job completed');
  }

  @OnWorkerEvent('failed')
  onFailed(job: Job, error: Error) {
    this.logger.error(`UI notification job failed:`, error);
  }
}
