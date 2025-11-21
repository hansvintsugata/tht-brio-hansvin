import { Module } from '@nestjs/common';
import { NotificationModule } from '@modules/notification/notification.module';
import { NotificationUserController } from '@modules/notification/presentation/controllers/notification.user.controller';

@Module({
  controllers: [NotificationUserController],
  imports: [NotificationModule],
})
export class RoutesUserModule {}
