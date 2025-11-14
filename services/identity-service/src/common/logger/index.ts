import { Logger, Module } from '@nestjs/common';

@Module({})
export class LoggerModule {}

export const AppLogger = new Logger('IdentityService');

// Re-export Logger for other modules
export { Logger };