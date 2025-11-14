import { MigrationInterface, QueryRunner, Table, Index } from 'typeorm'

export class CreateLabAgentTables1698880000001 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create lab_device_policies table
    await queryRunner.createTable(
      new Table({
        name: 'lab_device_policies',
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
            type: 'uuid',
            isNullable: false
          },
          {
            name: 'policy_name',
            type: 'varchar',
            length: '255',
            isNullable: false
          },
          {
            name: 'policy_description',
            type: 'text',
            isNullable: true
          },
          {
            name: 'grade_band',
            type: 'enum',
            enum: ['primary', 'middle', 'high', 'university'],
            isNullable: false
          },
          {
            name: 'quota_cpu',
            type: 'decimal',
            precision: 5,
            scale: 2,
            default: 2.0
          },
          {
            name: 'quota_memory',
            type: 'decimal',
            precision: 10,
            scale: 2,
            default: 4096.0
          },
          {
            name: 'quota_disk',
            type: 'decimal',
            precision: 10,
            scale: 2,
            default: 10240.0
          },
          {
            name: 'quota_network',
            type: 'decimal',
            precision: 10,
            scale: 2,
            default: 1024.0
          },
          {
            name: 'allowed_packages_json',
            type: 'jsonb',
            default: "'{\"pip\": [\"*\"], \"npm\": [\"*\"], \"conda\": [\"*\"], \"blocked\": []}'"
          },
          {
            name: 'security_settings',
            type: 'jsonb',
            default: "'{}'"
          },
          {
            name: 'auto_start',
            type: 'boolean',
            default: false
          },
          {
            name: 'idle_timeout',
            type: 'int',
            default: 1800
          },
          {
            name: 'max_session_duration',
            type: 'int',
            default: 7200
          },
          {
            name: 'effective_from',
            type: 'timestamp',
            isNullable: false
          },
          {
            name: 'effective_to',
            type: 'timestamp',
            isNullable: true
          },
          {
            name: 'is_active',
            type: 'boolean',
            default: true
          },
          {
            name: 'priority',
            type: 'int',
            default: 0
          },
          {
            name: 'metadata',
            type: 'jsonb',
            default: "'{}'"
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

    // Create lab_device_agents table
    await queryRunner.createTable(
      new Table({
        name: 'lab_device_agents',
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
            type: 'uuid',
            isNullable: false
          },
          {
            name: 'student_id',
            type: 'uuid',
            isNullable: true
          },
          {
            name: 'classroom_id',
            type: 'uuid',
            isNullable: true
          },
          {
            name: 'device_id',
            type: 'varchar',
            length: '255',
            isUnique: true,
            isNullable: false
          },
          {
            name: 'device_fingerprint',
            type: 'varchar',
            length: '512',
            isNullable: false
          },
          {
            name: 'agent_version',
            type: 'varchar',
            length: '50',
            isNullable: false
          },
          {
            name: 'os_info',
            type: 'jsonb',
            isNullable: false
          },
          {
            name: 'jupyter_port',
            type: 'int',
            isNullable: true
          },
          {
            name: 'status',
            type: 'enum',
            enum: ['online', 'offline', 'busy', 'error', 'maintenance'],
            default: "'offline'"
          },
          {
            name: 'trust_level',
            type: 'enum',
            enum: ['untrusted', 'trusted', 'privileged'],
            default: "'untrusted'"
          },
          {
            name: 'last_seen_at',
            type: 'timestamp',
            isNullable: false
          },
          {
            name: 'heartbeat_interval',
            type: 'int',
            default: 5
          },
          {
            name: 'offline_cache_path',
            type: 'varchar',
            length: '512',
            isNullable: true
          },
          {
            name: 'policy_id',
            type: 'uuid',
            isNullable: true
          },
          {
            name: 'capabilities',
            type: 'jsonb',
            default: "'{}'"
          },
          {
            name: 'metadata',
            type: 'jsonb',
            default: "'{}'"
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

    // Create lab_agent_sessions table
    await queryRunner.createTable(
      new Table({
        name: 'lab_agent_sessions',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'uuid_generate_v4()'
          },
          {
            name: 'agent_id',
            type: 'uuid',
            isNullable: false
          },
          {
            name: 'lab_run_id',
            type: 'uuid',
            isNullable: false
          },
          {
            name: 'session_token',
            type: 'varchar',
            length: '255',
            isUnique: true,
            isNullable: false
          },
          {
            name: 'state',
            type: 'enum',
            enum: ['initializing', 'ready', 'running', 'completed', 'failed', 'cancelled', 'timeout'],
            default: "'initializing'"
          },
          {
            name: 'notebook_checksum',
            type: 'varchar',
            length: '64',
            isNullable: false
          },
          {
            name: 'notebook_url',
            type: 'varchar',
            length: '512',
            isNullable: false
          },
          {
            name: 'package_manifest',
            type: 'jsonb',
            isNullable: false
          },
          {
            name: 'exit_code',
            type: 'int',
            isNullable: true
          },
          {
            name: 'exit_message',
            type: 'text',
            isNullable: true
          },
          {
            name: 'started_at',
            type: 'timestamp',
            isNullable: false
          },
          {
            name: 'ended_at',
            type: 'timestamp',
            isNullable: true
          },
          {
            name: 'last_heartbeat_at',
            type: 'timestamp',
            isNullable: false
          },
          {
            name: 'offline_cache_path',
            type: 'varchar',
            length: '512',
            isNullable: true
          },
          {
            name: 'runtime_stats',
            type: 'jsonb',
            default: "'{}'"
          },
          {
            name: 'jupyter_url',
            type: 'varchar',
            length: '512',
            isNullable: true
          },
          {
            name: 'local_notebook_path',
            type: 'varchar',
            length: '512',
            isNullable: true
          },
          {
            name: 'artifacts_path',
            type: 'varchar',
            length: '512',
            isNullable: true
          },
          {
            name: 'sync_status',
            type: 'varchar',
            length: '50',
            default: "'pending'"
          },
          {
            name: 'metadata',
            type: 'jsonb',
            default: "'{}'"
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

    // Create lab_agent_events table
    await queryRunner.createTable(
      new Table({
        name: 'lab_agent_events',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'uuid_generate_v4()'
          },
          {
            name: 'agent_session_id',
            type: 'uuid',
            isNullable: false
          },
          {
            name: 'event_type',
            type: 'enum',
            enum: ['heartbeat', 'log', 'artifact', 'error', 'warning', 'sync', 'status_change', 'cell_executed', 'output', 'debug'],
            isNullable: false
          },
          {
            name: 'payload_json',
            type: 'jsonb',
            isNullable: false
          },
          {
            name: 'event_timestamp',
            type: 'timestamp',
            isNullable: false
          },
          {
            name: 'sequence_number',
            type: 'bigint',
            isNullable: false
          },
          {
            name: 'level',
            type: 'varchar',
            length: '20',
            isNullable: true
          },
          {
            name: 'source',
            type: 'varchar',
            length: '100',
            isNullable: true
          },
          {
            name: 'correlation_id',
            type: 'varchar',
            length: '100',
            isNullable: true
          },
          {
            name: 'is_processed',
            type: 'boolean',
            default: false
          },
          {
            name: 'processed_at',
            type: 'timestamp',
            isNullable: true
          },
          {
            name: 'retry_count',
            type: 'int',
            default: 0
          },
          {
            name: 'error_message',
            type: 'text',
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
    await queryRunner.createIndex('lab_device_policies', new Index('idx_lab_policies_tenant_grade', ['tenant_id', 'grade_band']))
    await queryRunner.createIndex('lab_device_policies', new Index('idx_lab_policies_effective', ['effective_from', 'effective_to']))

    await queryRunner.createIndex('lab_device_agents', new Index('idx_lab_agents_tenant_student', ['tenant_id', 'student_id']))
    await queryRunner.createIndex('lab_device_agents', new Index('idx_lab_agents_device_seen', ['device_id', 'last_seen_at']))
    await queryRunner.createIndex('lab_device_agents', new Index('idx_lab_agents_status_trust', ['status', 'trust_level']))

    await queryRunner.createIndex('lab_agent_sessions', new Index('idx_lab_sessions_agent_started', ['agent_id', 'started_at']))
    await queryRunner.createIndex('lab_agent_sessions', new Index('idx_lab_sessions_run', ['lab_run_id']))
    await queryRunner.createIndex('lab_agent_sessions', new Index('idx_lab_sessions_state', ['state']))
    await queryRunner.createIndex('lab_agent_sessions', new Index('idx_lab_sessions_heartbeat', ['last_heartbeat_at']))

    await queryRunner.createIndex('lab_agent_events', new Index('idx_lab_events_session_type_time', ['agent_session_id', 'event_type', 'created_at']))
    await queryRunner.createIndex('lab_agent_events', new Index('idx_lab_events_created', ['created_at']))
    await queryRunner.createIndex('lab_agent_events', new Index('idx_lab_events_processed', ['is_processed']))
    await queryRunner.createIndex('lab_agent_events', new Index('idx_lab_events_sequence', ['sequence_number']))

    // Create foreign key constraints
    await queryRunner.query(`
      ALTER TABLE lab_device_policies
      ADD CONSTRAINT fk_lab_policies_tenant
      FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE
    `)

    await queryRunner.query(`
      ALTER TABLE lab_device_agents
      ADD CONSTRAINT fk_lab_agents_tenant
      FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE,
      ADD CONSTRAINT fk_lab_agents_student
      FOREIGN KEY (student_id) REFERENCES users(id) ON DELETE SET NULL,
      ADD CONSTRAINT fk_lab_agents_classroom
      FOREIGN KEY (classroom_id) REFERENCES classrooms(id) ON DELETE SET NULL,
      ADD CONSTRAINT fk_lab_agents_policy
      FOREIGN KEY (policy_id) REFERENCES lab_device_policies(id) ON DELETE SET NULL
    `)

    await queryRunner.query(`
      ALTER TABLE lab_agent_sessions
      ADD CONSTRAINT fk_lab_sessions_agent
      FOREIGN KEY (agent_id) REFERENCES lab_device_agents(id) ON DELETE CASCADE,
      ADD CONSTRAINT fk_lab_sessions_run
      FOREIGN KEY (lab_run_id) REFERENCES lab_runs(id) ON DELETE CASCADE
    `)

    await queryRunner.query(`
      ALTER TABLE lab_agent_events
      ADD CONSTRAINT fk_lab_events_session
      FOREIGN KEY (agent_session_id) REFERENCES lab_agent_sessions(id) ON DELETE CASCADE
    `)
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('lab_agent_events')
    await queryRunner.dropTable('lab_agent_sessions')
    await queryRunner.dropTable('lab_device_agents')
    await queryRunner.dropTable('lab_device_policies')
  }
}