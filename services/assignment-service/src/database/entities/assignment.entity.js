"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AssignmentAnswer = exports.AssignmentSubmission = exports.AssignmentQuestion = exports.Assignment = void 0;
const typeorm_1 = require("typeorm");
const swagger_1 = require("@nestjs/swagger");
// Import needs to be at the end to avoid circular dependency
let AssignmentSubmission;
try {
    AssignmentSubmission = require('./submission.entity').AssignmentSubmission;
}
catch (e) {
    // Handle circular dependency
}
@(0, typeorm_1.Entity)('assignments')
@(0, typeorm_1.Index)(['lessonId', 'sectionId'])
class Assignment {
    @(0, swagger_1.ApiProperty)({ description: '作业ID' })
    @(0, typeorm_1.PrimaryGeneratedColumn)('uuid')
    id;
    @(0, swagger_1.ApiProperty)({ description: '课程实例ID' })
    @(0, typeorm_1.Column)({ type: 'varchar', length: 255 })
    lessonId;
    @(0, swagger_1.ApiProperty)({ description: '环节ID' })
    @(0, typeorm_1.Column)({ type: 'varchar', length: 255 })
    sectionId;
    @(0, swagger_1.ApiProperty)({ description: '作业标题' })
    @(0, typeorm_1.Column)({ type: 'varchar', length: 255 })
    title;
    @(0, swagger_1.ApiProperty)({ description: '作业描述' })
    @(0, typeorm_1.Column)({ type: 'text' })
    description;
    @(0, swagger_1.ApiProperty)({ description: '作业类型' })
    @(0, typeorm_1.Column)({
        type: 'enum',
        enum: ['quiz', 'homework', 'exam', 'practice'],
        default: 'homework',
    })
    type;
    @(0, swagger_1.ApiProperty)({ description: '作业状态' })
    @(0, typeorm_1.Column)({
        type: 'enum',
        enum: ['draft', 'published', 'closed', 'archived'],
        default: 'draft',
    })
    status;
    @(0, swagger_1.ApiProperty)({ description: '总分' })
    @(0, typeorm_1.Column)({ type: 'decimal', precision: 5, scale: 2 })
    totalPoints;
    @(0, swagger_1.ApiProperty)({ description: '及格分数' })
    @(0, typeorm_1.Column)({ type: 'decimal', precision: 5, scale: 2 })
    passingScore;
    @(0, swagger_1.ApiProperty)({ description: '时间限制（分钟）' })
    @(0, typeorm_1.Column)({ type: 'int', nullable: true })
    timeLimit;
    @(0, swagger_1.ApiProperty)({ description: '允许尝试次数' })
    @(0, typeorm_1.Column)({ type: 'int', default: 1 })
    maxAttempts;
    @(0, swagger_1.ApiProperty)({ description: '是否显示正确答案' })
    @(0, typeorm_1.Column)({ type: 'boolean', default: false })
    showCorrectAnswers;
    @(0, swagger_1.ApiProperty)({ description: '是否随机排序题目' })
    @(0, typeorm_1.Column)({ type: 'boolean', default: false })
    randomizeQuestions;
    @(0, swagger_1.ApiProperty)({ description: '作业设置', required: false })
    @(0, typeorm_1.Column)({ type: 'json', nullable: true })
    settings;
    @(0, swagger_1.ApiProperty)({ description: '开始时间', required: false })
    @(0, typeorm_1.Column)({ type: 'timestamp', nullable: true })
    startsAt;
    @(0, swagger_1.ApiProperty)({ description: '截止时间', required: false })
    @(0, typeorm_1.Column)({ type: 'timestamp', nullable: true })
    dueAt;
    @(0, swagger_1.ApiProperty)({ description: '创建者用户ID' })
    @(0, typeorm_1.Column)({ type: 'varchar', length: 255 })
    createdBy;
    @(0, swagger_1.ApiProperty)({ description: '创建时间' })
    @(0, typeorm_1.CreateDateColumn)({ type: 'timestamp' })
    createdAt;
    @(0, swagger_1.ApiProperty)({ description: '更新时间' })
    @(0, typeorm_1.UpdateDateColumn)({ type: 'timestamp' })
    updatedAt;
    // 关联关系
    @(0, typeorm_1.OneToMany)(() => AssignmentQuestion, question => question.assignment)
    questions;
    @(0, typeorm_1.OneToMany)(() => AssignmentSubmission, submission => submission.assignment)
    submissions;
}
exports.Assignment = Assignment;
@(0, typeorm_1.Entity)('assignment_questions')
class AssignmentQuestion {
    @(0, swagger_1.ApiProperty)({ description: '题目ID' })
    @(0, typeorm_1.PrimaryGeneratedColumn)('uuid')
    id;
    @(0, swagger_1.ApiProperty)({ description: '作业ID' })
    @(0, typeorm_1.Column)({ type: 'varchar', length: 255 })
    assignmentId;
    @(0, swagger_1.ApiProperty)({ description: '题目类型' })
    @(0, typeorm_1.Column)({
        type: 'enum',
        enum: ['choice', 'multiple', 'fill', 'judge', 'essay', 'coding'],
    })
    type;
    @(0, swagger_1.ApiProperty)({ description: '题目标题' })
    @(0, typeorm_1.Column)({ type: 'varchar', length: 255 })
    title;
    @(0, swagger_1.ApiProperty)({ description: '题目内容' })
    @(0, typeorm_1.Column)({ type: 'text' })
    content;
    @(0, swagger_1.ApiProperty)({ description: '题目分值' })
    @(0, typeorm_1.Column)({ type: 'decimal', precision: 5, scale: 2 })
    points;
    @(0, swagger_1.ApiProperty)({ description: '题目顺序' })
    @(0, typeorm_1.Column)({ type: 'int' })
    order;
    @(0, swagger_1.ApiProperty)({ description: '是否必答' })
    @(0, typeorm_1.Column)({ type: 'boolean', default: true })
    required;
    @(0, swagger_1.ApiProperty)({ description: '题目选项（选择题使用）', required: false })
    @(0, typeorm_1.Column)({ type: 'json', nullable: true })
    options;
    @(0, swagger_1.ApiProperty)({ description: '正确答案', required: false })
    @(0, typeorm_1.Column)({ type: 'json', nullable: true })
    correctAnswer;
    @(0, swagger_1.ApiProperty)({ description: '参考答案', required: false })
    @(0, typeorm_1.Column)({ type: 'text', nullable: true })
    referenceAnswer;
    @(0, swagger_1.ApiProperty)({ description: '评分标准', required: false })
    @(0, typeorm_1.Column)({ type: 'json', nullable: true })
    gradingCriteria;
    @(0, swagger_1.ApiProperty)({ description: '题目解析', required: false })
    @(0, typeorm_1.Column)({ type: 'text', nullable: true })
    explanation;
    @(0, swagger_1.ApiProperty)({ description: '题目提示', required: false })
    @(0, typeorm_1.Column)({ type: 'text', nullable: true })
    hint;
    @(0, swagger_1.ApiProperty)({ description: '创建时间' })
    @(0, typeorm_1.CreateDateColumn)({ type: 'timestamp' })
    createdAt;
    @(0, swagger_1.ApiProperty)({ description: '更新时间' })
    @(0, typeorm_1.UpdateDateColumn)({ type: 'timestamp' })
    updatedAt;
    // 关联关系
    @(0, typeorm_1.ManyToOne)(() => Assignment, assignment => assignment.questions)
    assignment;
    @(0, typeorm_1.OneToMany)(() => AssignmentAnswer, answer => answer.question)
    answers;
}
exports.AssignmentQuestion = AssignmentQuestion;
@(0, typeorm_1.Entity)('assignment_submissions')
class AssignmentSubmission {
    @(0, swagger_1.ApiProperty)({ description: '提交ID' })
    @(0, typeorm_1.PrimaryGeneratedColumn)('uuid')
    id;
    @(0, swagger_1.ApiProperty)({ description: '作业ID' })
    @(0, typeorm_1.Column)({ type: 'varchar', length: 255 })
    assignmentId;
    @(0, swagger_1.ApiProperty)({ description: '学生ID' })
    @(0, typeorm_1.Column)({ type: 'varchar', length: 255 })
    studentId;
    @(0, swagger_1.ApiProperty)({ description: '提交状态' })
    @(0, typeorm_1.Column)({
        type: 'enum',
        enum: ['draft', 'submitted', 'graded', 'returned'],
        default: 'draft',
    })
    status;
    @(0, swagger_1.ApiProperty)({ description: '得分', required: false })
    @(0, typeorm_1.Column)({ type: 'decimal', precision: 5, scale: 2, nullable: true })
    score;
    @(0, swagger_1.ApiProperty)({ description: '最大得分', required: false })
    @(0, typeorm_1.Column)({ type: 'decimal', precision: 5, scale: 2, nullable: true })
    maxScore;
    @(0, swagger_1.ApiProperty)({ description: '用时（秒）' })
    @(0, typeorm_1.Column)({ type: 'int', nullable: true })
    timeSpent;
    @(0, swagger_1.ApiProperty)({ description: '尝试次数' })
    @(0, typeorm_1.Column)({ type: 'int', default: 1 })
    attemptCount;
    @(0, swagger_1.ApiProperty)({ description: '提交时间' })
    @(0, typeorm_1.Column)({ type: 'timestamp', nullable: true })
    submittedAt;
    @(0, swagger_1.ApiProperty)({ description: '评分时间', required: false })
    @(0, typeorm_1.Column)({ type: 'timestamp', nullable: true })
    gradedAt;
    @(0, swagger_1.ApiProperty)({ description: '评分者ID', required: false })
    @(0, typeorm_1.Column)({ type: 'varchar', length: 255, nullable: true })
    gradedBy;
    @(0, swagger_1.ApiProperty)({ description: '教师反馈', required: false })
    @(0, typeorm_1.Column)({ type: 'text', nullable: true })
    feedback;
    @(0, swagger_1.ApiProperty)({ description: '是否迟交' })
    @(0, typeorm_1.Column)({ type: 'boolean', default: false })
    isLate;
    @(0, swagger_1.ApiProperty)({ description: '迟交扣分', required: false })
    @(0, typeorm_1.Column)({ type: 'decimal', precision: 5, scale: 2, nullable: true })
    latePenalty;
    @(0, swagger_1.ApiProperty)({ description: '提交IP地址', required: false })
    @(0, typeorm_1.Column)({ type: 'varchar', length: 45, nullable: true })
    ipAddress;
    @(0, swagger_1.ApiProperty)({ description: '用户代理', required: false })
    @(0, typeorm_1.Column)({ type: 'text', nullable: true })
    userAgent;
    @(0, swagger_1.ApiProperty)({ description: '创建时间' })
    @(0, typeorm_1.CreateDateColumn)({ type: 'timestamp' })
    createdAt;
    @(0, swagger_1.ApiProperty)({ description: '更新时间' })
    @(0, typeorm_1.UpdateDateColumn)({ type: 'timestamp' })
    updatedAt;
    // 关联关系
    @(0, typeorm_1.ManyToOne)(() => Assignment, assignment => assignment.submissions)
    assignment;
    @(0, typeorm_1.OneToMany)(() => AssignmentAnswer, answer => answer.submission)
    answers;
}
exports.AssignmentSubmission = AssignmentSubmission;
@(0, typeorm_1.Entity)('assignment_answers')
class AssignmentAnswer {
    @(0, swagger_1.ApiProperty)({ description: '答案ID' })
    @(0, typeorm_1.PrimaryGeneratedColumn)('uuid')
    id;
    @(0, swagger_1.ApiProperty)({ description: '提交ID' })
    @(0, typeorm_1.Column)({ type: 'varchar', length: 255 })
    submissionId;
    @(0, swagger_1.ApiProperty)({ description: '题目ID' })
    @(0, typeorm_1.Column)({ type: 'varchar', length: 255 })
    questionId;
    @(0, swagger_1.ApiProperty)({ description: '学生答案' })
    @(0, typeorm_1.Column)({ type: 'json' })
    answer;
    @(0, swagger_1.ApiProperty)({ description: '是否正确', required: false })
    @(0, typeorm_1.Column)({ type: 'boolean', nullable: true })
    isCorrect;
    @(0, swagger_1.ApiProperty)({ description: '得分', required: false })
    @(0, typeorm_1.Column)({ type: 'decimal', precision: 5, scale: 2, nullable: true })
    points;
    @(0, swagger_1.ApiProperty)({ description: '教师评分', required: false })
    @(0, typeorm_1.Column)({ type: 'decimal', precision: 5, scale: 2, nullable: true })
    teacherScore;
    @(0, swagger_1.ApiProperty)({ description: '教师评语', required: false })
    @(0, typeorm_1.Column)({ type: 'text', nullable: true })
    teacherComment;
    @(0, swagger_1.ApiProperty)({ description: '回答用时（秒）', required: false })
    @(0, typeorm_1.Column)({ type: 'int', nullable: true })
    timeSpent;
    @(0, swagger_1.ApiProperty)({ description: '回答时间' })
    @(0, typeorm_1.Column)({ type: 'timestamp' })
    answeredAt;
    @(0, swagger_1.ApiProperty)({ description: '最后修改时间' })
    @(0, typeorm_1.Column)({ type: 'timestamp', nullable: true })
    lastModifiedAt;
    @(0, swagger_1.ApiProperty)({ description: '创建时间' })
    @(0, typeorm_1.CreateDateColumn)({ type: 'timestamp' })
    createdAt;
    @(0, swagger_1.ApiProperty)({ description: '更新时间' })
    @(0, typeorm_1.UpdateDateColumn)({ type: 'timestamp' })
    updatedAt;
    // 关联关系
    @(0, typeorm_1.ManyToOne)(() => AssignmentSubmission, submission => submission.answers)
    submission;
    @(0, typeorm_1.ManyToOne)(() => AssignmentQuestion, question => question.answers)
    question;
}
exports.AssignmentAnswer = AssignmentAnswer;
//# sourceMappingURL=assignment.entity.js.map