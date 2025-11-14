import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger
} from '@nestjs/common'
import { Observable } from 'rxjs'
import { map } from 'rxjs/operators'

export interface Response<T> {
  success: boolean
  data?: T
  error?: {
    code: string
    message: string
    details?: any
  }
  timestamp: string
  requestId?: string
}

@Injectable()
export class ResponseInterceptor<T> implements NestInterceptor<T, Response<T>> {
  private readonly logger = new Logger(ResponseInterceptor.name)

  intercept(context: ExecutionContext, next: CallHandler): Observable<Response<T>> {
    const request = context.switchToHttp().getRequest()
    const requestId = this.generateRequestId()
    const startTime = Date.now()

    // 将 requestId 添加到请求对象中，以便后续使用
    request.requestId = requestId

    return next.handle().pipe(
      map((data) => {
        const endTime = Date.now()
        const processingTime = endTime - startTime

        // 如果返回的数据已经是标准格式，直接返回
        if (data && typeof data === 'object' && 'success' in data) {
          return {
            ...data,
            timestamp: new Date().toISOString(),
            requestId,
            processingTime
          }
        }

        // 包装为标准响应格式
        return {
          success: true,
          data,
          timestamp: new Date().toISOString(),
          requestId,
          processingTime
        }
      })
    )
  }

  private generateRequestId(): string {
    return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }
}