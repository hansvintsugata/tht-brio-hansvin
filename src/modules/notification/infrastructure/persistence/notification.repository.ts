import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { INotificationRepository } from '../../domain/repository/notification-repository.interface';
import { Notification } from '../../domain/entities/notification.entity';
import { NotificationChannel } from '@common/enums/notification-channel.enum';
import {
  NotificationPersistenceModel,
  NotificationPersistenceModelDocument,
} from './notification-persistence.model';
import { NotificationMapper } from '../mappers/notification.mapper';

@Injectable()
export class NotificationRepository implements INotificationRepository {
  constructor(
    @InjectModel(NotificationPersistenceModel.name)
    private notificationModel: Model<NotificationPersistenceModelDocument>,
  ) {}

  async insert(notification: Notification): Promise<Notification> {
    const persistenceData = NotificationMapper.toPersistence(notification);
    const persistenceModel = new this.notificationModel(persistenceData);

    const saved = await persistenceModel.save();

    return NotificationMapper.toDomain(
      saved.notificationName,
      saved.subject,
      saved.content,
      saved.userId,
      saved.notificationChannel,
      saved.createdAt,
      saved.updatedAt,
    );
  }

  async getListByNotificationChannelAndUserIdPaginated(
    channel: NotificationChannel,
    userId: string,
    page: number,
    limit: number,
  ): Promise<{ notifications: Notification[]; total: number }> {
    const skip = (page - 1) * limit;

    const [notifications, total] = await Promise.all([
      this.notificationModel
        .find({
          notificationChannel: channel,
          userId: userId,
        })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .exec(),
      this.notificationModel.countDocuments({
        notificationChannel: channel,
        userId: userId,
      }),
    ]);

    console.log(notifications);

    const domainNotifications = notifications.map((notification) =>
      NotificationMapper.toDomain(
        notification.notificationName,
        notification.subject,
        notification.content,
        notification.userId,
        notification.notificationChannel,
        notification.createdAt,
        notification.updatedAt,
      ),
    );

    return {
      notifications: domainNotifications,
      total,
    };
  }
}
