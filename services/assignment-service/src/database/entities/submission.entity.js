"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AssignmentSubmission = void 0;
const typeorm_1 = require("typeorm");
const swagger_1 = require("@nestjs/swagger");
const assignment_entity_1 = require("./assignment.entity");
@(0, typeorm_1.Entity)('assignment_submissions')
@(0, typeorm_1.Index)(['assignmentId', 'studentId'])
@(0, typeorm_1.Index)(['studentId', 'status'])
class AssignmentSubmission {
    @(0, swagger_1.ApiProperty)({ description: 'ФID' })
    @(0, typeorm_1.PrimaryGeneratedColumn)('uuid')
    id;
    @(0, swagger_1.ApiProperty)({ description: '\ID' })
    @(0, typeorm_1.Column)({ type: 'varchar', length: 255 })
    assignmentId;
    @(0, swagger_1.ApiProperty)({ description: 'fID' })
    @(0, typeorm_1.Column)({ type: 'varchar', length: 255 })
    studentId;
    @(0, swagger_1.ApiProperty)({ description: 'f�,
        ' }): ,
        studentName: string }, (), status, string, (), attemptNumber, number, (), answers, (Array), (), attachments ?  : Array, (), timeSpent ?  : number, (), score ?  : number, (), percentage ?  : number, (), passed ?  : boolean, (), feedback ?  : string, (), gradedBy ?  : string, (), gradedAt ?  : Date, (), autoGradingResult ?  : {
        totalScore: number,
        maxScore: number,
        questionResults: (Array)
    }, (), aiSuggestions ?  : Array, (), submittedAt ?  : Date, (), createdAt, Date, (), updatedAt, Date
    // sTs�
    , 
    // sTs�
    (), assignment, assignment_entity_1.Assignment)
    ;
}
exports.AssignmentSubmission = AssignmentSubmission;
//# sourceMappingURL=submission.entity.js.map