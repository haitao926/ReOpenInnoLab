"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AssignmentController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const assignment_service_1 = require("./assignment.service");
const create_assignment_dto_1 = require("./dto/create-assignment.dto");
const update_assignment_dto_1 = require("./dto/update-assignment.dto");
const submit_assignment_dto_1 = require("./dto/submit-assignment.dto");
const grade_submission_dto_1 = require("./dto/grade-submission.dto");
const jwt_auth_guard_1 = require("../auth/jwt-auth.guard");
@(0, swagger_1.ApiTags)('assignments')
@(0, common_1.Controller)('assignments')
@(0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard)
class AssignmentController {
    assignmentService;
    constructor(assignmentService) {
        this.assignmentService = assignmentService;
    }
    @(0, common_1.Post)()
    @(0, swagger_1.ApiOperation)({ summary: '创建作业' })
    @(0, swagger_1.ApiResponse)({ status: 201, description: '作业创建成功' })
    async createAssignment(
    @(0, common_1.Body)()
    createAssignmentDto) {
        return await this.assignmentService.createAssignment(createAssignmentDto);
    }
    @(0, common_1.Get)(':id')
    @(0, swagger_1.ApiOperation)({ summary: '获取作业详情' })
    @(0, swagger_1.ApiParam)({ name: 'id', description: '作业ID' })
    @(0, swagger_1.ApiResponse)({ status: 200, description: '获取成功' })
    async getAssignment(
    @(0, common_1.Param)('id')
    id) {
        return await this.assignmentService.getAssignment(id);
    }
    @(0, common_1.Get)('lesson/:lessonId')
    @(0, swagger_1.ApiOperation)({ summary: '获取课程下的所有作业' })
    @(0, swagger_1.ApiParam)({ name: 'lessonId', description: '课程ID' })
    @(0, swagger_1.ApiResponse)({ status: 200, description: '获取成功' })
    async getAssignmentsByLesson(
    @(0, common_1.Param)('lessonId')
    lessonId) {
        return await this.assignmentService.getAssignmentsByLesson(lessonId);
    }
    @(0, common_1.Put)(':id')
    @(0, swagger_1.ApiOperation)({ summary: '更新作业' })
    @(0, swagger_1.ApiParam)({ name: 'id', description: '作业ID' })
    @(0, swagger_1.ApiResponse)({ status: 200, description: '更新成功' })
    async updateAssignment(
    @(0, common_1.Param)('id')
    id, 
    @(0, common_1.Body)()
    updateAssignmentDto) {
        return await this.assignmentService.updateAssignment(id, updateAssignmentDto);
    }
    @(0, common_1.Post)(':id/publish')
    @(0, swagger_1.ApiOperation)({ summary: '发布作业' })
    @(0, swagger_1.ApiParam)({ name: 'id', description: '作业ID' })
    @(0, swagger_1.ApiResponse)({ status: 200, description: '发布成功' })
    async publishAssignment(
    @(0, common_1.Param)('id')
    id) {
        return await this.assignmentService.publishAssignment(id);
    }
    @(0, common_1.Post)(':id/close')
    @(0, swagger_1.ApiOperation)({ summary: '关闭作业' })
    @(0, swagger_1.ApiParam)({ name: 'id', description: '作业ID' })
    @(0, swagger_1.ApiResponse)({ status: 200, description: '关闭成功' })
    async closeAssignment(
    @(0, common_1.Param)('id')
    id) {
        return await this.assignmentService.closeAssignment(id);
    }
    @(0, common_1.Delete)(':id')
    @(0, swagger_1.ApiOperation)({ summary: '删除作业' })
    @(0, swagger_1.ApiParam)({ name: 'id', description: '作业ID' })
    @(0, swagger_1.ApiResponse)({ status: 200, description: '删除成功' })
    async deleteAssignment(
    @(0, common_1.Param)('id')
    id) {
        return await this.assignmentService.deleteAssignment(id);
    }
    @(0, common_1.Post)(':id/questions')
    @(0, swagger_1.ApiOperation)({ summary: '添加作业题目' })
    @(0, swagger_1.ApiParam)({ name: 'id', description: '作业ID' })
    @(0, swagger_1.ApiResponse)({ status: 201, description: '题目添加成功' })
    async addQuestion(
    @(0, common_1.Param)('id')
    assignmentId, 
    @(0, common_1.Body)()
    questionData) {
        return await this.assignmentService.addQuestion(assignmentId, questionData);
    }
    @(0, common_1.Get)(':id/questions')
    @(0, swagger_1.ApiOperation)({ summary: '获取作业题目' })
    @(0, swagger_1.ApiParam)({ name: 'id', description: '作业ID' })
    @(0, swagger_1.ApiResponse)({ status: 200, description: '获取成功' })
    async getAssignmentQuestions(
    @(0, common_1.Param)('id')
    assignmentId) {
        return await this.assignmentService.getAssignmentQuestions(assignmentId);
    }
    @(0, common_1.Post)(':id/submit')
    @(0, swagger_1.ApiOperation)({ summary: '学生提交作业' })
    @(0, swagger_1.ApiParam)({ name: 'id', description: '作业ID' })
    @(0, swagger_1.ApiResponse)({ status: 201, description: '提交成功' })
    async submitAssignment(
    @(0, common_1.Param)('id')
    assignmentId, 
    @(0, common_1.Body)()
    submitAssignmentDto, 
    @(0, common_1.Request)()
    req) {
        return await this.assignmentService.submitAssignment({
            ...submitAssignmentDto,
            assignmentId,
            studentId: req.user?.id,
            ipAddress: req.ip,
            userAgent: req.headers['user-agent'],
        });
    }
    @(0, common_1.Get)(':id/submission')
    @(0, swagger_1.ApiOperation)({ summary: '获取当前学生的提交记录' })
    @(0, swagger_1.ApiParam)({ name: 'id', description: '作业ID' })
    @(0, swagger_1.ApiResponse)({ status: 200, description: '获取成功' })
    async getStudentSubmission(
    @(0, common_1.Param)('id')
    assignmentId, 
    @(0, common_1.Request)()
    req) {
        return await this.assignmentService.getStudentSubmission(assignmentId, req.user?.id);
    }
    @(0, common_1.Get)(':id/submissions')
    @(0, swagger_1.ApiOperation)({ summary: '获取作业的所有提交记录' })
    @(0, swagger_1.ApiParam)({ name: 'id', description: '作业ID' })
    @(0, swagger_1.ApiResponse)({ status: 200, description: '获取成功' })
    async getAssignmentSubmissions(
    @(0, common_1.Param)('id')
    assignmentId) {
        return await this.assignmentService.getAssignmentSubmissions(assignmentId);
    }
    @(0, common_1.Post)(':id/submissions/:submissionId/grade')
    @(0, swagger_1.ApiOperation)({ summary: '评分作业提交' })
    @(0, swagger_1.ApiParam)({ name: 'id', description: '作业ID' })
    @(0, swagger_1.ApiParam)({ name: 'submissionId', description: '提交ID' })
    @(0, swagger_1.ApiResponse)({ status: 200, description: '评分成功' })
    async gradeSubmission(
    @(0, common_1.Param)('id')
    assignmentId, 
    @(0, common_1.Param)('submissionId')
    submissionId, 
    @(0, common_1.Body)()
    gradeSubmissionDto, 
    @(0, common_1.Request)()
    req) {
        return await this.assignmentService.gradeSubmission(submissionId, {
            ...gradeSubmissionDto,
            gradedBy: req.user?.id,
        });
    }
    @(0, common_1.Get)(':id/stats')
    @(0, swagger_1.ApiOperation)({ summary: '获取作业统计信息' })
    @(0, swagger_1.ApiParam)({ name: 'id', description: '作业ID' })
    @(0, swagger_1.ApiResponse)({ status: 200, description: '获取成功' })
    async getAssignmentStats(
    @(0, common_1.Param)('id')
    assignmentId) {
        return await this.assignmentService.getAssignmentStats(assignmentId);
    }
}
exports.AssignmentController = AssignmentController;
//# sourceMappingURL=assignment.controller.js.map