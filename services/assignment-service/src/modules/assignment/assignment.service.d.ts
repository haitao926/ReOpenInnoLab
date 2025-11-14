import { Repository } from 'typeorm';
import { Assignment, AssignmentQuestion, AssignmentAnswer } from '../database/entities/assignment.entity';
import { AssignmentSubmission } from '../database/entities/submission.entity';
export declare class AssignmentService {
    private readonly assignmentRepository;
    private readonly questionRepository;
    private readonly submissionRepository;
    private readonly answerRepository;
    constructor(assignmentRepository: Repository<Assignment>, questionRepository: Repository<AssignmentQuestion>, submissionRepository: Repository<AssignmentSubmission>, answerRepository: Repository<AssignmentAnswer>);
    createAssignment(data: {
        lessonId: string;
        sectionId: string;
        title: string;
        description: string;
        type: string;
        totalPoints: number;
        passingScore: number;
        timeLimit?: number;
        maxAttempts?: number;
        settings?: any;
        startsAt?: Date;
        dueAt?: Date;
        createdBy: string;
    }): Promise<any>;
    getAssignment(id: string): Promise<any>;
    getAssignmentsByLesson(lessonId: string): Promise<Assignment[]>;
    updateAssignment(id: string, data: Partial<Assignment>): Promise<any>;
    publishAssignment(id: string): Promise<any>;
    closeAssignment(id: string): Promise<any>;
    addQuestion(assignmentId: string, data: {
        type: string;
        title: string;
        content: string;
        points: number;
        order: number;
        required?: boolean;
        options?: any[];
        correctAnswer?: string | string[];
        referenceAnswer?: string;
        gradingCriteria?: any;
        explanation?: string;
        hint?: string;
    }): Promise<any>;
    getAssignmentQuestions(assignmentId: string): Promise<AssignmentQuestion[]>;
    submitAssignment(data: {
        assignmentId: string;
        studentId: string;
        answers: Array<{
            questionId: string;
            answer: any;
            timeSpent?: number;
        }>;
        timeSpent?: number;
        ipAddress?: string;
        userAgent?: string;
    }): Promise<any>;
    getStudentSubmission(assignmentId: string, studentId: string): Promise<any>;
    getAssignmentSubmissions(assignmentId: string): Promise<AssignmentSubmission[]>;
    gradeSubmission(submissionId: string, data: {
        score: number;
        feedback?: string;
        gradedBy: string;
        answers?: Array<{
            id: string;
            teacherScore: number;
            teacherComment?: string;
        }>;
    }): Promise<any>;
    autoGradeSubmission(submissionId: string): Promise<{
        score: number;
        maxScore: any;
        percentage: number;
    }>;
    getAssignmentStats(assignmentId: string): Promise<{
        totalStudents: number;
        submittedCount: number;
        gradedCount: number;
        averageScore: number;
        maxScore: any;
        passingScore: any;
        passRate: number;
        submissionRate: number;
    }>;
    deleteAssignment(id: string): Promise<void>;
}
//# sourceMappingURL=assignment.service.d.ts.map