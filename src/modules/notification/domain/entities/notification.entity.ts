import { NotificationChannel } from '@common/enums/notification-channel.enum';

export class Notification {
  private constructor(
    private readonly _notificationName: string,
    private readonly _subject: string,
    private readonly _content: string,
    private readonly _userId: string,
    private readonly _notificationChannel: NotificationChannel,
    private readonly _createdAt: Date,
    private readonly _updatedAt: Date,
  ) {}

  get notificationName(): string {
    return this._notificationName;
  }

  get subject(): string {
    return this._subject;
  }

  get content(): string {
    return this._content;
  }

  get userId(): string {
    return this._userId;
  }

  get notificationChannel(): NotificationChannel {
    return this._notificationChannel;
  }

  get createdAt(): Date {
    return this._createdAt;
  }

  get updatedAt(): Date {
    return this._updatedAt;
  }

  static create(params: {
    notificationName: string;
    subject?: string;
    content: string;
    userId: string;
    notificationChannel: NotificationChannel;
    createdAt?: Date;
    updatedAt?: Date;
  }): Notification {
    if (!params.notificationName || params.notificationName.trim() === '') {
      throw new Error('Notification name is required');
    }

    if (!params.content || params.content.trim() === '') {
      throw new Error('Content is required');
    }

    if (!params.userId || params.userId.trim() === '') {
      throw new Error('User ID is required');
    }

    if (!params.notificationChannel) {
      throw new Error('Notification channel is required');
    }

    return new Notification(
      params.notificationName,
      params.subject,
      params.content,
      params.userId,
      params.notificationChannel,
      params.createdAt || new Date(),
      params.updatedAt || new Date(),
    );
  }
}
