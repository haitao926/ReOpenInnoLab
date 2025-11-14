import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ClassroomController } from './classroom.controller';
import { ClassroomService } from './classroom.service';
import { Classroom } from '@/database/entities/classroom.entity';
import { ClassMember } from '@/database/entities/class-member.entity';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Classroom, ClassMember]),
    AuthModule,
  ],
  controllers: [ClassroomController],
  providers: [ClassroomService],
  exports: [ClassroomService],
})
export class ClassroomModule {}