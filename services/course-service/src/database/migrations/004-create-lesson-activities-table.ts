import { MigrationInterface, QueryRunner, Table, Index } from 'typeorm'

export class CreateLessonActivitiesTable1234567890 implements MigrationInterface {
  name = 'CreateLessonActivitiesTable1234567890'

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'lesson_activities',
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
            name: 'lesson_id',
            type: 'varchar',
            length: '255',
            isNullable: true
          },
          {
            name: 'section_id',
            type: 'varchar',
            length: '255',
            isNullable: true
          },
          {
            name: 'user_id',
            type: 'varchar',
            length: '255'
          },
          {
            name: 'user_role',
            type: 'enum',
            enum: ['teacher', 'student', 'assistant', 'observer'],
            default: '\'teacher\''
          },
          {
            name: 'action',
            type: 'enum',
            enum: [
              'lesson_created',
              'lesson_updated',
              'lesson_started',
              'lesson_paused',
              'lesson_resumed',
              'lesson_ended',
              'section_added',
              'section_updated',
              'section_removed',
              'section_changed',
              'annotation_saved',
              'participant_joined',
              'participant_left',
              'interaction_started',
              'assignment_submitted',
              'experiment_started',
              'feedback_provided',
              'resource_accessed',
              'system_alert'
            ]
          },
          {
            name: 'details',
            type: 'json',
            isNullable: true
          },
          {
            name: 'ip_address',
            type: 'varchar',
            length: '45',
            isNullable: true
          },
          {
            name: 'user_agent',
            type: 'text',
            isNullable: true
          },
          {
            name: 'device_info',
            type: 'json',
            isNullable: true
          },
          {
            name: 'location',
            type: 'json',
            isNullable: true
          },
          {
            name: 'session_id',
            type: 'varchar',
            length: '255',
            isNullable: true
          },
          {
            name: 'request_id',
            type: 'varchar',
            length: '255',
            isNullable: true
          },
          {
            name: 'success',
            type: 'boolean',
            default: true
          },
          {
            name: 'error_message',
            type: 'text',
            isNullable: true
          },
          {
            name: 'duration',
            type: 'int',
            isNullable: true
          },
          {
            name: 'created_at',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP'
          }
        ]
      }),
      true
    )

    // Create indexes
    await queryRunner.createIndex(
      'lesson_activities',
      {
        name: 'IDX_lesson_activities_tenant_lesson',
        columnNames: ['tenant_id', 'lesson_id']
      }
    )
    await queryRunner.createIndex(
      'lesson_activities',
      {
        name: 'IDX_lesson_activities_tenant_user',
        columnNames: ['tenant_id', 'user_id']
      }
    )
    await queryRunner.createIndex(
      'lesson_activities',
      {
        name: 'IDX_lesson_activities_tenant_action',
        columnNames: ['tenant_id', 'action']
      }
    )
    await queryRunner.createIndex(
      'lesson_activities',
      {
        name: 'IDX_lesson_activities_tenant_created',
        columnNames: ['tenant_id', 'created_at']
      }
    )
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropIndex('lesson_activities', 'IDX_lesson_activities_tenant_created')
    await queryRunner.dropIndex('lesson_activities', 'IDX_lesson_activities_tenant_action')
    await queryRunner.dropIndex('lesson_activities', 'IDX_lesson_activities_tenant_user')
    await queryRunner.dropIndex('lesson_activities', 'IDX_lesson_activities_tenant_lesson')
    await queryRunner.dropTable('lesson_activities')
  }
}