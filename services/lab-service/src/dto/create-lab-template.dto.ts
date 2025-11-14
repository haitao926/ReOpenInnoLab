import {
  IsString,
  IsOptional,
  IsEnum,
  IsArray,
  IsObject,
  IsUrl,
  IsUUID,
  MaxLength,
  MinLength,
  ValidateNested,
  IsNotEmpty
} from 'class-validator'
import { Type } from 'class-transformer'
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'

export enum LabType {
  JUPYTER = 'jupyter',
  PYTHON = 'python',
  R = 'r',
  MARKDOWN = 'markdown'
}

export enum DifficultyLevel {
  BEGINNER = 'beginner',
  INTERMEDIATE = 'intermediate',
  ADVANCED = 'advanced',
  EXPERT = 'expert'
}

export class PackageManifestDto {
  @ApiProperty({
    description: 'Required pip packages',
    type: [String],
    default: []
  })
  @IsArray()
  @IsString({ each: true })
  pip: string[] = []

  @ApiProperty({
    description: 'Optional pip packages',
    type: [String],
    default: []
  })
  @IsArray()
  @IsString({ each: true })
  pip_optional: string[] = []

  @ApiProperty({
    description: 'Required npm packages',
    type: [String],
    default: []
  })
  @IsArray()
  @IsString({ each: true })
  npm: string[] = []

  @ApiProperty({
    description: 'Required conda packages',
    type: [String],
    default: []
  })
  @IsArray()
  @IsString({ each: true })
  conda: string[] = []

  @ApiProperty({
    description: 'System dependencies',
    type: [String],
    default: []
  })
  @IsArray()
  @IsString({ each: true })
  system: string[] = []
}

export class LabMetadataDto {
  @ApiPropertyOptional({ description: 'Grade level' })
  @IsOptional()
  @IsString()
  gradeLevel?: string

  @ApiPropertyOptional({ description: 'Subject area' })
  @IsOptional()
  @IsString()
  subject?: string

  @ApiPropertyOptional({ description: 'Topics covered' })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  topics?: string[]

  @ApiPropertyOptional({ description: 'Estimated duration in minutes' })
  @IsOptional()
  @IsString()
  estimatedDuration?: string

  @ApiPropertyOptional({ description: 'Learning objectives' })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  learningObjectives?: string[]

  @ApiPropertyOptional({ description: 'Prerequisites' })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  prerequisites?: string[]
}

export class CreateLabTemplateDto {
  @ApiProperty({ description: 'Title of the lab experiment' })
  @IsString()
  @MinLength(3)
  @MaxLength(255)
  title: string

  @ApiProperty({ description: 'Description of the lab experiment' })
  @IsString()
  @MinLength(10)
  description: string

  @ApiProperty({
    description: 'Type of lab',
    enum: LabType,
    default: LabType.JUPYTER
  })
  @IsEnum(LabType)
  labType: LabType = LabType.JUPYTER

  @ApiProperty({
    description: 'Difficulty level',
    enum: DifficultyLevel
  })
  @IsEnum(DifficultyLevel)
  difficultyLevel: DifficultyLevel

  @ApiPropertyOptional({ description: 'Tags for categorization' })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[]

  @ApiPropertyOptional({
    description: 'Package requirements',
    type: PackageManifestDto
  })
  @IsOptional()
  @IsObject()
  @ValidateNested()
  @Type(() => PackageManifestDto)
  packageManifest?: PackageManifestDto

  @ApiPropertyOptional({
    description: 'Lab metadata',
    type: LabMetadataDto
  })
  @IsOptional()
  @IsObject()
  @ValidateNested()
  @Type(() => LabMetadataDto)
  metadata?: LabMetadataDto

  @ApiPropertyOptional({ description: 'Course activity ID to bind with' })
  @IsOptional()
  @IsUUID()
  courseActivityId?: string

  @ApiPropertyOptional({ description: 'Grade band' })
  @IsOptional()
  @IsString()
  gradeBand?: string

  @ApiPropertyOptional({ description: 'Whether to auto-render preview' })
  @IsOptional()
  autoRenderPreview: boolean = true
}