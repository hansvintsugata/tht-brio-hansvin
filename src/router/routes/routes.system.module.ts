import { Module } from '@nestjs/common';
import { NotificationInternalController } from '@modules/notification/presentation/controllers/notification.system.controller';
import { NotificationModule } from '@modules/notification/notification.module';

@Module({
  controllers: [NotificationInternalController],
  imports: [NotificationModule],
})
export class RoutesSysteModule {}
