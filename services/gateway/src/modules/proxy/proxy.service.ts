import { Injectable, Logger } from '@nestjs/common'
import { HttpService } from '@nestjs/axios'
import { firstValueFrom } from 'rxjs'
import { Response, Request } from 'express'
import { AxiosRequestConfig, AxiosResponse } from 'axios'

@Injectable()
export class ProxyService {
  private readonly logger = new Logger(ProxyService.name)

  private readonly serviceUrls: Record<string, string> = {
    'identity': process.env.IDENTITY_SERVICE_URL || 'http://localhost:3001',
    'course': process.env.COURSE_SERVICE_URL || 'http://localhost:3002',
    'classroom': process.env.CLASSROOM_SERVICE_URL || 'http://localhost:3004',
    'lab': process.env.LAB_SERVICE_URL || 'http://localhost:3005',
    'ai': process.env.AI_SERVICE_URL || 'http://localhost:3006',
    'assignment': process.env.ASSIGNMENT_SERVICE_URL || 'http://localhost:3007'
  }

  constructor(private readonly httpService: HttpService) {}

  async proxyRequest(
    method: string,
    serviceName: string,
    path: string,
    query: any,
    body: any,
    headers: any,
    req: Request,
    res: Response
  ) {
    const serviceUrl = this.serviceUrls[serviceName]

    if (!serviceUrl) {
      return res.status(404).json({
        error: 'Service not found',
        service: serviceName
      })
    }

    const url = `${serviceUrl}/${path}`

    // Prepare headers for forwarding
    const forwardHeaders = { ...headers }

    // Remove headers that shouldn't be forwarded
    delete forwardHeaders['host']
    delete forwardHeaders['content-length']
    delete forwardHeaders['authorization'] // Will be set from JWT token

    // Add user context if available
    if (req.user) {
      forwardHeaders['x-user-id'] = req.user.sub
      forwardHeaders['x-user-roles'] = JSON.stringify(req.user.roles || [])
      forwardHeaders['x-user-permissions'] = JSON.stringify(req.user.permissions || [])
    }

    // Add gateway tracking headers
    forwardHeaders['x-gateway-request-id'] = this.generateRequestId()
    forwardHeaders['x-gateway-timestamp'] = new Date().toISOString()
    forwardHeaders['x-forwarded-for'] = req.ip || req.connection.remoteAddress
    forwardHeaders['x-forwarded-proto'] = req.protocol
    forwardHeaders['x-forwarded-host'] = req.get('host')

    const config: AxiosRequestConfig = {
      method,
      url,
      headers: forwardHeaders,
      params: query,
      responseType: 'stream',
      timeout: 30000
    }

    if (body && method !== 'GET') {
      config.data = body
    }

    try {
      this.logger.debug(`Proxying ${method} ${url}`)

      const response = await firstValueFrom(
        this.httpService.request(config)
      )

      // Forward response headers
      Object.entries(response.headers).forEach(([key, value]) => {
        if (Array.isArray(value)) {
          res.set(key, value.join(', '))
        } else {
          res.set(key, value as string)
        }
      })

      // Forward status code
      res.status(response.status)

      // Pipe the response body
      response.data.pipe(res)

    } catch (error: any) {
      this.logger.error(`Proxy error for ${method} ${url}: ${error.message}`, error.stack)

      if (error.response) {
        // Forward error response from service
        res.status(error.response.status)

        Object.entries(error.response.headers).forEach(([key, value]) => {
          res.set(key, value as string)
        })

        error.response.data.pipe(res)
      } else if (error.code === 'ECONNABORTED') {
        res.status(504).json({
          error: 'Gateway Timeout',
          message: 'Service request timed out'
        })
      } else {
        res.status(502).json({
          error: 'Bad Gateway',
          message: 'Service unavailable'
        })
      }
    }
  }

  private generateRequestId(): string {
    return `gw_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }
}