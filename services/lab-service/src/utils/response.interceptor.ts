import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common'
import { Observable } from 'rxjs'
import { map } from 'rxjs/operators'
import { Request } from 'express'

export interface Response<T> {
  success: boolean
  statusCode: number
  data?: T
  message?: string
  meta?: {
    timestamp: string
    path: string
    method: string
    requestId?: string
    pagination?: {
      page: number
      limit: number
      total: number
      totalPages: number
      hasNext: boolean
      hasPrev: boolean
    }
    duration?: number
  }
}

@Injectable()
export class ResponseInterceptor<T> implements NestInterceptor<T, Response<T>> {
  intercept(context: ExecutionContext, next: CallHandler): Observable<Response<T>> {
    const request = context.switchToHttp().getRequest<Request>()
    const startTime = Date.now()

    return next.handle().pipe(
      map((data) => {
        const duration = Date.now() - startTime
        const requestId = request.headers['x-request-id'] || this.generateRequestId()

        // Handle different response formats
        let response_data: any
        let message: string

        if (data && typeof data === 'object') {
          // If data already has the expected structure, use it as is
          if ('data' in data || 'items' in data || 'total' in data) {
            response_data = data.data || data.items || data
            message = data.message || 'Success'

            // Extract pagination if present
            const pagination = data.pagination || data.meta?.pagination
            if (pagination) {
              return {
                success: true,
                statusCode: 200,
                data: response_data,
                message,
                meta: {
                  timestamp: new Date().toISOString(),
                  path: request.url,
                  method: request.method,
                  requestId,
                  pagination,
                  duration,
                },
              }
            }
          } else {
            response_data = data
            message = 'Success'
          }
        } else {
          response_data = data
          message = 'Success'
        }

        return {
          success: true,
          statusCode: 200,
          data: response_data,
          message,
          meta: {
            timestamp: new Date().toISOString(),
            path: request.url,
            method: request.method,
            requestId,
            duration,
          },
        }
      }),
    )
  }

  private generateRequestId(): string {
    return Math.random().toString(36).substring(2, 15) +
           Math.random().toString(36).substring(2, 15)
  }
}