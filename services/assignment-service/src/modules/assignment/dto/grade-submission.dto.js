"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GradeSubmissionDto = void 0;
const swagger_1 = require("@nestjs/swagger");
const class_validator_1 = require("class-validator");
class GradeSubmissionDto {
    @(0, swagger_1.ApiProperty)({ description: '总分' })
    @(0, class_validator_1.IsNumber)()
    score;
    @(0, swagger_1.ApiProperty)({ description: '教师反馈', required: false })
    @(0, class_validator_1.IsOptional)()
    @(0, class_validator_1.IsString)()
    feedback;
    @(0, swagger_1.ApiProperty)({ description: '个别答案评分', required: false })
    @(0, class_validator_1.IsOptional)()
    @(0, class_validator_1.IsArray)()
    answers;
}
exports.GradeSubmissionDto = GradeSubmissionDto;
//# sourceMappingURL=grade-submission.dto.js.map