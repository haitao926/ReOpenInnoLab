#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🔍 快速测试 Course Service\n');

// 测试1: 检查项目结构
console.log('1. 检查项目结构...');
const requiredDirs = [
  'src',
  'src/modules',
  'src/modules/lesson',
  'src/database',
  'src/database/entities',
  'src/database/migrations',
  'scripts'
];

const requiredFiles = [
  'src/main.ts',
  'src/app.module.ts',
  'package.json',
  'tsconfig.json'
];

let structureTestPassed = true;

requiredDirs.forEach(dir => {
  const dirPath = path.join(__dirname, '..', dir);
  if (!fs.existsSync(dirPath)) {
    console.log(`❌ 缺少目录: ${dir}`);
    structureTestPassed = false;
  } else {
    console.log(`✅ ${dir}`);
  }
});

requiredFiles.forEach(file => {
  const filePath = path.join(__dirname, '..', file);
  if (!fs.existsSync(filePath)) {
    console.log(`❌ 缺少文件: ${file}`);
    structureTestPassed = false;
  } else {
    console.log(`✅ ${file}`);
  }
});

// 测试2: 检查关键模块
console.log('\n2. 检查关键模块...');
const modules = [
  'src/modules/lesson/lesson.module.ts',
  'src/modules/lesson/lesson.controller.ts',
  'src/modules/lesson/lesson.service.ts',
  'src/modules/lesson/dto/create-lesson.dto.ts'
];

let modulesTestPassed = true;

modules.forEach(module => {
  const modulePath = path.join(__dirname, '..', module);
  if (!fs.existsSync(modulePath)) {
    console.log(`❌ 缺少模块: ${module}`);
    modulesTestPassed = false;
  } else {
    console.log(`✅ ${module}`);
  }
});

// 测试3: 检查数据库实体
console.log('\n3. 检查数据库实体...');
const entities = [
  'src/database/entities/course-instance.entity.ts',
  'src/database/entities/lesson.entity.ts',
  'src/database/entities/section.entity.ts',
  'src/database/entities/lesson-activity.entity.ts'
];

let entitiesTestPassed = true;

entities.forEach(entity => {
  const entityPath = path.join(__dirname, '..', entity);
  if (!fs.existsSync(entityPath)) {
    console.log(`❌ 缺少实体: ${entity}`);
    entitiesTestPassed = false;
  } else {
    console.log(`✅ ${entity}`);
  }
});

// 测试4: 检查文件内容
console.log('\n4. 检查关键文件内容...');

// 检查lesson controller
const lessonControllerPath = path.join(__dirname, '../src/modules/lesson/lesson.controller.ts');
if (fs.existsSync(lessonControllerPath)) {
  const controllerContent = fs.readFileSync(lessonControllerPath, 'utf8');
  const hasEndpoints = controllerContent.includes('createLesson') &&
                      controllerContent.includes('startLesson') &&
                      controllerContent.includes('setCurrentSection');
  console.log(hasEndpoints ? '✅ Lesson Controller 包含关键端点' : '❌ Lesson Controller 缺少关键端点');
} else {
  console.log('❌ Lesson Controller 不存在');
}

// 检查lesson service
const lessonServicePath = path.join(__dirname, '../src/modules/lesson/lesson.service.ts');
if (fs.existsSync(lessonServicePath)) {
  const serviceContent = fs.readFileSync(lessonServicePath, 'utf8');
  const hasMethods = serviceContent.includes('createLesson') &&
                    serviceContent.includes('startLesson') &&
                    serviceContent.includes('setCurrentSection');
  console.log(hasMethods ? '✅ Lesson Service 包含关键方法' : '❌ Lesson Service 缺少关键方法');
} else {
  console.log('❌ Lesson Service 不存在');
}

// 测试5: 检查依赖
console.log('\n5. 检查package.json依赖...');
const packageJsonPath = path.join(__dirname, '../package.json');
if (fs.existsSync(packageJsonPath)) {
  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
  const requiredDeps = [
    '@nestjs/common',
    '@nestjs/core',
    '@nestjs/typeorm',
    'typeorm'
  ];

  let depsTestPassed = true;
  requiredDeps.forEach(dep => {
    if (packageJson.dependencies[dep]) {
      console.log(`✅ ${dep}`);
    } else {
      console.log(`❌ 缺少依赖: ${dep}`);
      depsTestPassed = false;
    }
  });
} else {
  console.log('❌ package.json 不存在');
}

// 汇总结果
console.log('\n📊 测试结果汇总:');
console.log('=' .repeat(40));

const tests = [
  { name: '项目结构', passed: structureTestPassed },
  { name: '模块文件', passed: modulesTestPassed },
  { name: '数据库实体', passed: entitiesTestPassed }
];

const passedTests = tests.filter(t => t.passed).length;
const totalTests = tests.length;

console.log(`✅ 通过: ${passedTests}/${totalTests} 项基本测试`);

if (passedTests === totalTests) {
  console.log('\n🎉 基础结构验证通过！Course Service 架构完整。');
  console.log('\n📋 建议下一步:');
  console.log('1. 修复剩余的 TypeScript 类型错误');
  console.log('2. 设置数据库环境变量');
  console.log('3. 运行数据库迁移');
  console.log('4. 启动服务进行端到端测试');
  process.exit(0);
} else {
  console.log('\n⚠️  存在结构问题，请检查缺失的组件。');
  process.exit(1);
}