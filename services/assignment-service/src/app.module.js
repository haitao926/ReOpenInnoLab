"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppModule = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const config_1 = require("@nestjs/config");
const assignment_module_1 = require("./modules/assignment/assignment.module");
const database_module_1 = require("./database/database.module");
const configuration_1 = __importDefault(require("./config/configuration"));
@(0, common_1.Module)({
    imports: [
        config_1.ConfigModule.forRoot({
            isGlobal: true,
            load: [configuration_1.default],
        }),
        database_module_1.DatabaseModule,
        assignment_module_1.AssignmentModule,
    ],
    controllers: [],
    providers: [],
})
class AppModule {
}
exports.AppModule = AppModule;
//# sourceMappingURL=app.module.js.map