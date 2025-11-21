import { Test, TestingModule } from '@nestjs/testing';
import { Job } from 'bullmq';
import { UiProcessor } from './ui.processor';
import { NotificationUseCase } from '../../application/use-cases/notification.use-case';
import { UserDataService } from '../../infrastructure/outbound/user-data.service';
import { NotificationChannel } from '@common/enums/notification-channel.enum';
import { UiJobData } from '../../application/dto/ui-job-data.dto';
import { Notification } from '../../domain/entities/notification.entity';

// Mock console.log to avoid cluttering test output
const originalConsoleLog = console.log;

describe('UiProcessor', () => {
  let processor: UiProcessor;
  let mockNotificationUseCase: jest.Mocked<NotificationUseCase>;
  let mockUserDataService: jest.Mocked<UserDataService>;

  beforeEach(async () => {
    // Create mock implementations
    mockNotificationUseCase = {
      createNotification: jest.fn(),
    } as any;

    mockUserDataService = {
      getUserById: jest.fn(),
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
        {
          provide: UserDataService,
          useValue: mockUserDataService,
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
        content: 'Hello {{fullName}}, welcome to {{companyName}}!',
        userId: 'user-001',
      },
      updateProgress: jest.fn(),
    } as any;

    const mockUserData = {
      id: 'user-001',
      firstName: 'John',
      lastName: 'Doe',
      fullName: 'John Doe',
      companyName: 'TechCorp Solutions',
      email: 'john.doe@techcorp.com',
    };

    it('should process UI notification successfully', async () => {
      mockUserDataService.getUserById.mockResolvedValue(mockUserData);
      mockNotificationUseCase.createNotification.mockResolvedValue(
        Notification.create({
          notificationName: 'welcome-ui',
          subject: '',
          content: 'Hello John Doe, welcome to TechCorp Solutions!',
          userId: 'user-001',
          notificationChannel: NotificationChannel.UI,
        })
      );

      await processor.process(mockJob);

      expect(mockUserDataService.getUserById).toHaveBeenCalledWith('user-001');
      expect(mockNotificationUseCase.createNotification).toHaveBeenCalledWith({
        notificationName: 'welcome-ui',
        subject: '',
        content: 'Hello John Doe, welcome to TechCorp Solutions!',
        userId: 'user-001',
        notificationChannel: NotificationChannel.UI,
      });
      expect(mockJob.updateProgress).toHaveBeenCalledWith(100);
    });

    it('should handle template variables correctly', async () => {
      const jobWithVariables: Job<UiJobData> = {
        id: 'job-456',
        data: {
          notificationName: 'announcement-ui',
          subject: 'Important Announcement',
          content: 'Dear {{fullName}}, your company {{companyName}} has a new update.',
          userId: 'user-002',
        },
        updateProgress: jest.fn(),
      } as any;

      const userDataWithVariables = {
      id: 'user-002',
      firstName: 'Jane',
      lastName: 'Smith',
      fullName: 'Jane Smith',
      companyName: 'InnovateTech',
      email: 'jane.smith@innovatetech.com',
    };

      mockUserDataService.getUserById.mockResolvedValue(userDataWithVariables);
      mockNotificationUseCase.createNotification.mockResolvedValue(
        Notification.create({
          notificationName: 'announcement-ui',
          subject: '',
          content: 'Dear Jane Smith, your company InnovateTech has a new update.',
          userId: 'user-002',
          notificationChannel: NotificationChannel.UI,
        })
      );

      await processor.process(jobWithVariables);

      expect(mockNotificationUseCase.createNotification).toHaveBeenCalledWith({
        notificationName: 'announcement-ui',
        subject: '',
        content: 'Dear Jane Smith, your company InnovateTech has a new update.',
        userId: 'user-002',
        notificationChannel: NotificationChannel.UI,
      });
    });

    it('should handle missing template variables gracefully', async () => {
      const jobWithMissingVariables: Job<UiJobData> = {
        id: 'job-789',
        data: {
          notificationName: 'missing-vars-ui',
          subject: 'Test',
          content: 'Hello {{fullName}}, your role is {{role}} at {{companyName}}.',
          userId: 'user-003',
        },
        updateProgress: jest.fn(),
      } as any;

      const userDataMissingVars = {
      id: 'user-003',
      firstName: 'Bob',
      lastName: 'Johnson',
      fullName: 'Bob Johnson',
      companyName: 'StartupXYZ',
      email: 'bob.johnson@startupxyz.com',
      // Note: 'role' is missing from user data
    };

      mockUserDataService.getUserById.mockResolvedValue(userDataMissingVars);
      mockNotificationUseCase.createNotification.mockResolvedValue(
        Notification.create({
          notificationName: 'missing-vars-ui',
          subject: '',
          content: 'Hello Bob Johnson, your role is {{role}} at StartupXYZ.',
          userId: 'user-003',
          notificationChannel: NotificationChannel.UI,
        })
      );

      await processor.process(jobWithMissingVariables);

      expect(mockNotificationUseCase.createNotification).toHaveBeenCalledWith({
        notificationName: 'missing-vars-ui',
        subject: '',
        content: 'Hello Bob Johnson, your role is {{role}} at StartupXYZ.',
        userId: 'user-003',
        notificationChannel: NotificationChannel.UI,
      });
    });

    it('should throw error when user data fetch fails', async () => {
      mockUserDataService.getUserById.mockRejectedValue(
        new Error('User not found')
      );

      await expect(processor.process(mockJob)).rejects.toThrow('User not found');

      expect(mockUserDataService.getUserById).toHaveBeenCalledWith('user-001');
      expect(mockNotificationUseCase.createNotification).not.toHaveBeenCalled();
      expect(mockJob.updateProgress).not.toHaveBeenCalled();
    });

    it('should continue processing even if notification creation fails', async () => {
      mockUserDataService.getUserById.mockResolvedValue(mockUserData);
      mockNotificationUseCase.createNotification.mockRejectedValue(
        new Error('Database connection failed')
      );

      // Should not throw error, just log the notification creation error
      await processor.process(mockJob);

      expect(mockUserDataService.getUserById).toHaveBeenCalledWith('user-001');
      expect(mockNotificationUseCase.createNotification).toHaveBeenCalledWith({
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

      const userDataWithoutVariables = {
      id: 'user-004',
      firstName: 'Alice',
      lastName: 'Brown',
      fullName: 'Alice Brown',
      companyName: 'SimpleCorp',
      email: 'alice.brown@simplecorp.com',
    };

      mockUserDataService.getUserById.mockResolvedValue(userDataWithoutVariables);
      mockNotificationUseCase.createNotification.mockResolvedValue(
        Notification.create({
          notificationName: 'simple-ui',
          subject: '',
          content: 'This is a simple UI notification without any variables.',
          userId: 'user-004',
          notificationChannel: NotificationChannel.UI,
        })
      );

      await processor.process(jobWithoutVariables);

      expect(mockNotificationUseCase.createNotification).toHaveBeenCalledWith({
        notificationName: 'simple-ui',
        subject: '',
        content: 'This is a simple UI notification without any variables.',
        userId: 'user-004',
        notificationChannel: NotificationChannel.UI,
      });
    });
  });

  describe('processTemplate', () => {
    it('should replace template variables correctly', () => {
      const template = 'Hello {{name}}, welcome to {{company}}!';
      const data = { name: 'John', company: 'TechCorp' };

      const result = processor['processTemplate'](template, data);

      expect(result).toBe('Hello John, welcome to TechCorp!');
    });

    it('should handle multiple occurrences of same variable', () => {
      const template = '{{name}} likes {{name}}\'s new {{item}}';
      const data = { name: 'John', item: 'car' };

      const result = processor['processTemplate'](template, data);

      expect(result).toBe('John likes John\'s new car');
    });

    it('should leave unmatched variables as-is', () => {
      const template = 'Hello {{name}}, your {{missing}} is here';
      const data = { name: 'John' };

      const result = processor['processTemplate'](template, data);

      expect(result).toBe('Hello John, your {{missing}} is here');
    });

    it('should handle empty template', () => {
      const template = '';
      const data = { name: 'John' };

      const result = processor['processTemplate'](template, data);

      expect(result).toBe('');
    });

    it('should handle template with no variables', () => {
      const template = 'This is a plain text without variables';
      const data = { name: 'John' };

      const result = processor['processTemplate'](template, data);

      expect(result).toBe('This is a plain text without variables');
    });
  });

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
        mockError
      );
    });
  });
});