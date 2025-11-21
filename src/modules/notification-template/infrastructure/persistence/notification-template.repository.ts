import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { NotificationTemplate } from '../../domain/entities/notification-template.entity';
import { INotificationTemplateRepository } from '../../domain/repository/notification-template-repository.interface';
import {
  NotificationTemplateDocument,
  NotificationTemplatePersistenceModel,
} from './notification-template-persistence.model';
import { NotificationTemplateMapper } from '../mappers/notification-template.mapper';

@Injectable()
export class NotificationTemplateRepository
  implements INotificationTemplateRepository
{
  constructor(
    @InjectModel(NotificationTemplatePersistenceModel.name)
    private notificationTemplateModel: Model<NotificationTemplateDocument>,
  ) {}

  /**
   * Find template by name
   */
  async findByName(name: string): Promise<NotificationTemplate | null> {
    const document = await this.notificationTemplateModel
      .findOne({ name })
      .exec();
    if (!document) {
      return null;
    }
    return NotificationTemplateMapper.toDomain(document);
  }
}
