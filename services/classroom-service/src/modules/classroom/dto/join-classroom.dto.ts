import { IsString, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class JoinClassroomDto {
  @ApiProperty({ description: '班级代码' })
  @IsString()
  @IsNotEmpty()
  code: string;

  @ApiProperty({ description: '学生ID' })
  @IsString()
  @IsNotEmpty()
  studentId: string;
}