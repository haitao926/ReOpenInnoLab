"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SubmitAssignmentDto = void 0;
const swagger_1 = require("@nestjs/swagger");
const class_validator_1 = require("class-validator");
class SubmitAssignmentDto {
    @(0, swagger_1.ApiProperty)({ description: '学生答案列表' })
    @(0, class_validator_1.IsArray)()
    answers;
    @(0, swagger_1.ApiProperty)({ description: '总用时（秒）', required: false })
    @(0, class_validator_1.IsOptional)()
    @(0, class_validator_1.IsNumber)()
    timeSpent;
}
exports.SubmitAssignmentDto = SubmitAssignmentDto;
//# sourceMappingURL=submit-assignment.dto.js.map