import { ChannelConfig } from '../../domain/entities/notification-template.entity';

export class NotificationTemplateResponseDto {
  id: string;
  name: string;
  description: string;
  channelDetails: ChannelConfig;
  isActive: boolean;
  createdBy: string;
  updatedBy?: string;
  createdAt: Date;
  updatedAt: Date;
}
