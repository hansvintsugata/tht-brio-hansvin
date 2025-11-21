import { Processor, WorkerHost, OnWorkerEvent } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { Logger } from '@nestjs/common';
import { NotificationChannel } from '@common/enums/notification-channel.enum';
import { EmailJobData } from '../../application/dto/email-job-data.dto';
import { NotificationUseCase } from '../../application/use-cases/notification.use-case';
import { UserDataService } from '../../infrastructure/outbound/user-data.service';

@Processor('email-notifications')
export class EmailProcessor extends WorkerHost {
  private readonly logger = new Logger(EmailProcessor.name);

  constructor(
    private readonly notificationUseCase: NotificationUseCase,
    private readonly userDataService: UserDataService,
  ) {
    super();
  }

  async process(job: Job<EmailJobData>): Promise<any> {
    const { notificationName, subject, content, userId } = job.data;

    this.logger.log(
      `Processing email notification job ${job.id} for user ${userId}`,
    );
    this.logger.log(`Template: ${notificationName}`);

    try {
      // Fetch user data from UserDataService
      const userData = await this.userDataService.getUserById(userId);

      // Process template variables with user data
      const processedSubject = this.processTemplate(subject, userData);
      const processedContent = this.processTemplate(content, userData);

      // Console log the email content with user data from service
      console.log('=== EMAIL NOTIFICATION ===');
      console.log(`To: ${userData.fullName} <${userData.email}>`);
      console.log(`Company: ${userData.companyName}`);
      console.log(`Subject: ${processedSubject}`);
      console.log('Content:');
      console.log(processedContent);
      console.log('========================');

      // Create notification record after successful email processing
      try {
        await this.notificationUseCase.createNotification({
          notificationName: notificationName,
          subject: processedSubject,
          content: processedContent,
          userId: userId,
          notificationChannel: NotificationChannel.EMAIL,
        });
        this.logger.log(
          `Notification record created for user ${userId} with template ${notificationName}`,
        );
      } catch (notificationError) {
        this.logger.error(
          `Failed to create notification record for user ${userId}:`,
          notificationError,
        );
        // Don't throw here - email was sent successfully, just log the notification creation error
      }

      this.logger.log(
        `Email notification processed successfully for user ${userId}`,
      );

      // Mark job as completed
      await job.updateProgress(100);
    } catch (error) {
      this.logger.error(
        `Failed to process email notification job ${job.id}:`,
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
    this.logger.log('Email notification job completed');
  }

  @OnWorkerEvent('failed')
  onFailed(job: Job, error: Error) {
    this.logger.error(`Email notification job failed:`, error);
  }
}
