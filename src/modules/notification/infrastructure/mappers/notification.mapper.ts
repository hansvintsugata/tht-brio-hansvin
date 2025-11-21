import { Notification } from '../../domain/entities/notification.entity';
import { NotificationPersistenceModel } from '../persistence/notification-persistence.model';
import { NotificationChannel } from '@common/enums/notification-channel.enum';

export class NotificationMapper {
  static toPersistence(
    notification: Notification,
  ): NotificationPersistenceModel {
    return {
      notificationName: notification.notificationName,
      subject: notification.subject,
      content: notification.content,
      userId: notification.userId,
      notificationChannel: notification.notificationChannel,
      createdAt: notification.createdAt,
      updatedAt: notification.updatedAt,
    } as NotificationPersistenceModel;
  }

  static toDomain(
    notificationName: string,
    subject: string,
    content: string,
    userId: string,
    notificationChannel: NotificationChannel,
    createdAt: Date,
    updatedAt: Date,
  ): Notification {
    return Notification.create({
      notificationName,
      subject,
      content,
      userId,
      notificationChannel,
      createdAt,
      updatedAt,
    });
  }
}
