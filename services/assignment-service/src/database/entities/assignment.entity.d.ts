export declare class Assignment {
    id: string;
    lessonId: string;
    sectionId: string;
    title: string;
    description: string;
    type: string;
    status: string;
    totalPoints: number;
    passingScore: number;
    timeLimit?: number;
    maxAttempts: number;
    showCorrectAnswers: boolean;
    randomizeQuestions: boolean;
    settings?: {
        allowLateSubmission: boolean;
        latePenalty: number;
        showFeedback: boolean;
        autoGrade: boolean;
        aiAssistance: boolean;
    };
    startsAt?: Date;
    dueAt?: Date;
    createdBy: string;
    createdAt: Date;
    updatedAt: Date;
    questions: AssignmentQuestion[];
    submissions: AssignmentSubmission[];
}
export declare class AssignmentQuestion {
    id: string;
    assignmentId: string;
    type: string;
    title: string;
    content: string;
    points: number;
    order: number;
    required: boolean;
    options?: Array<{
        id: string;
        label: string;
        text: string;
        isCorrect: boolean;
    }>;
    correctAnswer?: string | string[];
    referenceAnswer?: string;
    gradingCriteria?: {
        keywords: string[];
        minWords?: number;
        maxWords?: number;
        requiredPoints: string[];
    };
    explanation?: string;
    hint?: string;
    createdAt: Date;
    updatedAt: Date;
    assignment: Assignment;
    answers: AssignmentAnswer[];
}
export declare class AssignmentSubmission {
    id: string;
    assignmentId: string;
    studentId: string;
    status: string;
    score?: number;
    maxScore?: number;
    timeSpent?: number;
    attemptCount: number;
    submittedAt?: Date;
    gradedAt?: Date;
    gradedBy?: string;
    feedback?: string;
    isLate: boolean;
    latePenalty?: number;
    ipAddress?: string;
    userAgent?: string;
    createdAt: Date;
    updatedAt: Date;
    assignment: Assignment;
    answers: AssignmentAnswer[];
}
export declare class AssignmentAnswer {
    id: string;
    submissionId: string;
    questionId: string;
    answer: string | string[] | any;
    isCorrect?: boolean;
    points?: number;
    teacherScore?: number;
    teacherComment?: string;
    timeSpent?: number;
    answeredAt: Date;
    lastModifiedAt?: Date;
    createdAt: Date;
    updatedAt: Date;
    submission: AssignmentSubmission;
    question: AssignmentQuestion;
}
//# sourceMappingURL=assignment.entity.d.ts.map