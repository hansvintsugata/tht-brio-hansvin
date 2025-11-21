import { NotificationChannel } from '@common/enums/notification-channel.enum';
import { Notification } from '../entities/notification.entity';

export interface INotificationRepository {
  insert(notification: Notification): Promise<Notification>;
  getListByNotificationChannelAndUserIdPaginated(
    channel: NotificationChannel,
    userId: string,
    page: number,
    limit: number,
  ): Promise<{ notifications: Notification[]; total: number }>;
}
