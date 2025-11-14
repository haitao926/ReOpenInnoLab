import { Injectable, Logger } from '@nestjs/common'
import { HttpService } from '@nestjs/axios'
import { firstValueFrom } from 'rxjs'
import { AxiosRequestConfig, AxiosResponse } from 'axios'

export interface ServiceConfig {
  name: string
  baseUrl: string
  timeout: number
  retries: number
}

@Injectable()
export class AdminService {
  private readonly logger = new Logger(AdminService.name)

  private readonly services: Record<string, ServiceConfig> = {
    'identity-service': {
      name: 'Identity Service',
      baseUrl: process.env.IDENTITY_SERVICE_URL || 'http://localhost:3001',
      timeout: 30000,
      retries: 3
    },
    'course-service': {
      name: 'Course Service',
      baseUrl: process.env.COURSE_SERVICE_URL || 'http://localhost:3002',
      timeout: 30000,
      retries: 3
    },
    'classroom-service': {
      name: 'Classroom Service',
      baseUrl: process.env.CLASSROOM_SERVICE_URL || 'http://localhost:3004',
      timeout: 30000,
      retries: 3
    },
    'lab-service': {
      name: 'Lab Service',
      baseUrl: process.env.LAB_SERVICE_URL || 'http://localhost:3005',
      timeout: 30000,
      retries: 3
    },
    'ai-service': {
      name: 'AI Service',
      baseUrl: process.env.AI_SERVICE_URL || 'http://localhost:3006',
      timeout: 45000,
      retries: 2
    }
  }

  constructor(private readonly httpService: HttpService) {}

  async proxyToService(
    serviceName: string,
    path: string,
    method: 'GET' | 'POST' | 'PUT' | 'DELETE' = 'GET',
    data?: any,
    params?: any,
    user?: any
  ): Promise<any> {
    const service = this.services[serviceName]
    if (!service) {
      throw new Error(`Service ${serviceName} not found`)
    }

    const url = `${service.baseUrl}${path}`

    const config: AxiosRequestConfig = {
      method,
      url,
      timeout: service.timeout,
      params,
      headers: {
        'Content-Type': 'application/json',
        'X-Admin-User': user?.sub || user?.id,
        'X-Admin-Role': user?.role,
        'X-Request-ID': this.generateRequestId(),
        'X-Forwarded-For': 'admin-gateway'
      }
    }

    if (data && method !== 'GET') {
      config.data = data
    }

    try {
      this.logger.debug(`Proxying ${method} ${url} for user ${user?.sub}`)

      const response = await firstValueFrom(
        this.httpService.request(config)
      )

      this.logger.log(`Successfully proxied ${method} ${path} to ${serviceName}`)
      return response.data

    } catch (error: any) {
      this.logger.error(
        `Failed to proxy ${method} ${path} to ${serviceName}: ${error.message}`,
        error.stack
      )

      throw this.handleError(error, serviceName)
    }
  }

  async getSystemHealth(): Promise<any> {
    const healthChecks = await Promise.allSettled(
      Object.entries(this.services).map(async ([name, config]) => {
        try {
          const start = Date.now()
          const response = await firstValueFrom(
            this.httpService.get(`${config.baseUrl}/health`, {
              timeout: 5000,
              headers: { 'X-Health-Check': 'true' }
            })
          )
          const duration = Date.now() - start

          return {
            service: name,
            status: 'healthy',
            responseTime: duration,
            details: response.data
          }
        } catch (error: any) {
          return {
            service: name,
            status: 'unhealthy',
            error: error.message,
            responseTime: -1
          }
        }
      })
    )

    const results = healthChecks.map(result =>
      result.status === 'fulfilled' ? result.value : result.reason
    )

    const overallStatus = results.every(r => r.status === 'healthy') ? 'healthy' : 'degraded'

    return {
      status: overallStatus,
      timestamp: new Date().toISOString(),
      services: results,
      gateway: {
        status: 'healthy',
        uptime: process.uptime(),
        memory: process.memoryUsage(),
        version: process.env.npm_package_version || '1.0.0'
      }
    }
  }

  async getSystemMetrics(query: any): Promise<any> {
    const timeRange = query.range || '1h'

    // Collect metrics from all services
    const serviceMetrics = await Promise.allSettled(
      Object.entries(this.services).map(async ([name]) => {
        try {
          const response = await this.proxyToService(name, `/metrics?range=${timeRange}`, 'GET')
          return { service: name, metrics: response }
        } catch (error) {
          return { service: name, error: error.message }
        }
      })
    )

    return {
      timeRange,
      timestamp: new Date().toISOString(),
      services: serviceMetrics.map(result =>
        result.status === 'fulfilled' ? result.value : result.reason
      ),
      gateway: {
        requests: this.getGatewayMetrics(),
        performance: this.getPerformanceMetrics()
      }
    }
  }

  async getDashboardStats(): Promise<any> {
    try {
      // Get stats from multiple services in parallel
      const [tenantStats, userStats, courseStats] = await Promise.allSettled([
        this.proxyToService('identity-service', '/admin/stats/tenants', 'GET'),
        this.proxyToService('identity-service', '/admin/stats/users', 'GET'),
        this.proxyToService('course-service', '/admin/stats/courses', 'GET')
      ])

      return {
        tenants: tenantStats.status === 'fulfilled' ? tenantStats.value : { total: 0, active: 0 },
        users: userStats.status === 'fulfilled' ? userStats.value : { total: 0, active: 0 },
        courses: courseStats.status === 'fulfilled' ? courseStats.value : { total: 0, published: 0 },
        system: {
          health: 'healthy',
          uptime: process.uptime(),
          lastUpdated: new Date().toISOString()
        }
      }
    } catch (error) {
      this.logger.error('Failed to get dashboard stats', error)
      throw error
    }
  }

  private handleError(error: any, serviceName: string): any {
    if (error.response) {
      // The request was made and the server responded with a status code
      // that falls out of the range of 2xx
      const status = error.response.status
      const message = error.response.data?.message || error.message

      return {
        status,
        message: `${serviceName} error: ${message}`,
        service: serviceName,
        timestamp: new Date().toISOString()
      }
    } else if (error.request) {
      // The request was made but no response was received
      return {
        status: 503,
        message: `${serviceName} is unavailable`,
        service: serviceName,
        timestamp: new Date().toISOString()
      }
    } else {
      // Something happened in setting up the request that triggered an Error
      return {
        status: 500,
        message: `Gateway error: ${error.message}`,
        service: 'gateway',
        timestamp: new Date().toISOString()
      }
    }
  }

  private generateRequestId(): string {
    return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  private getGatewayMetrics(): any {
    // This would typically come from a metrics collection system
    // For now, return mock data
    return {
      total: Math.floor(Math.random() * 10000),
      success: Math.floor(Math.random() * 9500),
      errors: Math.floor(Math.random() * 500),
      averageResponseTime: Math.floor(Math.random() * 200) + 50
    }
  }

  private getPerformanceMetrics(): any {
    const memUsage = process.memoryUsage()
    return {
      memory: {
        used: memUsage.heapUsed,
        total: memUsage.heapTotal,
        external: memUsage.external,
        rss: memUsage.rss
      },
      cpu: {
        usage: process.cpuUsage(),
        loadAverage: require('os').loadavg()
      },
      uptime: process.uptime()
    }
  }
}