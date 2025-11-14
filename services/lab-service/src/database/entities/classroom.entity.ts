import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToMany } from 'typeorm'
import { LabDeviceAgent } from './lab-device-agent.entity'

@Entity('classrooms')
export class Classroom {
  @PrimaryGeneratedColumn('uuid')
  id: string

  @Column({ name: 'tenant_id', type: 'uuid' })
  tenantId: string

  @Column({ name: 'classroom_name', type: 'varchar', length: 255 })
  classroomName: string

  @Column({ name: 'course_id', type: 'uuid', nullable: true })
  courseId: string

  @Column({ name: 'teacher_id', type: 'uuid' })
  teacherId: string

  @Column({ name: 'metadata', type: 'jsonb', default: {} })
  metadata: Record<string, any>

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date

  // Relationships
  @OneToMany(() => LabDeviceAgent, agent => agent.classroom)
  labDeviceAgents: LabDeviceAgent[]
}