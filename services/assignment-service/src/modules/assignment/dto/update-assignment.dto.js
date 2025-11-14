"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UpdateAssignmentDto = void 0;
const swagger_1 = require("@nestjs/swagger");
const class_validator_1 = require("class-validator");
class UpdateAssignmentDto {
    @(0, swagger_1.ApiProperty)({ description: '作业标题', required: false })
    @(0, class_validator_1.IsOptional)()
    @(0, class_validator_1.IsString)()
    title;
    @(0, swagger_1.ApiProperty)({ description: '作业描述', required: false })
    @(0, class_validator_1.IsOptional)()
    @(0, class_validator_1.IsString)()
    description;
    @(0, swagger_1.ApiProperty)({ description: '作业状态', enum: ['draft', 'published', 'closed', 'archived'], required: false })
    @(0, class_validator_1.IsOptional)()
    @(0, class_validator_1.IsEnum)(['draft', 'published', 'closed', 'archived'])
    status;
    @(0, swagger_1.ApiProperty)({ description: '总分', required: false })
    @(0, class_validator_1.IsOptional)()
    @(0, class_validator_1.IsNumber)()
    totalPoints;
    @(0, swagger_1.ApiProperty)({ description: '及格分数', required: false })
    @(0, class_validator_1.IsOptional)()
    @(0, class_validator_1.IsNumber)()
    passingScore;
    @(0, swagger_1.ApiProperty)({ description: '时间限制（分钟）', required: false })
    @(0, class_validator_1.IsOptional)()
    @(0, class_validator_1.IsNumber)()
    timeLimit;
    @(0, swagger_1.ApiProperty)({ description: '最大尝试次数', required: false })
    @(0, class_validator_1.IsOptional)()
    @(0, class_validator_1.IsNumber)()
    maxAttempts;
    @(0, swagger_1.ApiProperty)({ description: '是否显示正确答案', required: false })
    @(0, class_validator_1.IsOptional)()
    @(0, class_validator_1.IsBoolean)()
    showCorrectAnswers;
    @(0, swagger_1.ApiProperty)({ description: '是否随机排序题目', required: false })
    @(0, class_validator_1.IsOptional)()
    @(0, class_validator_1.IsBoolean)()
    randomizeQuestions;
    @(0, swagger_1.ApiProperty)({ description: '作业设置', required: false })
    @(0, class_validator_1.IsOptional)()
    settings;
    @(0, swagger_1.ApiProperty)({ description: '开始时间', required: false })
    @(0, class_validator_1.IsOptional)()
    startsAt;
    @(0, swagger_1.ApiProperty)({ description: '截止时间', required: false })
    @(0, class_validator_1.IsOptional)()
    dueAt;
}
exports.UpdateAssignmentDto = UpdateAssignmentDto;
//# sourceMappingURL=update-assignment.dto.js.map