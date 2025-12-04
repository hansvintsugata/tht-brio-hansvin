import { Test, TestingModule } from '@nestjs/testing';
import { Job } from 'bullmq';
import { EmailProcessor } from './email.processor';
import { NotificationUseCase } from '../../application/use-cases/notification.use-case';
import { EmailJobData } from '../../application/dto/email-job-data.dto';
import { NotificationChannel } from '@common/enums/notification-channel.enum';
import { Notification } from '../../domain/entities/notification.entity';

describe('EmailProcessor', () => {
  let processor: EmailProcessor;
  let mockNotificationUseCase: jest.Mocked<NotificationUseCase>;
  let mockJob: Partial<Job<EmailJobData>>;
  let consoleLogSpy: jest.SpyInstance;

  beforeEach(async () => {
    // Create mocks
    mockNotificationUseCase = {
      createNotificationLog: jest.fn(),
    } as any;

    // Mock console.log to avoid cluttering test output
    consoleLogSpy = jest.spyOn(console, 'log').mockImplementation();

    // Mock job object (pre-rendered content)
    mockJob = {
      id: 'job-123',
      data: {
        notificationName: 'welcome-email',
        subject: 'Welcome John!',
        content: 'Hello John Doe, welcome to TechCorp Solutions!',
        userId: 'user-001',
      },
      updateProgress: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EmailProcessor,
        {
          provide: NotificationUseCase,
          useValue: mockNotificationUseCase,
        },
      ],
    }).compile();

    processor = module.get<EmailProcessor>(EmailProcessor);
  });

  afterEach(() => {
    jest.clearAllMocks();
    consoleLogSpy.mockRestore();
  });

  describe('process', () => {
    it('should process email job successfully', async () => {
      mockNotificationUseCase.createNotificationLog.mockResolvedValue(
        Notification.create({
          notificationName: 'welcome-email',
          subject: 'Welcome John!',
          content: 'Hello John Doe, welcome to TechCorp Solutions!',
          userId: 'user-001',
          notificationChannel: NotificationChannel.EMAIL,
        }),
      );

      await processor.process(mockJob as Job<EmailJobData>);

      // Verify notification was created with provided content
      expect(
        mockNotificationUseCase.createNotificationLog,
      ).toHaveBeenCalledWith({
        notificationName: 'welcome-email',
        subject: 'Welcome John!',
        content: 'Hello John Doe, welcome to TechCorp Solutions!',
        userId: 'user-001',
        notificationChannel: NotificationChannel.EMAIL,
      });

      // Verify job progress was updated
      expect(mockJob.updateProgress).toHaveBeenCalledWith(100);

      // Verify console output
      expect(consoleLogSpy).toHaveBeenCalledWith('=== EMAIL NOTIFICATION ===');
      expect(consoleLogSpy).toHaveBeenCalledWith('To: User user-001');
      expect(consoleLogSpy).toHaveBeenCalledWith('Subject: Welcome John!');
      expect(consoleLogSpy).toHaveBeenCalledWith('Content:');
      expect(consoleLogSpy).toHaveBeenCalledWith(
        'Hello John Doe, welcome to TechCorp Solutions!',
      );
      expect(consoleLogSpy).toHaveBeenCalledWith('========================');
    });

    it('should handle missing template variables gracefully', async () => {
      const jobWithMissingVars = {
        ...mockJob,
        data: {
          notificationName: 'test-email',
          subject: 'Hello {{missingVar}}!',
          content: 'Your {{nonExistent}} variable',
          userId: 'user-001',
        },
      };
      mockNotificationUseCase.createNotificationLog.mockResolvedValue(
        Notification.create({
          notificationName: 'test-email',
          subject: 'Hello {{missingVar}}!',
          content: 'Your {{nonExistent}} variable',
          userId: 'user-001',
          notificationChannel: NotificationChannel.EMAIL,
        }),
      );

      await processor.process(jobWithMissingVars as Job<EmailJobData>);

      expect(
        mockNotificationUseCase.createNotificationLog,
      ).toHaveBeenCalledWith({
        notificationName: 'test-email',
        subject: 'Hello {{missingVar}}!',
        content: 'Your {{nonExistent}} variable',
        userId: 'user-001',
        notificationChannel: NotificationChannel.EMAIL,
      });
    });

    it('should handle generic processing path without user data', async () => {
      await processor.process(mockJob as Job<EmailJobData>);
      expect(mockNotificationUseCase.createNotificationLog).toHaveBeenCalled();
      expect(mockJob.updateProgress).toHaveBeenCalledWith(100);
    });

    it('should continue processing even if notification creation fails', async () => {
      const notificationError = new Error('Database connection failed');
      mockNotificationUseCase.createNotificationLog.mockRejectedValue(
        notificationError,
      );

      // Mock logger to verify error was logged
      const loggerErrorSpy = jest.spyOn(processor['logger'], 'error');

      await processor.process(mockJob as Job<EmailJobData>);

      // Verify notification creation was attempted
      expect(mockNotificationUseCase.createNotificationLog).toHaveBeenCalled();

      // Verify error was logged but job completed successfully
      expect(loggerErrorSpy).toHaveBeenCalledWith(
        'Failed to create notification record for user user-001:',
        notificationError,
      );

      // Verify job progress was still updated (job should complete despite notification error)
      expect(mockJob.updateProgress).toHaveBeenCalledWith(100);
    });

    it('should handle default content when user is unknown (pre-rendered)', async () => {
      mockNotificationUseCase.createNotificationLog.mockResolvedValue(
        Notification.create({
          notificationName: 'welcome-email',
          subject: 'Welcome Unknown!',
          content: 'Hello Unknown User, welcome to Unknown Company!',
          userId: 'user-999',
          notificationChannel: NotificationChannel.EMAIL,
        }),
      );

      const jobForUnknownUser = {
        ...mockJob,
        data: {
          notificationName: 'welcome-email',
          subject: 'Welcome Unknown!',
          content: 'Hello Unknown User, welcome to Unknown Company!',
          userId: 'user-999',
        },
      };

      await processor.process(jobForUnknownUser as Job<EmailJobData>);

      expect(
        mockNotificationUseCase.createNotificationLog,
      ).toHaveBeenCalledWith({
        notificationName: 'welcome-email',
        subject: 'Welcome Unknown!',
        content: 'Hello Unknown User, welcome to Unknown Company!',
        userId: 'user-999',
        notificationChannel: NotificationChannel.EMAIL,
      });
    });
  });

  // No template processing tests in processor; rendering moved to domain/use case

  describe('event handlers', () => {
    it('should log completion event', () => {
      const loggerLogSpy = jest.spyOn(processor['logger'], 'log');
      processor.onCompleted();
      expect(loggerLogSpy).toHaveBeenCalledWith(
        'Email notification job completed',
      );
    });

    it('should log failure event with error', () => {
      const loggerErrorSpy = jest.spyOn(processor['logger'], 'error');
      const mockError = new Error('Job failed');
      const mockJob = { id: 'job-123' } as Job;

      processor.onFailed(mockJob, mockError);
      expect(loggerErrorSpy).toHaveBeenCalledWith(
        'Email notification job failed:',
        mockError,
      );
    });
  });
});
