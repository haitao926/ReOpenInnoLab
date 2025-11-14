import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { AssignmentController } from './assignment.controller'
import { AssignmentService } from './assignment.service'
import { Assignment, AssignmentQuestion, AssignmentAnswer } from '../database/entities/assignment.entity'
import { AssignmentSubmission } from '../database/entities/submission.entity'

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Assignment,
      AssignmentQuestion,
      AssignmentSubmission,
      AssignmentAnswer,
    ]),
  ],
  controllers: [AssignmentController],
  providers: [AssignmentService],
  exports: [AssignmentService],
})
export class AssignmentModule {}