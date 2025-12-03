import { Test, TestingModule } from '@nestjs/testing';
import { Job } from 'bullmq';
import { EmailProcessor } from './email.processor';
import { NotificationUseCase } from '../../application/use-cases/notification.use-case';
import { UserDataService } from '../../infrastructure/outbound/user-data.service';
import { EmailJobData } from '../../application/dto/email-job-data.dto';
import { NotificationChannel } from '@common/enums/notification-channel.enum';
import { Notification } from '../../domain/entities/notification.entity';

describe('EmailProcessor', () => {
  let processor: EmailProcessor;
  let mockNotificationUseCase: jest.Mocked<NotificationUseCase>;
  let mockUserDataService: jest.Mocked<UserDataService>;
  let mockJob: Partial<Job<EmailJobData>>;
  let consoleLogSpy: jest.SpyInstance;

  beforeEach(async () => {
    // Create mocks
    mockNotificationUseCase = {
      createNotification: jest.fn(),
    } as any;

    mockUserDataService = {
      getUserById: jest.fn(),
    } as any;

    // Mock console.log to avoid cluttering test output
    consoleLogSpy = jest.spyOn(console, 'log').mockImplementation();

    // Mock job object
    mockJob = {
      id: 'job-123',
      data: {
        notificationName: 'welcome-email',
        subject: 'Welcome {{firstName}}!',
        content: 'Hello {{fullName}}, welcome to {{companyName}}!',
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
        {
          provide: UserDataService,
          useValue: mockUserDataService,
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
    const mockUserData = {
      id: 'user-001',
      email: 'john.doe@techcorp.com',
      firstName: 'John',
      lastName: 'Doe',
      fullName: 'John Doe',
      companyName: 'TechCorp Solutions',
      phone: '+1-555-0123',
    };

    it('should process email job successfully', async () => {
      mockUserDataService.getUserById.mockResolvedValue(mockUserData);
      mockNotificationUseCase.createNotification.mockResolvedValue(
        Notification.create({
          notificationName: 'welcome-email',
          subject: 'Welcome John!',
          content: 'Hello John Doe, welcome to TechCorp Solutions!',
          userId: 'user-001',
          notificationChannel: NotificationChannel.EMAIL,
        }),
      );

      await processor.process(mockJob as Job<EmailJobData>);

      // Verify user data was fetched
      expect(mockUserDataService.getUserById).toHaveBeenCalledWith('user-001');

      // Verify notification was created with processed template
      expect(mockNotificationUseCase.createNotification).toHaveBeenCalledWith({
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
      expect(consoleLogSpy).toHaveBeenCalledWith(
        'To: John Doe <john.doe@techcorp.com>',
      );
      expect(consoleLogSpy).toHaveBeenCalledWith('Company: TechCorp Solutions');
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

      mockUserDataService.getUserById.mockResolvedValue(mockUserData);
      mockNotificationUseCase.createNotification.mockResolvedValue(
        Notification.create({
          notificationName: 'test-email',
          subject: 'Hello {{missingVar}}!',
          content: 'Your {{nonExistent}} variable',
          userId: 'user-001',
          notificationChannel: NotificationChannel.EMAIL,
        }),
      );

      await processor.process(jobWithMissingVars as Job<EmailJobData>);

      expect(mockNotificationUseCase.createNotification).toHaveBeenCalledWith({
        notificationName: 'test-email',
        subject: 'Hello {{missingVar}}!',
        content: 'Your {{nonExistent}} variable',
        userId: 'user-001',
        notificationChannel: NotificationChannel.EMAIL,
      });
    });

    it('should handle user data service errors', async () => {
      const error = new Error('User not found');
      mockUserDataService.getUserById.mockRejectedValue(error);

      await expect(
        processor.process(mockJob as Job<EmailJobData>),
      ).rejects.toThrow('User not found');

      expect(mockNotificationUseCase.createNotification).not.toHaveBeenCalled();
      expect(mockJob.updateProgress).not.toHaveBeenCalled();
    });

    it('should continue processing even if notification creation fails', async () => {
      mockUserDataService.getUserById.mockResolvedValue(mockUserData);
      const notificationError = new Error('Database connection failed');
      mockNotificationUseCase.createNotification.mockRejectedValue(
        notificationError,
      );

      // Mock logger to verify error was logged
      const loggerErrorSpy = jest.spyOn(processor['logger'], 'error');

      await processor.process(mockJob as Job<EmailJobData>);

      // Verify notification creation was attempted
      expect(mockNotificationUseCase.createNotification).toHaveBeenCalled();

      // Verify error was logged but job completed successfully
      expect(loggerErrorSpy).toHaveBeenCalledWith(
        'Failed to create notification record for user user-001:',
        notificationError,
      );

      // Verify job progress was still updated (job should complete despite notification error)
      expect(mockJob.updateProgress).toHaveBeenCalledWith(100);
    });

    it('should handle default user data when user not found', async () => {
      const defaultUserData = {
        id: 'user-999',
        email: 'user-user-999@example.com',
        firstName: 'Unknown',
        lastName: 'User',
        fullName: 'Unknown User',
        companyName: 'Unknown Company',
      };

      mockUserDataService.getUserById.mockResolvedValue(defaultUserData);
      mockNotificationUseCase.createNotification.mockResolvedValue(
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
          ...mockJob.data,
          userId: 'user-999',
        },
      };

      await processor.process(jobForUnknownUser as Job<EmailJobData>);

      expect(mockUserDataService.getUserById).toHaveBeenCalledWith('user-999');
      expect(mockNotificationUseCase.createNotification).toHaveBeenCalledWith({
        notificationName: 'welcome-email',
        subject: 'Welcome Unknown!',
        content: 'Hello Unknown User, welcome to Unknown Company!',
        userId: 'user-999',
        notificationChannel: NotificationChannel.EMAIL,
      });
    });
  });

  describe('processTemplate', () => {
    it('should replace template variables with user data', () => {
      const template =
        'Hello {{firstName}} {{lastName}}, welcome to {{companyName}}!';
      const data = {
        firstName: 'John',
        lastName: 'Doe',
        companyName: 'TechCorp',
      };

      const result = processor['processTemplate'](template, data);
      expect(result).toBe('Hello John Doe, welcome to TechCorp!');
    });

    it('should leave unmatched variables as-is', () => {
      const template = 'Hello {{firstName}}, your {{missingVar}} is ready!';
      const data = {
        firstName: 'John',
      };

      const result = processor['processTemplate'](template, data);
      expect(result).toBe('Hello John, your {{missingVar}} is ready!');
    });

    it('should handle empty template', () => {
      const result = processor['processTemplate']('', {});
      expect(result).toBe('');
    });

    it('should handle template with no variables', () => {
      const template = 'Simple text without variables';
      const result = processor['processTemplate'](template, {});
      expect(result).toBe('Simple text without variables');
    });

    it('should handle multiple occurrences of same variable', () => {
      const template = '{{name}} says hello, {{name}} is here!';
      const data = {
        name: 'John',
      };

      const result = processor['processTemplate'](template, data);
      expect(result).toBe('John says hello, John is here!');
    });
  });

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
