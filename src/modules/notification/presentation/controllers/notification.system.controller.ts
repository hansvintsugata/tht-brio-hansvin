import {
  Controller,
  Post,
  Body,
  BadRequestException,
  InternalServerErrorException,
} from '@nestjs/common';
import { SendNotificationRequestDto, SendNotificationResponseDto } from '../dto/send-notification.dto';
import { PushNotificationRequestDto, PushNotificationResponseDto } from '../dto/push-notification.dto';
import { NotificationUseCase } from '../../application/use-cases/notification.use-case';

@Controller('notifications')
export class NotificationInternalController {
  constructor(private readonly notificationUiUseCase: NotificationUseCase) {}

  @Post()
  async sendNotification(
    @Body() request: SendNotificationRequestDto,
  ): Promise<SendNotificationResponseDto> {
    const { userId, companyId, notificationName } = request;

    if (!userId || userId.trim() === '') {
      throw new BadRequestException('userId is required');
    }

    if (!notificationName || notificationName.trim() === '') {
      throw new BadRequestException('notificationName is required');
    }

    const pushRequest: PushNotificationRequestDto = {
      userId,
      companyId: companyId ?? '',
      notificationName,
    };

    const result: PushNotificationResponseDto =
      await this.notificationUiUseCase.pushNotification(pushRequest);

    if (!result.success) {
      const message = result.errors
        .map((e) => `${e.channel}: ${e.error}`)
        .join('; ');
      throw new InternalServerErrorException(
        message || 'Failed to process notification',
      );
    }

    return {
      success: true,
      message: `Jobs created: ${result.totalJobsCreated} on channels: ${result.notifiedChannels.join(', ')}`,
    };
  }
}
