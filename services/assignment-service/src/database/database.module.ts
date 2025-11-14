import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { ConfigModule, ConfigService } from '@nestjs/config'
import { Assignment, AssignmentQuestion, AssignmentAnswer } from './entities/assignment.entity'
import { AssignmentSubmission } from './entities/submission.entity'

@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        host: configService.get('DB_HOST') || 'localhost',
        port: configService.get('DB_PORT') || 5432,
        username: configService.get('DB_USERNAME') || 'postgres',
        password: configService.get('DB_PASSWORD') || 'postgres',
        database: configService.get('DB_DATABASE') || 'reopeninnolab',
        entities: [Assignment, AssignmentQuestion, AssignmentAnswer, AssignmentSubmission],
        synchronize: configService.get('NODE_ENV') !== 'production',
        logging: configService.get('NODE_ENV') === 'development',
      }),
    }),
    TypeOrmModule.forFeature([
      Assignment,
      AssignmentQuestion,
      AssignmentAnswer,
      AssignmentSubmission,
    ]),
  ],
  exports: [
    TypeOrmModule,
  ],
})
export class DatabaseModule {}