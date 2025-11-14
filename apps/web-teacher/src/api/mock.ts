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
  login: async (credentials: LoginRequest): Promise<AuthResponse> => {
    await delay(1000)

    console.log('Mock API - Login attempt:', credentials)
    console.log('Mock API - Available users:', mockUsers.map(u => ({ username: u.username, email: u.email })))

    console.log('Mock API - Checking user lookup with credentials structure:')
    console.log('  - credentials object keys:', Object.keys(credentials))
    console.log('  - credentials.username:', JSON.stringify(credentials.username))
    console.log('  - credentials.email:', JSON.stringify(credentials.email))
    console.log('  - typeof username:', typeof credentials.username)
    console.log('  - typeof email:', typeof credentials.email)
    console.log('  - username length:', credentials.username ? credentials.username.length : 'N/A')
    console.log('  - username trimmed:', credentials.username ? credentials.username.trim() : 'N/A')

    // Log each mock user for comparison
    mockUsers.forEach((user, index) => {
      console.log(`Mock user ${index}:`, {
        username: user.username,
        email: user.email
      })
    })

    // Normalize and validate the username
    const normalizedUsername = credentials.username ? credentials.username.trim() : ''
    const normalizedEmail = credentials.email ? credentials.email.trim() : ''

    console.log('Mock API - Normalized values:')
    console.log('  - normalizedUsername:', JSON.stringify(normalizedUsername))
    console.log('  - normalizedEmail:', JSON.stringify(normalizedEmail))

    // Check both username and email fields, also check credentials.email as fallback
    const user = mockUsers.find(u => {
      const matches = u.username === normalizedUsername ||
                    u.email === normalizedUsername ||
                    u.username === normalizedEmail ||
                    u.email === normalizedEmail

      if (matches) {
        console.log('Mock API - Found matching user:', u)
        console.log('Match reason:')
        if (u.username === normalizedUsername) console.log('  - username matches normalizedUsername')
        if (u.email === normalizedUsername) console.log('  - email matches normalizedUsername')
        if (u.username === normalizedEmail) console.log('  - username matches normalizedEmail')
        if (u.email === normalizedEmail) console.log('  - email matches normalizedEmail')
      }

      return matches
    })

    console.log('Mock API - Final found user:', user)

    if (!user) {
      console.log('Mock API - User not found')
      throw new Error('用户不存在')
    }

    if (credentials.password !== '123456') {
      console.log('Mock API - Password mismatch')
      throw new Error('密码错误，请使用密码: 123456')
    }

    const permissions = user.role === 'admin' ? ['*'] : ['course:read', 'course:create', 'student:read']
    const normalizedUser: User = {
      id: user.id,
      username: user.username,
      email: user.email,
      name: user.name,
      role: user.role,
      avatar: user.avatar,
      permissions
    }

    return {
      user: normalizedUser,
      accessToken: 'mock_token_' + Date.now(),
      refreshToken: 'mock_refresh_' + Date.now(),
      expiresIn: new Date(Date.now() + 3600 * 1000).toISOString(),
      permissions
    }
  },

  // 获取用户信息
  getUserInfo: async (): Promise<{ user: User; permissions: string[] }> => {
    await delay(500)
    const permissions = mockUsers[0].role === 'admin' ? ['*'] : ['course:read', 'course:create', 'student:read']

    return {
      user: {
        id: mockUsers[0].id,
        username: mockUsers[0].username,
        email: mockUsers[0].email,
        name: mockUsers[0].name,
        role: mockUsers[0].role,
        avatar: mockUsers[0].avatar,
        permissions
      },
      permissions
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
