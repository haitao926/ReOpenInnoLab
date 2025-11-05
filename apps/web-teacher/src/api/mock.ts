// 开发环境 Mock API
import type { LoginRequest, RegisterRequest, User, AuthResponse } from '@/types/user'

// 模拟用户数据
const mockUsers: User[] = [
  {
    id: '1',
    username: 'admin',
    email: 'admin@reopeninno.lab',
    name: '管理员',
    role: 'admin',
    avatar: '',
    school: '开源浦育实验学校',
    subject: '计算机科学',
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z'
  },
  {
    id: '2',
    username: 'teacher',
    email: 'teacher@reopeninno.lab',
    name: '张老师',
    role: 'teacher',
    avatar: '',
    school: '开源浦育实验学校',
    subject: '数学',
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z'
  }
]

// 模拟延迟
const delay = (ms: number = 1000) => new Promise(resolve => setTimeout(resolve, ms))

// Mock API
export const mockApi = {
  // 登录
  login: async (credentials: LoginRequest) => {
    await delay(1000)

    const user = mockUsers.find(u =>
      u.username === credentials.username || u.email === credentials.username
    )

    if (!user || credentials.password !== '123456') {
      throw new Error('用户名或密码错误')
    }

    return {
      data: {
        access_token: 'mock_token_' + Date.now(),
        user,
        permissions: user.role === 'admin' ? ['*'] : ['course:read', 'course:create', 'student:read']
      }
    }
  },

  // 获取用户信息
  getUserInfo: async () => {
    await delay(500)
    return {
      data: {
        user: mockUsers[0],
        permissions: mockUsers[0].role === 'admin' ? ['*'] : ['course:read', 'course:create', 'student:read']
      }
    }
  },

  // 注册
  register: async (userData: RegisterRequest) => {
    await delay(1000)

    // 检查用户名是否已存在
    if (mockUsers.find(u => u.username === userData.username || u.email === userData.email)) {
      throw new Error('用户名或邮箱已存在')
    }

    const newUser: User = {
      id: String(mockUsers.length + 1),
      username: userData.username,
      email: userData.email,
      name: userData.name,
      role: 'teacher',
      avatar: '',
      school: userData.school || '',
      subject: userData.subject || '',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }

    mockUsers.push(newUser)

    return {
      data: {
        message: '注册成功',
        user: newUser
      }
    }
  }
}

export default mockApi