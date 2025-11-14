"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const core_1 = require("@nestjs/core");
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const config_1 = require("@nestjs/config");
const app_module_1 = require("./app.module");
async function bootstrap() {
    const app = await core_1.NestFactory.create(app_module_1.AppModule);
    const configService = app.get(config_1.ConfigService);
    // 全局验证管道
    app.useGlobalPipes(new common_1.ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
    }));
    // CORS配置
    app.enableCors({
        origin: configService.get('FRONTEND_URL') || 'http://localhost:5173',
        credentials: true,
    });
    // Swagger API文档
    const config = new swagger_1.DocumentBuilder()
        .setTitle('Assignment Service API')
        .setDescription('ReOpenInnoLab Assignment Management Service')
        .setVersion('1.0')
        .addTag('assignments')
        .build();
    const document = swagger_1.SwaggerModule.createDocument(app, config);
    swagger_1.SwaggerModule.setup('api', app, document);
    const port = configService.get('PORT') || 3005;
    await app.listen(port);
    console.log(`Assignment Service is running on port ${port}`);
    console.log(`API documentation available at http://localhost:${port}/api`);
}
bootstrap();
//# sourceMappingURL=main.js.map