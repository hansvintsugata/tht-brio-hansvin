import { NotificationChannel } from '@common/enums/notification-channel.enum';
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type NotificationPersistenceModelDocument =
  NotificationPersistenceModel & Document;

@Schema({
  collection: 'notifications',
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true },
})
export class NotificationPersistenceModel {
  @Prop({ required: true })
  notificationName: string;

  @Prop({ required: false })
  subject: string;

  @Prop({ required: true })
  content: string;

  @Prop({ required: true })
  userId: string;

  @Prop({ required: true, enum: NotificationChannel })
  notificationChannel: NotificationChannel;

  createdAt: Date;
  updatedAt: Date;
}

export const NotificationSchema = SchemaFactory.createForClass(
  NotificationPersistenceModel,
);

NotificationSchema.index({ userId: 1, createdAt: -1 });
NotificationSchema.index({ notificationName: 1, userId: 1 });
NotificationSchema.index({ notificationChannel: 1, userId: 1 });
