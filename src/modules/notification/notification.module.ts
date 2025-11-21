import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { BullModule } from '@nestjs/bullmq';
import { NotificationUseCase } from './application/use-cases/notification.use-case';
import { NotificationRepository } from './infrastructure/persistence/notification.repository';
import {
  NotificationPersistenceModel,
  NotificationSchema,
} from './infrastructure/persistence/notification-persistence.model';
import { EmailProcessor } from './presentation/processor/email.processor';
import { UiProcessor } from './presentation/processor/ui.processor';
import { UserDataService } from './infrastructure/outbound/user-data.service';
import { ChannelSubscriptionModule } from '../channel-subscription/channel-subscription.module';
import { NotificationTemplateModule } from '../notification-template/notification-template.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: NotificationPersistenceModel.name, schema: NotificationSchema },
    ]),
    BullModule.registerQueue({
      name: 'email-notifications',
    }),
    BullModule.registerQueue({
      name: 'ui-notifications',
    }),

    ChannelSubscriptionModule,
    NotificationTemplateModule,
  ],
  controllers: [],
  providers: [
    NotificationUseCase,
    UserDataService,
    EmailProcessor,
    UiProcessor,
    { provide: 'INotificationRepository', useClass: NotificationRepository },
  ],
  exports: [NotificationUseCase],
})
export class NotificationModule {}
