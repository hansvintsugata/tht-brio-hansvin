import { Inject, Injectable } from '@nestjs/common';
import { NotificationTemplateResponseDto } from '../dto/notification-template-response.dto';
import type { INotificationTemplateRepository } from '../../domain/repository/notification-template-repository.interface';
import { NotificationTemplateMapper } from '../../infrastructure/mappers/notification-template.mapper';

@Injectable()
export class GetNotificationTemplateUseCase {
  constructor(
    @Inject('INotificationTemplateRepository')
    private readonly notificationTemplateRepository: INotificationTemplateRepository,
  ) {}

  async execute(name: string): Promise<NotificationTemplateResponseDto | null> {
    const template = await this.notificationTemplateRepository.findByName(name);

    if (!template) {
      return null;
    }

    return NotificationTemplateMapper.toResponseDto(template);
  }
}
