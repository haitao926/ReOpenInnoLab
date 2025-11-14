import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { ConfigModule, ConfigService } from '@nestjs/config'
import { AssignmentModule } from './modules/assignment/assignment.module'
import { DatabaseModule } from './database/database.module'
import configuration from './config/configuration'

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
    }),
    DatabaseModule,
    AssignmentModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}