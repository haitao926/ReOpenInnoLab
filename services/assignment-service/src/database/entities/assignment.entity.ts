import {
  Entity,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  PrimaryGeneratedColumn,
  ManyToOne,
  OneToMany,
  Index,
} from 'typeorm'
import { ApiProperty } from '@nestjs/swagger'

// Import needs to be at the end to avoid circular dependency
let AssignmentSubmission: any
try {
  AssignmentSubmission = require('./submission.entity').AssignmentSubmission
} catch (e) {
  // Handle circular dependency
}

@Entity('assignments')
@Index(['lessonId', 'sectionId'])
export class Assignment {
  @ApiProperty({ description: '作业ID' })
  @PrimaryGeneratedColumn('uuid')
  id: string

  @ApiProperty({ description: '课程实例ID' })
  @Column({ type: 'varchar', length: 255 })
  lessonId: string

  @ApiProperty({ description: '环节ID' })
  @Column({ type: 'varchar', length: 255 })
  sectionId: string

  @ApiProperty({ description: '作业标题' })
  @Column({ type: 'varchar', length: 255 })
  title: string

  @ApiProperty({ description: '作业描述' })
  @Column({ type: 'text' })
  description: string

  @ApiProperty({ description: '作业类型' })
  @Column({
    type: 'enum',
    enum: ['quiz', 'homework', 'exam', 'practice'],
    default: 'homework',
  })
  type: string

  @ApiProperty({ description: '作业状态' })
  @Column({
    type: 'enum',
    enum: ['draft', 'published', 'closed', 'archived'],
    default: 'draft',
  })
  status: string

  @ApiProperty({ description: '总分' })
  @Column({ type: 'decimal', precision: 5, scale: 2 })
  totalPoints: number

  @ApiProperty({ description: '及格分数' })
  @Column({ type: 'decimal', precision: 5, scale: 2 })
  passingScore: number

  @ApiProperty({ description: '时间限制（分钟）' })
  @Column({ type: 'int', nullable: true })
  timeLimit?: number

  @ApiProperty({ description: '允许尝试次数' })
  @Column({ type: 'int', default: 1 })
  maxAttempts: number

  @ApiProperty({ description: '是否显示正确答案' })
  @Column({ type: 'boolean', default: false })
  showCorrectAnswers: boolean

  @ApiProperty({ description: '是否随机排序题目' })
  @Column({ type: 'boolean', default: false })
  randomizeQuestions: boolean

  @ApiProperty({ description: '作业设置', required: false })
  @Column({ type: 'json', nullable: true })
  settings?: {
    allowLateSubmission: boolean
    latePenalty: number
    showFeedback: boolean
    autoGrade: boolean
    aiAssistance: boolean
  }

  @ApiProperty({ description: '开始时间', required: false })
  @Column({ type: 'timestamp', nullable: true })
  startsAt?: Date

  @ApiProperty({ description: '截止时间', required: false })
  @Column({ type: 'timestamp', nullable: true })
  dueAt?: Date

  @ApiProperty({ description: '创建者用户ID' })
  @Column({ type: 'varchar', length: 255 })
  createdBy: string

  @ApiProperty({ description: '创建时间' })
  @CreateDateColumn({ type: 'timestamp' })
  createdAt: Date

  @ApiProperty({ description: '更新时间' })
  @UpdateDateColumn({ type: 'timestamp' })
  updatedAt: Date

  // 关联关系
  @OneToMany(() => AssignmentQuestion, question => question.assignment)
  questions: AssignmentQuestion[]

  @OneToMany(() => AssignmentSubmission, submission => submission.assignment)
  submissions: AssignmentSubmission[]
}

@Entity('assignment_questions')
export class AssignmentQuestion {
  @ApiProperty({ description: '题目ID' })
  @PrimaryGeneratedColumn('uuid')
  id: string

  @ApiProperty({ description: '作业ID' })
  @Column({ type: 'varchar', length: 255 })
  assignmentId: string

  @ApiProperty({ description: '题目类型' })
  @Column({
    type: 'enum',
    enum: ['choice', 'multiple', 'fill', 'judge', 'essay', 'coding'],
  })
  type: string

  @ApiProperty({ description: '题目标题' })
  @Column({ type: 'varchar', length: 255 })
  title: string

  @ApiProperty({ description: '题目内容' })
  @Column({ type: 'text' })
  content: string

  @ApiProperty({ description: '题目分值' })
  @Column({ type: 'decimal', precision: 5, scale: 2 })
  points: number

  @ApiProperty({ description: '题目顺序' })
  @Column({ type: 'int' })
  order: number

  @ApiProperty({ description: '是否必答' })
  @Column({ type: 'boolean', default: true })
  required: boolean

  @ApiProperty({ description: '题目选项（选择题使用）', required: false })
  @Column({ type: 'json', nullable: true })
  options?: Array<{
    id: string
    label: string
    text: string
    isCorrect: boolean
  }>

  @ApiProperty({ description: '正确答案', required: false })
  @Column({ type: 'json', nullable: true })
  correctAnswer?: string | string[]

  @ApiProperty({ description: '参考答案', required: false })
  @Column({ type: 'text', nullable: true })
  referenceAnswer?: string

  @ApiProperty({ description: '评分标准', required: false })
  @Column({ type: 'json', nullable: true })
  gradingCriteria?: {
    keywords: string[]
    minWords?: number
    maxWords?: number
    requiredPoints: string[]
  }

  @ApiProperty({ description: '题目解析', required: false })
  @Column({ type: 'text', nullable: true })
  explanation?: string

