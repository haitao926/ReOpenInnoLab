"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AssignmentModule = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const assignment_controller_1 = require("./assignment.controller");
const assignment_service_1 = require("./assignment.service");
const assignment_entity_1 = require("../database/entities/assignment.entity");
const submission_entity_1 = require("../database/entities/submission.entity");
@(0, common_1.Module)({
    imports: [
        typeorm_1.TypeOrmModule.forFeature([
            assignment_entity_1.Assignment,
            assignment_entity_1.AssignmentQuestion,
            submission_entity_1.AssignmentSubmission,
            assignment_entity_1.AssignmentAnswer,
        ]),
    ],
    controllers: [assignment_controller_1.AssignmentController],
    providers: [assignment_service_1.AssignmentService],
    exports: [assignment_service_1.AssignmentService],
})
class AssignmentModule {
}
exports.AssignmentModule = AssignmentModule;
//# sourceMappingURL=assignment.module.js.map