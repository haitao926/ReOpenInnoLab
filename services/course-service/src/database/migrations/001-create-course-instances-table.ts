import { MigrationInterface, QueryRunner, Table, Index } from 'typeorm'

export class CreateCourseInstancesTable1234567890 implements MigrationInterface {
  name = 'CreateCourseInstancesTable1234567890'

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'course_instances',
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
            enum: ['draft', 'active', 'archived', 'completed'],
            default: '\'draft\''
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
            name: 'current_student_count',
            type: 'int',
            default: 0
          },
          {
            name: 'max_students',
            type: 'int',
            isNullable: true
          },
          {
            name: 'settings',
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
    await queryRunner.query(`
      CREATE INDEX "IDX_course_instances_tenant_course" ON "course_instances" ("tenant_id", "course_id")
    `)
    await queryRunner.query(`
      CREATE INDEX "IDX_course_instances_tenant_classroom" ON "course_instances" ("tenant_id", "classroom_id")
    `)
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropIndex('course_instances', 'IDX_course_instances_tenant_classroom')
    await queryRunner.dropIndex('course_instances', 'IDX_course_instances_tenant_course')
    await queryRunner.dropTable('course_instances')
  }
}