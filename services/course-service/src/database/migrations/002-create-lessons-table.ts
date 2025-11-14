import { MigrationInterface, QueryRunner, Table, Index } from 'typeorm'

export class CreateLessonsTable1234567890 implements MigrationInterface {
  name = 'CreateLessonsTable1234567890'

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'lessons',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'uuid_generate_v4()'
          },
          {
            name: 'tenant_id',
            type: 'varchar',
            length: '255'
          },
          {
            name: 'course_id',
            type: 'varchar',
            length: '255'
          },
          {
            name: 'course_instance_id',
            type: 'varchar',
            length: '255'
          },
          {
            name: 'classroom_id',
            type: 'varchar',
            length: '255'
          },
          {
            name: 'title',
            type: 'varchar',
            length: '255'
          },
          {
            name: 'description',
            type: 'text',
            isNullable: true
          },
          {
            name: 'status',
            type: 'enum',
            enum: ['draft', 'scheduled', 'in_progress', 'paused', 'completed', 'cancelled'],
            default: '\'draft\''
          },
          {
            name: 'type',
            type: 'enum',
            enum: ['regular', 'review', 'exam', 'lab', 'presentation'],
            isNullable: true
          },
          {
            name: 'scheduled_start_at',
            type: 'timestamp',
            isNullable: true
          },
          {
            name: 'scheduled_end_at',
            type: 'timestamp',
            isNullable: true
          },
          {
            name: 'actual_start_at',
            type: 'timestamp',
            isNullable: true
          },
          {
            name: 'actual_end_at',
            type: 'timestamp',
            isNullable: true
          },
          {
            name: 'estimated_duration',
            type: 'int',
            isNullable: true
          },
          {
            name: 'current_section_id',
            type: 'varchar',
            length: '255',
            isNullable: true
          },
          {
            name: 'current_section_order',
            type: 'int',
            isNullable: true
          },
          {
            name: 'participant_count',
            type: 'int',
            default: 0
          },
          {
            name: 'max_participants',
            type: 'int',
            isNullable: true
          },
          {
            name: 'auto_record',
            type: 'boolean',
            default: false
          },
          {
            name: 'settings',
            type: 'json',
            isNullable: true
          },
          {
            name: 'start_notes',
            type: 'text',
            isNullable: true
          },
          {
            name: 'end_reason',
            type: 'varchar',
            length: '255',
            isNullable: true
          },
          {
            name: 'end_notes',
            type: 'text',
            isNullable: true
          },
          {
            name: 'created_by',
            type: 'varchar',
            length: '255'
          },
          {
            name: 'updated_by',
            type: 'varchar',
            length: '255',
            isNullable: true
          },
          {
            name: 'created_at',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP'
          },
          {
            name: 'updated_at',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
            onUpdate: 'CURRENT_TIMESTAMP'
          }
        ]
      }),
      true
    )

    // Create indexes
    await queryRunner.createIndex(
      'lessons',
      {
        name: 'IDX_lessons_tenant_course',
        columnNames: ['tenant_id', 'course_id']
      }
    )
    await queryRunner.createIndex(
      'lessons',
      {
        name: 'IDX_lessons_tenant_classroom',
        columnNames: ['tenant_id', 'classroom_id']
      }
    )
    await queryRunner.createIndex(
      'lessons',
      {
        name: 'IDX_lessons_tenant_status',
        columnNames: ['tenant_id', 'status']
      }
    )
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropIndex('lessons', 'IDX_lessons_tenant_status')
    await queryRunner.dropIndex('lessons', 'IDX_lessons_tenant_classroom')
    await queryRunner.dropIndex('lessons', 'IDX_lessons_tenant_course')
    await queryRunner.dropTable('lessons')
  }
}