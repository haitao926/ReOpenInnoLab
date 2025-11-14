import { MigrationInterface, QueryRunner, Table, Index } from 'typeorm'

export class CreateSectionsTable1234567890 implements MigrationInterface {
  name = 'CreateSectionsTable1234567890'

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'sections',
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
            name: 'type',
            type: 'enum',
            enum: ['introduction', 'knowledge', 'experience', 'experiment', 'assignment', 'summary']
          },
          {
            name: 'content',
            type: 'json'
          },
          {
            name: 'order',
            type: 'int'
          },
          {
            name: 'duration',
            type: 'int'
          },
          {
            name: 'required',
            type: 'boolean',
            default: true
          },
          {
            name: 'skippable',
            type: 'boolean',
            default: false
          },
          {
            name: 'status',
            type: 'enum',
            enum: ['pending', 'active', 'completed', 'skipped'],
            default: '\'pending\''
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
            name: 'actual_duration',
            type: 'int',
            isNullable: true
          },
          {
            name: 'settings',
            type: 'json',
            isNullable: true
          },
          {
            name: 'assessment_criteria',
            type: 'json',
            isNullable: true
          },
          {
            name: 'ai_hints',
            type: 'json',
            isNullable: true
          },
          {
            name: 'resource_refs',
            type: 'json',
            isNullable: true
          },
          {
            name: 'completion_conditions',
            type: 'json',
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
            name: 'notes',
            type: 'text',
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
      'sections',
      {
        name: 'IDX_sections_tenant_lesson',
        columnNames: ['tenant_id', 'lesson_id']
      }
    )
    await queryRunner.createIndex(
      'sections',
      {
        name: 'IDX_sections_tenant_lesson_order',
        columnNames: ['tenant_id', 'lesson_id', 'order']
      }
    )
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropIndex('sections', 'IDX_sections_tenant_lesson_order')
    await queryRunner.dropIndex('sections', 'IDX_sections_tenant_lesson')
    await queryRunner.dropTable('sections')
  }
}