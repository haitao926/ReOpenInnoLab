import { DataSource } from 'typeorm'
import { ConfigService } from '@nestjs/config'
import { join } from 'path'

export const databaseConfig = async (configService: ConfigService): Promise<DataSource> => {
  return new DataSource({
    type: 'postgres',
    host: configService.get('DATABASE_HOST', 'localhost'),
    port: configService.get('DATABASE_PORT', 5432),
    username: configService.get('DATABASE_USER', 'postgres'),
    password: configService.get('DATABASE_PASSWORD', 'password'),
    database: configService.get('DATABASE_NAME', 'reopeninnolab_course'),
    ssl: configService.get('DATABASE_SSL', false),
    logging: configService.get('DATABASE_LOGGING', false),
    synchronize: configService.get('DATABASE_SYNCHRONIZE', false),
    migrationsRun: configService.get('DATABASE_MIGRATIONS_RUN', false),
    entities: [join(__dirname, '..', 'database', 'entities', '*{.ts,.js}')],
    migrations: [join(__dirname, '..', 'database', 'migrations', '*{.ts,.js}')],
    extra: {
      max: 20,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 2000
    }
  })
}