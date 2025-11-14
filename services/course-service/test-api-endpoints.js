#!/usr/bin/env node

// Test API endpoints for course creation
const http = require('http');

console.log('🔌 Testing Course Creation API Endpoints');
console.log('==========================================');

const API_BASE = 'http://localhost:3001';
const TEST_TENANT_ID = 'test-tenant-123';
const TEST_USER_ID = 'test-user-123';

// Mock JWT token for testing (in real implementation, this would be properly signed)
const MOCK_TOKEN = 'Bearer mock-jwt-token';

async function makeRequest(method, path, data = null) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: 3001,
      path: path,
      method: method,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': MOCK_TOKEN,
        'X-Tenant-ID': TEST_TENANT_ID,
        'X-User-ID': TEST_USER_ID
      }
    };

    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => {
        body += chunk;
      });
      res.on('end', () => {
        resolve({
          statusCode: res.statusCode,
          headers: res.headers,
          body: body ? JSON.parse(body) : null
        });
      });
    });

    req.on('error', (err) => {
      reject(err);
    });

    if (data) {
      req.write(JSON.stringify(data));
    }
    req.end();
  });
}

async function testEndpoints() {
  try {
    console.log('\n🧪 Test 1: Health Check');
    try {
      const healthResponse = await makeRequest('GET', '/');
      console.log(`   Status: ${healthResponse.statusCode === 200 ? '✅' : '❌'} (${healthResponse.statusCode})`);
      if (healthResponse.statusCode !== 200) {
        console.log('   ⚠️  Service may not be running - this is expected due to compilation errors');
      }
    } catch (error) {
      console.log('   Status: ❌ Service not accessible');
      console.log('   ⚠️  This is expected due to TypeScript compilation errors in the service');
    }

    console.log('\n🧪 Test 2: Basic Course Creation');
    const basicCourseData = {
      code: 'CS101',
      title: '计算机科学基础',
      description: '这是一门计算机科学入门课程',
      gradeBand: 'G9',
      subject: '计算机科学',
      deliveryMode: 'HYBRID',
      estimatedHours: 48,
      creditHours: 3
    };

    try {
      const createResponse = await makeRequest('POST', '/courses', basicCourseData);
      console.log(`   Status: ${createResponse.statusCode === 201 ? '✅' : '❌'} (${createResponse.statusCode})`);
      if (createResponse.statusCode === 201) {
        console.log('   Response: ✅ Course created successfully');
        console.log(`   Course ID: ${createResponse.body.id}`);
      } else {
        console.log(`   Error: ${JSON.stringify(createResponse.body)}`);
      }
    } catch (error) {
      console.log('   Status: ❌ Request failed');
      console.log(`   Error: ${error.message}`);
    }

    console.log('\n🧪 Test 3: Course Creation with Content');
    const courseWithContentData = {
      ...basicCourseData,
      code: 'CS102',
      title: '高级算法设计',
      version: '1.0.0',
      aclContent: {
        title: '高级算法设计课程',
        description: '深入学习高级算法和数据结构',
        modules: [
          {
            id: 'intro-module',
            title: '课程介绍',
            activities: [
              {
                id: 'intro-activity',
                title: '欢迎学习',
                type: 'intro'
              }
            ]
          }
        ]
      },
      modules: [
        {
          title: '高级排序算法',
          description: '学习快速排序、归并排序等高级算法',
          type: 'KNOWLEDGE',
          estimatedMinutes: 120,
          isRequired: true,
          hasPrerequisites: false,
          activities: [
            {
              title: '快速排序实现',
              description: '实现快速排序算法',
              type: 'PRACTICE',
              content: '快速排序是一种分治算法...',
              estimatedMinutes: 60,
              isRequired: true,
              isGraded: true,
              maxScore: 100
            }
          ]
        }
      ],
      versionMetadata: {
        changelog: '初始版本',
        breakingChanges: false
      }
    };

    try {
      const createWithContentResponse = await makeRequest('POST', '/courses/with-content', courseWithContentData);
      console.log(`   Status: ${createWithContentResponse.statusCode === 201 ? '✅' : '❌'} (${createWithContentResponse.statusCode})`);
      if (createWithContentResponse.statusCode === 201) {
        console.log('   Response: ✅ Course with content created successfully');
        console.log(`   Course ID: ${createWithContentResponse.body.course?.id}`);
        console.log(`   Version ID: ${createWithContentResponse.body.versionId}`);
        console.log(`   Modules created: ${courseWithContentData.modules.length}`);
        console.log(`   Activities created: ${courseWithContentData.modules.reduce((sum, m) => sum + (m.activities?.length || 0), 0)}`);
      } else {
        console.log(`   Error: ${JSON.stringify(createWithContentResponse.body)}`);
      }
    } catch (error) {
      console.log('   Status: ❌ Request failed');
      console.log(`   Error: ${error.message}`);
    }

    console.log('\n🧪 Test 4: Course List');
    try {
      const listResponse = await makeRequest('GET', '/courses');
      console.log(`   Status: ${listResponse.statusCode === 200 ? '✅' : '❌'} (${listResponse.statusCode})`);
      if (listResponse.statusCode === 200) {
        console.log(`   Total courses: ${listResponse.body.total || 0}`);
        console.log(`   Page: ${listResponse.body.page || 1}`);
        console.log(`   Limit: ${listResponse.body.limit || 20}`);
      }
    } catch (error) {
      console.log('   Status: ❌ Request failed');
      console.log(`   Error: ${error.message}`);
    }

    console.log('\n🧪 Test 5: Course Stats');
    try {
      const statsResponse = await makeRequest('GET', '/courses/stats');
      console.log(`   Status: ${statsResponse.statusCode === 200 ? '✅' : '❌'} (${statsResponse.statusCode})`);
      if (statsResponse.statusCode === 200) {
        console.log('   Response: ✅ Stats retrieved successfully');
        console.log(`   Total courses: ${statsResponse.body.totalCourses || 0}`);
        console.log(`   Published courses: ${statsResponse.body.publishedCourses || 0}`);
        console.log(`   Draft courses: ${statsResponse.body.draftCourses || 0}`);
      }
    } catch (error) {
      console.log('   Status: ❌ Request failed');
      console.log(`   Error: ${error.message}`);
    }

  } catch (error) {
    console.error('❌ Test suite failed:', error.message);
  }
}

// Run the tests
testEndpoints().then(() => {
  console.log('\n🏁 API Endpoint Testing Complete');
  console.log('==================================');
  console.log('\n📝 Note: Some tests may fail due to:');
  console.log('   • TypeScript compilation errors in the service');
  console.log('   • Database connection requirements');
  console.log('   • Authentication/authorization not mocked');
  console.log('   • Service not running on port 3001');
  console.log('\n🔧 To run tests successfully:');
  console.log('   1. Fix TypeScript compilation errors');
  console.log('   2. Start database service');
  console.log('   3. Start course service on port 3001');
  console.log('   4. Update authentication mocking');
}).catch(console.error);