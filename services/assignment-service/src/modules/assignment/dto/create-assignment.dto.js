"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CreateAssignmentDto = exports.AssignmentStatus = exports.AssignmentType = void 0;
const swagger_1 = require("@nestjs/swagger");
const class_validator_1 = require("class-validator");
var AssignmentType;
(function (AssignmentType) {
    AssignmentType["QUIZ"] = "quiz";
    AssignmentType["ESSAY"] = "essay";
    AssignmentType["PROJECT"] = "project";
    AssignmentType["CODE"] = "code";
    AssignmentType["EXPERIMENT"] = "experiment";
})(AssignmentType || (exports.AssignmentType = AssignmentType = {}));
var AssignmentStatus;
(function (AssignmentStatus) {
    AssignmentStatus["DRAFT"] = "draft";
    AssignmentStatus["PUBLISHED"] = "published";
    AssignmentStatus["CLOSED"] = "closed";
    AssignmentStatus["ARCHIVED"] = "archived";
})(AssignmentStatus || (exports.AssignmentStatus = AssignmentStatus = {}));
class CreateAssignmentDto {
    @(0, swagger_1.ApiProperty)({ description: '作业标题' })
    @(0, class_validator_1.IsString)()
    @(0, class_validator_1.IsNotEmpty)()
    title;
    @(0, swagger_1.ApiProperty)({ description: '作业描述' })
    @(0, class_validator_1.IsString)()
    @(0, class_validator_1.IsNotEmpty)()
    description;
    @(0, swagger_1.ApiProperty)({ description: '课程ID' })
    @(0, class_validator_1.IsString)()
    @(0, class_validator_1.IsNotEmpty)()
    lessonId;
    @(0, swagger_1.ApiProperty)({ description: '作业类型', enum: AssignmentType })
    @(0, class_validator_1.IsEnum)(AssignmentType)
    type;
    @(0, swagger_1.ApiProperty)({ description: '作业状态', enum: AssignmentStatus })
    @(0, class_validator_1.IsEnum)(AssignmentStatus)
    status;
    @(0, swagger_1.ApiProperty)({ description: '总分', required: false })
    @(0, class_validator_1.IsOptional)()
    @(0, class_validator_1.IsNumber)()
    maxScore;
    @(0, swagger_1.ApiProperty)({ description: '截止时间', required: false })
    @(0, class_validator_1.IsOptional)()
    @(0, class_validator_1.IsDateString)()
    dueDate;
    @(0, swagger_1.ApiProperty)({ description: '预计用时（分钟）', required: false })
    @(0, class_validator_1.IsOptional)()
    @(0, class_validator_1.IsNumber)()
    estimatedDuration;
    @(0, swagger_1.ApiProperty)({ description: '作业题目/问题', required: false })
    @(0, class_validator_1.IsOptional)()
    @(0, class_validator_1.IsArray)()
    questions;
    @(0, swagger_1.ApiProperty)({ description: '作业要求', required: false })
    @(0, class_validator_1.IsOptional)()
    requirements;
    @(0, swagger_1.ApiProperty)({ description: '资源文件', required: false })
    @(0, class_validator_1.IsOptional)()
    resources;
    @(0, swagger_1.ApiProperty)({ description: '设置选项', required: false })
    @(0, class_validator_1.IsOptional)()
    settings;
}
exports.CreateAssignmentDto = CreateAssignmentDto;
//# sourceMappingURL=create-assignment.dto.js.map