  @ApiProperty({ description: '题目提示', required: false })
  @Column({ type: 'text', nullable: true })
  hint?: string

  @ApiProperty({ description: '创建时间' })
  @CreateDateColumn({ type: 'timestamp' })
  createdAt: Date

  @ApiProperty({ description: '更新时间' })
  @UpdateDateColumn({ type: 'timestamp' })
  updatedAt: Date

  // 关联关系
  @ManyToOne(() => Assignment, assignment => assignment.questions)
  assignment: Assignment

  @OneToMany(() => AssignmentAnswer, answer => answer.question)
  answers: AssignmentAnswer[]
}

@Entity('assignment_submissions')
export class AssignmentSubmission {
  @ApiProperty({ description: '提交ID' })
  @PrimaryGeneratedColumn('uuid')
  id: string

  @ApiProperty({ description: '作业ID' })
  @Column({ type: 'varchar', length: 255 })
  assignmentId: string

  @ApiProperty({ description: '学生ID' })
  @Column({ type: 'varchar', length: 255 })
  studentId: string

  @ApiProperty({ description: '提交状态' })
  @Column({
    type: 'enum',
    enum: ['draft', 'submitted', 'graded', 'returned'],
    default: 'draft',
  })
  status: string

  @ApiProperty({ description: '得分', required: false })
  @Column({ type: 'decimal', precision: 5, scale: 2, nullable: true })
  score?: number

  @ApiProperty({ description: '最大得分', required: false })
  @Column({ type: 'decimal', precision: 5, scale: 2, nullable: true })
  maxScore?: number

  @ApiProperty({ description: '用时（秒）' })
  @Column({ type: 'int', nullable: true })
  timeSpent?: number

  @ApiProperty({ description: '尝试次数' })
  @Column({ type: 'int', default: 1 })
  attemptCount: number

  @ApiProperty({ description: '提交时间' })
  @Column({ type: 'timestamp', nullable: true })
  submittedAt?: Date

  @ApiProperty({ description: '评分时间', required: false })
  @Column({ type: 'timestamp', nullable: true })
  gradedAt?: Date

  @ApiProperty({ description: '评分者ID', required: false })
  @Column({ type: 'varchar', length: 255, nullable: true })
  gradedBy?: string

  @ApiProperty({ description: '教师反馈', required: false })
  @Column({ type: 'text', nullable: true })
  feedback?: string

  @ApiProperty({ description: '是否迟交' })
  @Column({ type: 'boolean', default: false })
  isLate: boolean

  @ApiProperty({ description: '迟交扣分', required: false })
  @Column({ type: 'decimal', precision: 5, scale: 2, nullable: true })
  latePenalty?: number

  @ApiProperty({ description: '提交IP地址', required: false })
  @Column({ type: 'varchar', length: 45, nullable: true })
  ipAddress?: string

  @ApiProperty({ description: '用户代理', required: false })
  @Column({ type: 'text', nullable: true })
  userAgent?: string

  @ApiProperty({ description: '创建时间' })
  @CreateDateColumn({ type: 'timestamp' })
  createdAt: Date

  @ApiProperty({ description: '更新时间' })
  @UpdateDateColumn({ type: 'timestamp' })
  updatedAt: Date

  // 关联关系
  @ManyToOne(() => Assignment, assignment => assignment.submissions)
  assignment: Assignment

  @OneToMany(() => AssignmentAnswer, answer => answer.submission)
  answers: AssignmentAnswer[]
}

@Entity('assignment_answers')
export class AssignmentAnswer {
  @ApiProperty({ description: '答案ID' })
  @PrimaryGeneratedColumn('uuid')
  id: string

  @ApiProperty({ description: '提交ID' })
  @Column({ type: 'varchar', length: 255 })
  submissionId: string

  @ApiProperty({ description: '题目ID' })
  @Column({ type: 'varchar', length: 255 })
  questionId: string

  @ApiProperty({ description: '学生答案' })
  @Column({ type: 'json' })
  answer: string | string[] | any

  @ApiProperty({ description: '是否正确', required: false })
  @Column({ type: 'boolean', nullable: true })
  isCorrect?: boolean

  @ApiProperty({ description: '得分', required: false })
  @Column({ type: 'decimal', precision: 5, scale: 2, nullable: true })
  points?: number

  @ApiProperty({ description: '教师评分', required: false })
  @Column({ type: 'decimal', precision: 5, scale: 2, nullable: true })
  teacherScore?: number

  @ApiProperty({ description: '教师评语', required: false })
  @Column({ type: 'text', nullable: true })
  teacherComment?: string

  @ApiProperty({ description: '回答用时（秒）', required: false })
  @Column({ type: 'int', nullable: true })
  timeSpent?: number

  @ApiProperty({ description: '回答时间' })
  @Column({ type: 'timestamp' })
  answeredAt: Date

  @ApiProperty({ description: '最后修改时间' })
  @Column({ type: 'timestamp', nullable: true })
  lastModifiedAt?: Date

  @ApiProperty({ description: '创建时间' })
  @CreateDateColumn({ type: 'timestamp' })
  createdAt: Date

  @ApiProperty({ description: '更新时间' })
  @UpdateDateColumn({ type: 'timestamp' })
  updatedAt: Date

  // 关联关系
  @ManyToOne(() => AssignmentSubmission, submission => submission.answers)
  submission: AssignmentSubmission

  @ManyToOne(() => AssignmentQuestion, question => question.answers)
  question: AssignmentQuestion
}