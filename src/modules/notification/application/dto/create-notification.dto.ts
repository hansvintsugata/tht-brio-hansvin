import { NotificationChannel } from '@common/enums/notification-channel.enum';

export interface CreateNotificationDto {
  notificationName: string;
  subject: string;
  content: string;
  userId: string;
  notificationChannel: NotificationChannel;
}
