import { Controller, Post, Body, HttpCode, HttpStatus } from '@nestjs/common';
import {
  SendNotificationRequestDto,
  SendNotificationResponseDto,
} from '../../application/dto/send-notification.dto';
import { PushNotificationRequestDto } from '../../application/dto/push-notification-request.dto';
import { PushNotificationResponseDto } from '../../application/dto/push-notification-response.dto';
import { NotificationUseCase } from '../../application/use-cases/notification.use-case';

@Controller('notifications')
export class NotificationInternalController {
  constructor(private readonly notificationUiUseCase: NotificationUseCase) {}

  @Post()
  @HttpCode(HttpStatus.OK)
  async sendNotification(
    @Body() request: SendNotificationRequestDto,
  ): Promise<SendNotificationResponseDto> {
    const { userId, companyId, notificationName } = request;

    if (!userId || !notificationName) {
      return {
        success: false,
        message: 'userId and notificationName are required',
      };
    }

    const pushRequest: PushNotificationRequestDto = {
      userId,
      companyId: companyId ?? '',
      notificationName,
    };

    const result: PushNotificationResponseDto =
      await this.notificationUiUseCase.pushNotification(pushRequest);

    return {
      success: result.success,
      message: result.success
        ? `Jobs created: ${result.totalJobsCreated} on channels: ${result.notifiedChannels.join(', ')}`
        : result.errors.map((e) => `${e.channel}: ${e.error}`).join('; '),
    };
  }
}
