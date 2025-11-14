export declare enum AssignmentType {
    QUIZ = "quiz",
    ESSAY = "essay",
    PROJECT = "project",
    CODE = "code",
    EXPERIMENT = "experiment"
}
export declare enum AssignmentStatus {
    DRAFT = "draft",
    PUBLISHED = "published",
    CLOSED = "closed",
    ARCHIVED = "archived"
}
export declare class CreateAssignmentDto {
    title: string;
    description: string;
    lessonId: string;
    type: AssignmentType;
    status: AssignmentStatus;
    maxScore?: number;
    dueDate?: string;
    estimatedDuration?: number;
    questions?: Array<{
        id: string;
        type: string;
        question: string;
        options?: string[];
        correctAnswer?: any;
        points: number;
    }>;
    requirements?: string[];
    resources?: Array<{
        id: string;
        name: string;
        type: string;
        url: string;
        size?: number;
    }>;
    settings?: {
        allowMultipleAttempts?: boolean;
        showCorrectAnswers?: boolean;
        timeLimit?: number;
        shuffleQuestions?: boolean;
        autoGrade?: boolean;
    };
}
//# sourceMappingURL=create-assignment.dto.d.ts.map