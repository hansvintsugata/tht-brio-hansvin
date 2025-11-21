import { Module } from '@nestjs/common';
import { RouterModule as NestJsRouterModule } from '@nestjs/core';
import { RoutesSysteModule } from '@routes/routes.system.module';
import { RoutesUserModule } from '@routes/routes.user.module';

@Module({
  imports: [
    RoutesSysteModule,
    RoutesUserModule,
    NestJsRouterModule.register([
      {
        path: '/system',
        module: RoutesSysteModule,
      },
      {
        path: '/user',
        module: RoutesUserModule,
      },
    ]),
  ],
})
export class RouterModule {}
