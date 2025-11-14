import { Module } from '@nestjs/common'
import { SubjectsController } from './subjects.controller'

@Module({
  controllers: [SubjectsController],
  providers: [],
  exports: [],
})
export class SubjectsModule {}