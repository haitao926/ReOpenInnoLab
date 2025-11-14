import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ClassroomGateway } from './classroom.gateway';
import { ClassSession } from '@/database/entities/class-session.entity';
import { ClassMember } from '@/database/entities/class-member.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([ClassSession, ClassMember]),
  ],
  providers: [ClassroomGateway],
  exports: [ClassroomGateway],
})
export class WebSocketModule {}