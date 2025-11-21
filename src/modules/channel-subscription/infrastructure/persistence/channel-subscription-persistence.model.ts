import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

/**
 * MongoDB schema for ChannelSubscription
 * This contains the persistence-specific implementation
 */
@Schema({
  timestamps: true,
  collection: 'channel_subscriptions',
})
export class ChannelSubscriptionPersistenceModel {
  @Prop({
    type: String,
    required: true,
    description: 'Unique identifier for the subscription',
  })
  _id: string;

  @Prop({
    type: String,
    required: true,
    description: 'ID of the subscriber (user, employee, company, etc.)',
  })
  subscriberId: string;

  @Prop({
    type: String,
    required: true,
    enum: ['user', 'employee', 'company', 'department', 'team'],
    description: 'Type of subscriber',
  })
  subscriberType: string;

  @Prop({
    type: String,
    required: true,
    enum: ['email', 'sms', 'push', 'in_app', 'whatsapp'],
    description: 'Notification channel type',
  })
  channel: string;

  @Prop({
    type: Boolean,
    required: true,
    default: true,
    description: 'Whether this subscription is active',
  })
  isActive: boolean;
}

export const ChannelSubscriptionSchema = SchemaFactory.createForClass(
  ChannelSubscriptionPersistenceModel,
);
export type ChannelSubscriptionDocument = ChannelSubscriptionPersistenceModel &
  Document;

// Add compound index for efficient querying by subscriber and type
ChannelSubscriptionSchema.index({ subscriberId: 1, subscriberType: 1 });

// Add index for finding active subscriptions
ChannelSubscriptionSchema.index({ isActive: 1 });

// Add compound index for finding subscriptions by subscriber, type, and channel
ChannelSubscriptionSchema.index(
  { subscriberId: 1, subscriberType: 1, channel: 1 },
  { unique: true },
);
