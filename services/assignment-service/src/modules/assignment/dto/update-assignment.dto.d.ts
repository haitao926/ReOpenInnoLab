export declare class UpdateAssignmentDto {
    title?: string;
    description?: string;
    status?: string;
    totalPoints?: number;
    passingScore?: number;
    timeLimit?: number;
    maxAttempts?: number;
    showCorrectAnswers?: boolean;
    randomizeQuestions?: boolean;
    settings?: {
        allowLateSubmission: boolean;
        latePenalty: number;
        showFeedback: boolean;
        autoGrade: boolean;
        aiAssistance: boolean;
    };
    startsAt?: Date;
    dueAt?: Date;
}
//# sourceMappingURL=update-assignment.dto.d.ts.map