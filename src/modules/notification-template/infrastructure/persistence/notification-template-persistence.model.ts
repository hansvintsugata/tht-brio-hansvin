import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

/**
 * MongoDB schema for NotificationTemplate
 * This contains the persistence-specific implementation
 */
@Schema({
  timestamps: true,
  collection: 'notification_templates',
})
export class NotificationTemplatePersistenceModel {
  @Prop({
    type: String,
    required: true,
    unique: true,
    trim: true,
    description: 'Template name (e.g., "happy-birthday", "payslip-ready")',
  })
  name: string;

  @Prop({
    type: String,
    required: true,
    description: 'Human readable description of the template',
  })
  description: string;

  @Prop({
    type: Object,
    required: true,
    description:
      'Channel configuration object with active status and message details',
  })
  channelDetails: Record<string, any>;

  @Prop({
    type: Boolean,
    required: true,
    default: true,
    description: 'Whether this template is active and can be used',
  })
  isActive: boolean;

  @Prop({
    type: Types.ObjectId,
    ref: 'User',
    required: true,
    description: 'User who created this template',
  })
  createdBy: Types.ObjectId;

  @Prop({
    type: Types.ObjectId,
    ref: 'User',
    description: 'User who last updated this template',
  })
  updatedBy?: Types.ObjectId;
}

export const NotificationTemplateSchema = SchemaFactory.createForClass(
  NotificationTemplatePersistenceModel,
);
export type NotificationTemplateDocument =
  NotificationTemplatePersistenceModel & Document;

// Add indexes for better query performance
NotificationTemplateSchema.index({ name: 1 });
NotificationTemplateSchema.index({ isActive: 1 });
NotificationTemplateSchema.index({ 'channelDetails.active': 1 });
