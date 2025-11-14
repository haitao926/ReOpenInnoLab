"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AssignmentService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const assignment_entity_1 = require("../database/entities/assignment.entity");
const submission_entity_1 = require("../database/entities/submission.entity");
@(0, common_1.Injectable)()
class AssignmentService {
    assignmentRepository;
    questionRepository;
    submissionRepository;
    answerRepository;
    constructor(
    @(0, typeorm_1.InjectRepository)(assignment_entity_1.Assignment)
    assignmentRepository, 
    @(0, typeorm_1.InjectRepository)(assignment_entity_1.AssignmentQuestion)
    questionRepository, 
    @(0, typeorm_1.InjectRepository)(submission_entity_1.AssignmentSubmission)
    submissionRepository, 
    @(0, typeorm_1.InjectRepository)(assignment_entity_1.AssignmentAnswer)
    answerRepository) {
        this.assignmentRepository = assignmentRepository;
        this.questionRepository = questionRepository;
        this.submissionRepository = submissionRepository;
        this.answerRepository = answerRepository;
    }
    // 创建作业
    async createAssignment(data) {
        const assignment = this.assignmentRepository.create(data);
        return await this.assignmentRepository.save(assignment);
    }
    // 获取作业详情
    async getAssignment(id) {
        const assignment = await this.assignmentRepository.findOne({
            where: { id },
            relations: ['questions'],
        });
        if (!assignment) {
            throw new common_1.NotFoundException('Assignment not found');
        }
        return assignment;
    }
    // 获取课程下的所有作业
    async getAssignmentsByLesson(lessonId) {
        return await this.assignmentRepository.find({
            where: { lessonId },
            relations: ['questions'],
            order: { createdAt: 'ASC' },
        });
    }
    // 更新作业
    async updateAssignment(id, data) {
        const assignment = await this.getAssignment(id);
        Object.assign(assignment, data);
        return await this.assignmentRepository.save(assignment);
    }
    // 发布作业
    async publishAssignment(id) {
        return await this.updateAssignment(id, { status: 'published' });
    }
    // 关闭作业
    async closeAssignment(id) {
        return await this.updateAssignment(id, { status: 'closed' });
    }
    // 添加题目
    async addQuestion(assignmentId, data) {
        const question = this.questionRepository.create({
            assignmentId,
            ...data,
        });
        return await this.questionRepository.save(question);
    }
    // 获取作业题目
    async getAssignmentQuestions(assignmentId) {
        return await this.questionRepository.find({
            where: { assignmentId },
            order: { order: 'ASC' },
        });
    }
    // 学生提交作业
    async submitAssignment(data) {
        const assignment = await this.getAssignment(data.assignmentId);
        // 检查是否超过尝试次数
        const existingSubmission = await this.getStudentSubmission(data.assignmentId, data.studentId);
        if (existingSubmission && existingSubmission.attemptCount >= assignment.maxAttempts) {
            throw new common_1.BadRequestException('Maximum attempts exceeded');
        }
        // 创建提交记录
        const submission = this.submissionRepository.create({
            assignmentId: data.assignmentId,
            studentId: data.studentId,
            status: 'submitted',
            attemptCount: existingSubmission ? existingSubmission.attemptCount + 1 : 1,
            timeSpent: data.timeSpent,
            submittedAt: new Date(),
            ipAddress: data.ipAddress,
            userAgent: data.userAgent,
        });
        const savedSubmission = await this.submissionRepository.save(submission);
        // 保存答案
        for (const answerData of data.answers) {
            const answer = this.answerRepository.create({
                submissionId: savedSubmission.id,
                questionId: answerData.questionId,
                answer: answerData.answer,
                timeSpent: answerData.timeSpent,
                answeredAt: new Date(),
            });
            await this.answerRepository.save(answer);
        }
        // 自动评分（如果启用）
        if (assignment.settings?.autoGrade) {
            await this.autoGradeSubmission(savedSubmission.id);
        }
        return savedSubmission;
    }
    // 获取学生提交记录
    async getStudentSubmission(assignmentId, studentId) {
        return await this.submissionRepository.findOne({
            where: { assignmentId, studentId },
            relations: ['answers'],
            order: { createdAt: 'DESC' },
        });
    }
    // 获取作业的所有提交
    async getAssignmentSubmissions(assignmentId) {
        return await this.submissionRepository.find({
            where: { assignmentId },
            relations: ['answers'],
            order: { submittedAt: 'ASC' },
        });
    }
    // 评分作业
    async gradeSubmission(submissionId, data) {
        const submission = await this.submissionRepository.findOne({
            where: { id: submissionId },
            relations: ['assignment'],
        });
        if (!submission) {
            throw new common_1.NotFoundException('Submission not found');
        }
        // 更新总分
        submission.score = data.score;
        submission.maxScore = submission.assignment.totalPoints;
        submission.feedback = data.feedback;
        submission.gradedBy = data.gradedBy;
        submission.gradedAt = new Date();
        submission.status = 'graded';
        await this.submissionRepository.save(submission);
        // 更新个别答案评分
        if (data.answers) {
            for (const answerData of data.answers) {
                await this.answerRepository.update(answerData.id, {
                    teacherScore: answerData.teacherScore,
                    teacherComment: answerData.teacherComment,
                    lastModifiedAt: new Date(),
                });
            }
        }
        return submission;
    }
    // 自动评分
    async autoGradeSubmission(submissionId) {
        const submission = await this.submissionRepository.findOne({
            where: { id: submissionId },
            relations: ['answers', 'assignment', 'assignment.questions'],
        });
        if (!submission) {
            throw new common_1.NotFoundException('Submission not found');
        }
        let totalScore = 0;
        const maxScore = submission.assignment.totalPoints;
        for (const answer of submission.answers) {
            const question = submission.assignment.questions.find(q => q.id === answer.questionId);
            if (!question)
                continue;
            let isCorrect = false;
            let points = 0;
            // 根据题目类型进行自动评分
            switch (question.type) {
                case 'choice':
                case 'judge':
                    isCorrect = JSON.stringify(answer.answer) === JSON.stringify(question.correctAnswer);
                    points = isCorrect ? question.points : 0;
                    break;
                case 'multiple':
                    const studentAnswers = Array.isArray(answer.answer) ? answer.answer : [];
                    const correctAnswers = Array.isArray(question.correctAnswer) ? question.correctAnswer : [];
                    isCorrect = JSON.stringify(studentAnswers.sort()) === JSON.stringify(correctAnswers.sort());
                    points = isCorrect ? question.points : 0;
                    break;
                case 'fill':
                    // 简单的文本匹配
                    if (typeof question.correctAnswer === 'string' && typeof answer.answer === 'string') {
                        isCorrect = answer.answer.toLowerCase().trim() === question.correctAnswer.toLowerCase().trim();
                    }
                    points = isCorrect ? question.points : 0;
                    break;
                case 'essay':
                case 'coding':
                    // 简答题和编程题需要人工评分，这里给部分分数
                    points = question.points * 0.3; // 给30%的基础分
                    break;
            }
            // 更新答案的自动评分结果
            await this.answerRepository.update(answer.id, {
                isCorrect,
                points,
            });
            totalScore += points;
        }
        // 更新提交记录
        submission.score = totalScore;
        submission.maxScore = maxScore;
        submission.status = 'graded';
        submission.gradedAt = new Date();
        await this.submissionRepository.save(submission);
        return {
            score: totalScore,
            maxScore,
            percentage: Math.round((totalScore / maxScore) * 100),
        };
    }
    // 获取作业统计
    async getAssignmentStats(assignmentId) {
        const submissions = await this.getAssignmentSubmissions(assignmentId);
        const assignment = await this.getAssignment(assignmentId);
        const submitted = submissions.filter(s => s.status === 'submitted' || s.status === 'graded');
        const graded = submissions.filter(s => s.status === 'graded');
        const averageScore = graded.length > 0
            ? graded.reduce((sum, s) => sum + (s.score || 0), 0) / graded.length
            : 0;
        const passRate = graded.length > 0
            ? (graded.filter(s => (s.score || 0) >= assignment.passingScore).length / graded.length) * 100
            : 0;
        return {
            totalStudents: submissions.length,
            submittedCount: submitted.length,
            gradedCount: graded.length,
            averageScore: Math.round(averageScore * 100) / 100,
            maxScore: assignment.totalPoints,
            passingScore: assignment.passingScore,
            passRate: Math.round(passRate * 100) / 100,
            submissionRate: Math.round((submitted.length / submissions.length) * 100),
        };
    }
    // 删除作业
    async deleteAssignment(id) {
        const assignment = await this.getAssignment(id);
        await this.assignmentRepository.remove(assignment);
    }
}
exports.AssignmentService = AssignmentService;
//# sourceMappingURL=assignment.service.js.map