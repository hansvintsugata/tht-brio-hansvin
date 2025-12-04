import { Test, TestingModule } from '@nestjs/testing';
import { Job } from 'bullmq';
import { UiProcessor } from './ui.processor';
import { NotificationUseCase } from '../../application/use-cases/notification.use-case';
import { NotificationChannel } from '@common/enums/notification-channel.enum';
import { UiJobData } from '../../application/dto/ui-job-data.dto';
import { Notification } from '../../domain/entities/notification.entity';

// Mock console.log to avoid cluttering test output
const originalConsoleLog = console.log;

describe('UiProcessor', () => {
  let processor: UiProcessor;
  let mockNotificationUseCase: jest.Mocked<NotificationUseCase>;

  beforeEach(async () => {
    // Create mock implementations
    mockNotificationUseCase = {
      createNotificationLog: jest.fn(),
    } as any;

    // Mock console.log to avoid test output clutter
    console.log = jest.fn();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UiProcessor,
        {
          provide: NotificationUseCase,
          useValue: mockNotificationUseCase,
        },
      ],
    }).compile();

    processor = module.get<UiProcessor>(UiProcessor);
  });

  afterEach(() => {
    jest.clearAllMocks();
    console.log = originalConsoleLog;
  });

  describe('process', () => {
    const mockJob: Job<UiJobData> = {
      id: 'job-123',
      data: {
        notificationName: 'welcome-ui',
        subject: 'Welcome!',
        content: 'Hello John Doe, welcome to TechCorp Solutions!',
        userId: 'user-001',
      },
      updateProgress: jest.fn(),
    } as any;

    it('should process UI notification successfully', async () => {
      mockNotificationUseCase.createNotificationLog.mockResolvedValue(
        Notification.create({
          notificationName: 'welcome-ui',
          subject: '',
          content: 'Hello John Doe, welcome to TechCorp Solutions!',
          userId: 'user-001',
          notificationChannel: NotificationChannel.UI,
        }),
      );

      await processor.process(mockJob);

      expect(
        mockNotificationUseCase.createNotificationLog,
      ).toHaveBeenCalledWith({
        notificationName: 'welcome-ui',
        subject: '',
        content: 'Hello John Doe, welcome to TechCorp Solutions!',
        userId: 'user-001',
        notificationChannel: NotificationChannel.UI,
      });
      expect(mockJob.updateProgress).toHaveBeenCalledWith(100);
    });

    it('should pass through content (rendering handled upstream)', async () => {
      const jobWithVariables: Job<UiJobData> = {
        id: 'job-456',
        data: {
          notificationName: 'announcement-ui',
          subject: 'Important Announcement',
          content:
            'Dear Jane Smith, your company InnovateTech has a new update.',
          userId: 'user-002',
        },
        updateProgress: jest.fn(),
      } as any;
      mockNotificationUseCase.createNotificationLog.mockResolvedValue(
        Notification.create({
          notificationName: 'announcement-ui',
          subject: '',
          content:
            'Dear Jane Smith, your company InnovateTech has a new update.',
          userId: 'user-002',
          notificationChannel: NotificationChannel.UI,
        }),
      );

      await processor.process(jobWithVariables);

      expect(
        mockNotificationUseCase.createNotificationLog,
      ).toHaveBeenCalledWith({
        notificationName: 'announcement-ui',
        subject: '',
        content: 'Dear Jane Smith, your company InnovateTech has a new update.',
        userId: 'user-002',
        notificationChannel: NotificationChannel.UI,
      });
    });

    it('should handle missing template variables gracefully (passed through)', async () => {
      const jobWithMissingVariables: Job<UiJobData> = {
        id: 'job-789',
        data: {
          notificationName: 'missing-vars-ui',
          subject: 'Test',
          content:
            'Hello {{fullName}}, your role is {{role}} at {{companyName}}.',
          userId: 'user-003',
        },
        updateProgress: jest.fn(),
      } as any;

      mockNotificationUseCase.createNotificationLog.mockResolvedValue(
        Notification.create({
          notificationName: 'missing-vars-ui',
          subject: '',
          content:
            'Hello {{fullName}}, your role is {{role}} at {{companyName}}.',
          userId: 'user-003',
          notificationChannel: NotificationChannel.UI,
        }),
      );

      await processor.process(jobWithMissingVariables);

      expect(
        mockNotificationUseCase.createNotificationLog,
      ).toHaveBeenCalledWith({
        notificationName: 'missing-vars-ui',
        subject: '',
        content:
          'Hello {{fullName}}, your role is {{role}} at {{companyName}}.',
        userId: 'user-003',
        notificationChannel: NotificationChannel.UI,
      });
    });

    it('should not depend on user data service', async () => {
      mockNotificationUseCase.createNotificationLog.mockResolvedValue(
        Notification.create({
          notificationName: 'welcome-ui',
          subject: '',
          content: 'Hello John Doe, welcome to TechCorp Solutions!',
          userId: 'user-001',
          notificationChannel: NotificationChannel.UI,
        }),
      );

      await processor.process(mockJob);
      expect(mockNotificationUseCase.createNotificationLog).toHaveBeenCalled();
      expect(mockJob.updateProgress).toHaveBeenCalledWith(100);
    });

    it('should continue processing even if notification creation fails', async () => {
      mockNotificationUseCase.createNotificationLog.mockRejectedValue(
        new Error('Database connection failed'),
      );

      // Should not throw error, just log the notification creation error
      await processor.process(mockJob);

      expect(
        mockNotificationUseCase.createNotificationLog,
      ).toHaveBeenCalledWith({
        notificationName: 'welcome-ui',
        subject: '',
        content: 'Hello John Doe, welcome to TechCorp Solutions!',
        userId: 'user-001',
        notificationChannel: NotificationChannel.UI,
      });
      expect(mockJob.updateProgress).toHaveBeenCalledWith(100);
    });

    it('should handle job without template variables', async () => {
      const jobWithoutVariables: Job<UiJobData> = {
        id: 'job-999',
        data: {
          notificationName: 'simple-ui',
          subject: 'Simple Message',
          content: 'This is a simple UI notification without any variables.',
          userId: 'user-004',
        },
        updateProgress: jest.fn(),
      } as any;

      mockNotificationUseCase.createNotificationLog.mockResolvedValue(
        Notification.create({
          notificationName: 'simple-ui',
          subject: '',
          content: 'This is a simple UI notification without any variables.',
          userId: 'user-004',
          notificationChannel: NotificationChannel.UI,
        }),
      );

      await processor.process(jobWithoutVariables);

      expect(
        mockNotificationUseCase.createNotificationLog,
      ).toHaveBeenCalledWith({
        notificationName: 'simple-ui',
        subject: '',
        content: 'This is a simple UI notification without any variables.',
        userId: 'user-004',
        notificationChannel: NotificationChannel.UI,
      });
    });
  });

  // No template processing tests in processor; rendering moved to domain/use case

  describe('event handlers', () => {
    it('should log completion event', () => {
      const loggerSpy = jest.spyOn(processor['logger'], 'log');

      processor.onCompleted();

      expect(loggerSpy).toHaveBeenCalledWith('UI notification job completed');
    });

    it('should log failure event with error', () => {
      const loggerSpy = jest.spyOn(processor['logger'], 'error');
      const mockJob: Job = { id: 'job-123' } as any;
      const mockError = new Error('Processing failed');

      processor.onFailed(mockJob, mockError);

      expect(loggerSpy).toHaveBeenCalledWith(
        'UI notification job failed:',
        mockError,
      );
    });
  });
});
