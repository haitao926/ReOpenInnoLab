import { Module } from '@nestjs/common'
import { ConfigModule } from '@nestjs/config'
import { HttpModule } from '@nestjs/axios'
import { ThrottlerModule } from '@nestjs/throttler'
import { ScheduleModule } from '@nestjs/schedule'

import { ReasoningController } from './controllers/reasoning.controller'
import { AIController } from './controllers/ai.controller'
import { AIGatewayService } from './services/ai-gateway.service'
import { DeepSeekReasoningService } from './services/deepseek-reasoning.service'
import { HealthController } from './controllers/health.controller'
import { configuration } from './config/configuration'

@Module({
  imports: [
    // 配置模块
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
      envFilePath: ['.env', '.env.development', '.env.production']
    }),

    // HTTP模块
    HttpModule.register({
      timeout: 60000,
      maxRedirects: 5
    }),

    // 限流模块
    ThrottlerModule.forRoot({
      throttlers: [
        {
          ttl: 60000, // 1分钟
          limit: 100, // 最多100个请求
        },
      ],
    }),

    // 定时任务模块
    ScheduleModule.forRoot()
  ],
  controllers: [
    ReasoningController,
    AIController,
    HealthController
  ],
  providers: [
    AIGatewayService,
    DeepSeekReasoningService
  ],
  exports: [
    AIGatewayService,
    DeepSeekReasoningService
  ]
})
export class AppModule {}