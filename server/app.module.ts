import { APP_FILTER } from '@nestjs/core';
import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { PlatformModule } from '@lark-apaas/fullstack-nestjs-core';

import { GlobalExceptionFilter } from './common/filters/exception.filter';
import { UserContextMiddleware } from './common/middleware/user-context.middleware';
import { UsersModule } from './modules/users/users.module';
import { CheckinModule } from './modules/checkin/checkin.module';
import { ChatModule } from './modules/chat/chat.module';
import { ViewModule } from './modules/view/view.module';

@Module({
  imports: [
    PlatformModule.forRoot(),
    UsersModule,
    CheckinModule,
    ChatModule,
    ViewModule,
  ],
  providers: [
    {
      provide: APP_FILTER,
      useClass: GlobalExceptionFilter,
    },
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer): void {
    consumer.apply(UserContextMiddleware).forRoutes('*');
  }
}
