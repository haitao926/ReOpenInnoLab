"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DatabaseModule = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const config_1 = require("@nestjs/config");
const assignment_entity_1 = require("./entities/assignment.entity");
const submission_entity_1 = require("./entities/submission.entity");
@(0, common_1.Module)({
    imports: [
        typeorm_1.TypeOrmModule.forRootAsync({
            imports: [config_1.ConfigModule],
            inject: [config_1.ConfigService],
            useFactory: (configService) => ({
                type: 'postgres',
                host: configService.get('DB_HOST') || 'localhost',
                port: configService.get('DB_PORT') || 5432,
                username: configService.get('DB_USERNAME') || 'postgres',
                password: configService.get('DB_PASSWORD') || 'postgres',
                database: configService.get('DB_DATABASE') || 'reopeninnolab',
                entities: [assignment_entity_1.Assignment, assignment_entity_1.AssignmentQuestion, assignment_entity_1.AssignmentAnswer, submission_entity_1.AssignmentSubmission],
                synchronize: configService.get('NODE_ENV') !== 'production',
                logging: configService.get('NODE_ENV') === 'development',
            }),
        }),
        typeorm_1.TypeOrmModule.forFeature([
            assignment_entity_1.Assignment,
            assignment_entity_1.AssignmentQuestion,
            assignment_entity_1.AssignmentAnswer,
            submission_entity_1.AssignmentSubmission,
        ]),
    ],
    exports: [
        typeorm_1.TypeOrmModule,
    ],
})
class DatabaseModule {
}
exports.DatabaseModule = DatabaseModule;
//# sourceMappingURL=database.module.js.map