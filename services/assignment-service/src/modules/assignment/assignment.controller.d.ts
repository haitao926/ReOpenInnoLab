import { AssignmentService } from './assignment.service';
import { CreateAssignmentDto } from './dto/create-assignment.dto';
import { UpdateAssignmentDto } from './dto/update-assignment.dto';
import { SubmitAssignmentDto } from './dto/submit-assignment.dto';
import { GradeSubmissionDto } from './dto/grade-submission.dto';
export declare class AssignmentController {
    private readonly assignmentService;
    constructor(assignmentService: AssignmentService);
    createAssignment(createAssignmentDto: CreateAssignmentDto): Promise<any>;
    getAssignment(id: string): Promise<any>;
    getAssignmentsByLesson(lessonId: string): Promise<Assignment[]>;
    updateAssignment(id: string, updateAssignmentDto: UpdateAssignmentDto): Promise<any>;
    publishAssignment(id: string): Promise<any>;
    closeAssignment(id: string): Promise<any>;
    deleteAssignment(id: string): Promise<void>;
    addQuestion(assignmentId: string, questionData: {
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
    submitAssignment(assignmentId: string, submitAssignmentDto: SubmitAssignmentDto, req: any): Promise<any>;
    getStudentSubmission(assignmentId: string, req: any): Promise<any>;
    getAssignmentSubmissions(assignmentId: string): Promise<AssignmentSubmission[]>;
    gradeSubmission(assignmentId: string, submissionId: string, gradeSubmissionDto: GradeSubmissionDto, req: any): Promise<any>;
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
}
//# sourceMappingURL=assignment.controller.d.ts.map