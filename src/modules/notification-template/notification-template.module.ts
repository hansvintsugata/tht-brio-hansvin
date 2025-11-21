import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { GetNotificationTemplateUseCase } from './application/use-cases/get-notification-template.use-case';
import { NotificationTemplateRepository } from './infrastructure/persistence/notification-template.repository';
import {
  NotificationTemplatePersistenceModel,
  NotificationTemplateSchema,
} from './infrastructure/persistence/notification-template-persistence.model';

@Module({
  imports: [
    MongooseModule.forFeature([
      {
        name: NotificationTemplatePersistenceModel.name,
        schema: NotificationTemplateSchema,
      },
    ]),
  ],
  controllers: [],
  providers: [
    // Use Cases
    GetNotificationTemplateUseCase,

    // Repository
    {
      provide: 'INotificationTemplateRepository',
      useClass: NotificationTemplateRepository,
    },
  ],
  exports: [
    // Export use cases for other modules to use
    GetNotificationTemplateUseCase,
  ],
})
export class NotificationTemplateModule {}
