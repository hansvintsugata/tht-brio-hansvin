import { Controller, Get, Query, BadRequestException } from '@nestjs/common';
import {
  GetUiNotificationsRequestDto,
  GetUiNotificationsResponseDto,
} from '../../application/dto/get-ui-notifications.dto';
import { NotificationUseCase } from '../../application/use-cases/notification.use-case';

@Controller('notifications')
export class NotificationUserController {
  constructor(private readonly notificationUiUseCase: NotificationUseCase) {}

  @Get('ui')
  async getUiNotifications(
    @Query() query: GetUiNotificationsRequestDto,
  ): Promise<GetUiNotificationsResponseDto> {
    const { userId, page = 1, limit = 10 } = query;

    if (!userId || userId.trim() === '') {
      throw new BadRequestException('UserId is required');
    }

    try {
      const result =
        await this.notificationUiUseCase.getUiNotificationsByUserPaginated(
          userId,
          page,
          limit,
        );

      const response = new GetUiNotificationsResponseDto();
      response.notifications = result.notifications.map((notification) => ({
        notificationName: notification.notificationName,
        subject: notification.subject,
        content: notification.content,
        userId: notification.userId,
        notificationChannel: notification.notificationChannel,
        createdAt: notification.createdAt,
        updatedAt: notification.updatedAt,
      }));
      response.page = page;
      response.limit = limit;
      response.total = result.total;
      response.totalPages = result.totalPages;
      return response;
    } catch (error) {
      const response = new GetUiNotificationsResponseDto();
      response.notifications = [];
      response.page = 1;
      response.limit = 10;
      response.total = 0;
      response.totalPages = 0;
      return response;
    }
  }
}
