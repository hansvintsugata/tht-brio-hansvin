import { Test, TestingModule } from '@nestjs/testing';
import { ChannelSubscriptionUseCase } from './channel-subscription.use-case';
import { GetChannelsRequestDto, ChannelGroupDto } from '../dto/get-channels.dto';
import { ChannelSubscription } from '../../domain/entities/channel-subscription.entity';
import { SubscriberType } from '@common/enums/subscriber-types.enum';
import { NotificationChannel } from '@common/enums/notification-channel.enum';
import { IChannelSubscriptionRepository } from '../../domain/repository/channel-subscription-repository.interface';

describe('ChannelSubscriptionUseCase', () => {
  let useCase: ChannelSubscriptionUseCase;
  let mockRepository: jest.Mocked<IChannelSubscriptionRepository>;

  beforeEach(async () => {
    // Create mock repository
    mockRepository = {
      findBySubscriberIdAndType: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ChannelSubscriptionUseCase,
        {
          provide: 'IChannelSubscriptionRepository',
          useValue: mockRepository,
        },
      ],
    }).compile();

    useCase = module.get<ChannelSubscriptionUseCase>(ChannelSubscriptionUseCase);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getChannels', () => {
    it('should throw error when neither userId nor companyId is provided', async () => {
      const request: GetChannelsRequestDto = {};

      await expect(useCase.getChannels(request)).rejects.toThrow(
        'Either userId or companyId must be provided',
      );
    });

    it('should return user subscriptions when only userId is provided', async () => {
      const request: GetChannelsRequestDto = { userId: 'user-123' };
      const mockSubscriptions = [
        ChannelSubscription.create({
          id: '1',
          subscriberId: 'user-123',
          subscriberType: SubscriberType.USER,
          channel: NotificationChannel.EMAIL,
          isActive: true,
        }),
        ChannelSubscription.create({
          id: '2',
          subscriberId: 'user-123',
          subscriberType: SubscriberType.USER,
          channel: NotificationChannel.SMS,
          isActive: false,
        }),
      ];

      mockRepository.findBySubscriberIdAndType.mockResolvedValue(mockSubscriptions);

      const result = await useCase.getChannels(request);

      expect(mockRepository.findBySubscriberIdAndType).toHaveBeenCalledWith(
        'user-123',
        SubscriberType.USER,
      );
      expect(mockRepository.findBySubscriberIdAndType).toHaveBeenCalledTimes(1);

      expect(result).toHaveLength(2);
      expect(result[0].channel).toBe(NotificationChannel.EMAIL);
      expect(result[0].subscriptions).toHaveLength(1);
      expect(result[1].channel).toBe(NotificationChannel.SMS);
      expect(result[1].subscriptions).toHaveLength(1);
    });

    it('should return company subscriptions when only companyId is provided', async () => {
      const request: GetChannelsRequestDto = { companyId: 'company-456' };
      const mockSubscriptions = [
        ChannelSubscription.create({
          id: '3',
          subscriberId: 'company-456',
          subscriberType: SubscriberType.COMPANY,
          channel: NotificationChannel.UI,
          isActive: true,
        }),
      ];

      mockRepository.findBySubscriberIdAndType.mockResolvedValue(mockSubscriptions);

      const result = await useCase.getChannels(request);

      expect(mockRepository.findBySubscriberIdAndType).toHaveBeenCalledWith(
        'company-456',
        SubscriberType.COMPANY,
      );
      expect(mockRepository.findBySubscriberIdAndType).toHaveBeenCalledTimes(1);

      expect(result).toHaveLength(1);
      expect(result[0].channel).toBe(NotificationChannel.UI);
      expect(result[0].subscriptions).toHaveLength(1);
    });

    it('should return intersection of channels when both userId and companyId are provided', async () => {
      const request: GetChannelsRequestDto = {
        userId: 'user-123',
        companyId: 'company-456',
      };

      const userSubscriptions = [
        ChannelSubscription.create({
          id: '1',
          subscriberId: 'user-123',
          subscriberType: SubscriberType.USER,
          channel: NotificationChannel.EMAIL,
          isActive: true,
        }),
        ChannelSubscription.create({
          id: '2',
          subscriberId: 'user-123',
          subscriberType: SubscriberType.USER,
          channel: NotificationChannel.SMS,
          isActive: true,
        }),
      ];

      const companySubscriptions = [
        ChannelSubscription.create({
          id: '3',
          subscriberId: 'company-456',
          subscriberType: SubscriberType.COMPANY,
          channel: NotificationChannel.EMAIL,
          isActive: true,
        }),
        ChannelSubscription.create({
          id: '4',
          subscriberId: 'company-456',
          subscriberType: SubscriberType.COMPANY,
          channel: NotificationChannel.UI,
          isActive: true,
        }),
      ];

      mockRepository.findBySubscriberIdAndType
        .mockResolvedValueOnce(userSubscriptions)
        .mockResolvedValueOnce(companySubscriptions);

      const result = await useCase.getChannels(request);

      expect(mockRepository.findBySubscriberIdAndType).toHaveBeenCalledWith(
        'user-123',
        SubscriberType.USER,
      );
      expect(mockRepository.findBySubscriberIdAndType).toHaveBeenCalledWith(
        'company-456',
        SubscriberType.COMPANY,
      );
      expect(mockRepository.findBySubscriberIdAndType).toHaveBeenCalledTimes(2);

      // Should only return EMAIL channel since it's common to both
      expect(result).toHaveLength(1);
      expect(result[0].channel).toBe(NotificationChannel.EMAIL);
      expect(result[0].subscriptions).toHaveLength(2); // Both user and company subscriptions
    });

    it('should return empty array when no common channels exist for both user and company', async () => {
      const request: GetChannelsRequestDto = {
        userId: 'user-123',
        companyId: 'company-456',
      };

      const userSubscriptions = [
        ChannelSubscription.create({
          id: '1',
          subscriberId: 'user-123',
          subscriberType: SubscriberType.USER,
          channel: NotificationChannel.SMS,
          isActive: true,
        }),
      ];

      const companySubscriptions = [
        ChannelSubscription.create({
          id: '2',
          subscriberId: 'company-456',
          subscriberType: SubscriberType.COMPANY,
          channel: NotificationChannel.UI,
          isActive: true,
        }),
      ];

      mockRepository.findBySubscriberIdAndType
        .mockResolvedValueOnce(userSubscriptions)
        .mockResolvedValueOnce(companySubscriptions);

      const result = await useCase.getChannels(request);

      expect(result).toHaveLength(0);
    });

    it('should handle empty subscriptions gracefully', async () => {
      const request: GetChannelsRequestDto = { userId: 'user-123' };

      mockRepository.findBySubscriberIdAndType.mockResolvedValue([]);

      const result = await useCase.getChannels(request);

      expect(result).toHaveLength(0);
    });

    it('should group multiple subscriptions by the same channel', async () => {
      const request: GetChannelsRequestDto = { userId: 'user-123' };
      const mockSubscriptions = [
        ChannelSubscription.create({
          id: '1',
          subscriberId: 'user-123',
          subscriberType: SubscriberType.USER,
          channel: NotificationChannel.EMAIL,
          isActive: true,
        }),
        ChannelSubscription.create({
          id: '2',
          subscriberId: 'user-123',
          subscriberType: SubscriberType.USER,
          channel: NotificationChannel.EMAIL,
          isActive: false,
        }),
        ChannelSubscription.create({
          id: '3',
          subscriberId: 'user-123',
          subscriberType: SubscriberType.USER,
          channel: NotificationChannel.SMS,
          isActive: true,
        }),
      ];

      mockRepository.findBySubscriberIdAndType.mockResolvedValue(mockSubscriptions);

      const result = await useCase.getChannels(request);

      expect(result).toHaveLength(2); // EMAIL and SMS
      
      const emailGroup = result.find(group => group.channel === NotificationChannel.EMAIL);
      const smsGroup = result.find(group => group.channel === NotificationChannel.SMS);
      
      expect(emailGroup).toBeDefined();
      expect(emailGroup!.subscriptions).toHaveLength(2);
      
      expect(smsGroup).toBeDefined();
      expect(smsGroup!.subscriptions).toHaveLength(1);
    });

    it('should preserve both active and inactive subscriptions', async () => {
      const request: GetChannelsRequestDto = { userId: 'user-123' };
      const mockSubscriptions = [
        ChannelSubscription.create({
          id: '1',
          subscriberId: 'user-123',
          subscriberType: SubscriberType.USER,
          channel: NotificationChannel.EMAIL,
          isActive: true,
        }),
        ChannelSubscription.create({
          id: '2',
          subscriberId: 'user-123',
          subscriberType: SubscriberType.USER,
          channel: NotificationChannel.SMS,
          isActive: false,
        }),
      ];

      mockRepository.findBySubscriberIdAndType.mockResolvedValue(mockSubscriptions);

      const result = await useCase.getChannels(request);

      expect(result).toHaveLength(2);
      
      const emailGroup = result.find(group => group.channel === NotificationChannel.EMAIL);
      const smsGroup = result.find(group => group.channel === NotificationChannel.SMS);
      
      expect(emailGroup!.subscriptions[0].isActive).toBe(true);
      expect(smsGroup!.subscriptions[0].isActive).toBe(false);
    });
  });
});