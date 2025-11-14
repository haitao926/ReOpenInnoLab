import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
// import { RedisModule } from '@nestjs-modules/ioredis';
import { ClassroomModule } from './modules/classroom/classroom.module';
import { ClassSessionModule } from './modules/class-session/class-session.module';
import { AttendanceModule } from './modules/attendance/attendance.module';
import { WebSocketModule } from './modules/websocket/websocket.module';
import { HealthModule } from './modules/health/health.module';
import configuration from './config/configuration';

@Module({
  imports: [
    // 配置模块
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
      envFilePath: ['.env.development', '.env'],
    }),

    // 数据库模块
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        host: configService.get<string>('DB_HOST'),
        port: configService.get<number>('DB_PORT'),
        username: configService.get<string>('DB_USERNAME'),
        password: configService.get<string>('DB_PASSWORD'),
        database: configService.get<string>('DB_DATABASE'),
        entities: [__dirname + '/**/entities/*.entity{.ts,.js}'],
        migrations: [__dirname + '/**/migrations/*.ts'],
        synchronize: configService.get<string>('NODE_ENV') === 'development',
        logging: configService.get<string>('NODE_ENV') === 'development',
        retryAttempts: 3,
        retryDelay: 3000,
      }),
      inject: [ConfigService],
    }),

    // Redis模块 (暂时简化，后续添加)
    // RedisModule.forRootAsync({
    //   imports: [ConfigModule],
    //   useFactory: (configService: ConfigService) => ({
    //     config: {
    //       host: configService.get<string>('REDIS_HOST'),
    //       port: configService.get<number>('REDIS_PORT'),
    //       password: configService.get<string>('REDIS_PASSWORD') || undefined,
    //       retryDelayOnFailover: 100,
    //       maxRetriesPerRequest: 3,
    //     },
    //   }),
    //   inject: [ConfigService],
    // }),

    // 业务模块
    ClassroomModule,
    ClassSessionModule,
    AttendanceModule,
    WebSocketModule,
    HealthModule,
  ],
})
export class AppModule {}