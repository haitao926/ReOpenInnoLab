import { IsString, IsNotEmpty, IsOptional, IsArray, IsEnum } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export enum ClassroomStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  ARCHIVED = 'archived',
}

export class CreateClassroomDto {
  @ApiProperty({ description: '班级名称' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ description: '班级描述' })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({ description: '班级代码' })
  @IsString()
  @IsNotEmpty()
  code: string;

  @ApiProperty({ description: '教师ID' })
  @IsString()
  @IsNotEmpty()
  teacherId: string;

  @ApiProperty({ description: '课程ID' })
  @IsString()
  @IsNotEmpty()
  courseId: string;

  @ApiPropertyOptional({ description: '最大学生数', default: 50 })
  @IsOptional()
  maxStudents?: number;

  @ApiPropertyOptional({ description: '班级状态', enum: ClassroomStatus, default: ClassroomStatus.ACTIVE })
  @IsOptional()
  @IsEnum(ClassroomStatus)
  status?: ClassroomStatus;

  @ApiPropertyOptional({ description: '标签' })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  tags?: string[];
}