import { PartialType } from '@nestjs/swagger';
import { CreateClassroomDto, ClassroomStatus } from './create-classroom.dto';

export class UpdateClassroomDto extends PartialType(CreateClassroomDto) {
  // 继承所有CreateClassroomDto的字段，但都是可选的
}