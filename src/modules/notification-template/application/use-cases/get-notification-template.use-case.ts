import { Inject, Injectable } from '@nestjs/common';
import type { INotificationTemplateRepository } from '../../domain/repository/notification-template-repository.interface';
import { NotificationTemplate } from '../../domain/entities/notification-template.entity';

@Injectable()
export class GetNotificationTemplateUseCase {
  constructor(
    @Inject('INotificationTemplateRepository')
    private readonly notificationTemplateRepository: INotificationTemplateRepository,
  ) {}

  async execute(name: string): Promise<NotificationTemplate | null> {
    const template = await this.notificationTemplateRepository.findByName(name);

    if (!template) {
      return null;
    }

    return template;
  }
}
