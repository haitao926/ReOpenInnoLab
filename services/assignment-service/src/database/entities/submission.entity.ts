import {
  Entity,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  PrimaryGeneratedColumn,
  ManyToOne,
  OneToMany,
  Index,
  JoinColumn,
} from 'typeorm'
import { ApiProperty } from '@nestjs/swagger'
import { Assignment } from './assignment.entity'

@Entity('assignment_submissions')
@Index(['assignmentId', 'studentId'])
@Index(['studentId', 'status'])
export class AssignmentSubmission {
  @ApiProperty({ description: 'Ð¤ID' })
  @PrimaryGeneratedColumn('uuid')
  id: string

  @ApiProperty({ description: '\ID' })
  @Column({ type: 'varchar', length: 255 })
  assignmentId: string

  @ApiProperty({ description: 'fID' })
  @Column({ type: 'varchar', length: 255 })
  studentId: string

  @ApiProperty({ description: 'fÓ' })
  @Column({ type: 'varchar', length: 255 })
  studentName: string

  @ApiProperty({ description: 'Ð¤¶' })
  @Column({
    type: 'enum',
    enum: ['draft', 'submitted', 'graded', 'returned'],
    default: 'draft',
  })
  status: string

  @ApiProperty({ description: 'Õ!p' })
  @Column({ type: 'int', default: 1 })
  attemptNumber: number

  @ApiProperty({ description: 'TH…¹' })
  @Column({ type: 'json' })
  answers: Array<{
    questionId: string
    answer: any
    timeSpent?: number
    isCorrect?: boolean
  }>

  @ApiProperty({ description: 'Dö‡ö' })
  @Column({ type: 'json', nullable: true })
  attachments?: Array<{
    id: string
    name: string
    type: string
    url: string
    size: number
  }>

  @ApiProperty({ description: '(öÒ	' })
  @Column({ type: 'int', nullable: true })
  timeSpent?: number

  @ApiProperty({ description: '—' })
  @Column({ type: 'decimal', precision: 5, scale: 2, nullable: true })
  score?: number

  @ApiProperty({ description: '~Ôp' })
  @Column({ type: 'decimal', precision: 5, scale: 2, nullable: true })
  percentage?: number

  @ApiProperty({ description: '/&Ç' })
  @Column({ type: 'boolean', nullable: true })
  passed?: boolean

  @ApiProperty({ description: 'YÄí' })
  @Column({ type: 'text', nullable: true })
  feedback?: string

  @ApiProperty({ description: 'YID' })
  @Column({ type: 'varchar', length: 255, nullable: true })
  gradedBy?: string

  @ApiProperty({ description: 'Äöô' })
  @Column({ type: 'timestamp', nullable: true })
  gradedAt?: Date

  @ApiProperty({ description: 'ê¨ÄÓœ' })
  @Column({ type: 'json', nullable: true })
  autoGradingResult?: {
    totalScore: number
    maxScore: number
    questionResults: Array<{
      questionId: string
      score: number
      maxScore: number
      isCorrect: boolean
      feedback?: string
    }>
  }

  @ApiProperty({ description: 'AI…©Äú®' })
  @Column({ type: 'json', nullable: true })
  aiSuggestions?: Array<{
    type: 'grammar' | 'content' | 'structure' | 'plagiarism'
    severity: 'low' | 'medium' | 'high'
    message: string
    suggestion: string
    position?: {
      start: number
      end: number
    }
  }>

  @ApiProperty({ description: 'Ð¤öô' })
  @Column({ type: 'timestamp', nullable: true })
  submittedAt?: Date

  @ApiProperty({ description: 'úöô' })
  @CreateDateColumn({ type: 'timestamp' })
  createdAt: Date

  @ApiProperty({ description: 'ô°öô' })
  @UpdateDateColumn({ type: 'timestamp' })
  updatedAt: Date

  // sTsû
  @ManyToOne(() => Assignment, assignment => assignment.submissions)
  @JoinColumn({ name: 'assignmentId' })
  assignment: Assignment
}