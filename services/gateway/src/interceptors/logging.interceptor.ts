import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger
} from '@nestjs/common'
import { Observable } from 'rxjs'
import { tap } from 'rxjs/operators'

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger(LoggingInterceptor.name)

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest()
    const { method, url, ip, headers } = request
    const userAgent = headers['user-agent'] || ''
    const startTime = Date.now()

    const requestId = headers['x-request-id'] || this.generateRequestId()

    // Add request ID to request for downstream services
    request.requestId = requestId

    this.logger.log(
      `[${requestId}] ${method} ${url} - ${ip} - ${userAgent}`
    )

    return next.handle().pipe(
      tap({
        next: (data) => {
          const duration = Date.now() - startTime
          const response = context.switchToHttp().getResponse()
          const statusCode = response.statusCode

          this.logger.log(
            `[${requestId}] ${method} ${url} - ${statusCode} - ${duration}ms`
          )
        },
        error: (error) => {
          const duration = Date.now() - startTime
          this.logger.error(
            `[${requestId}] ${method} ${url} - ERROR - ${duration}ms - ${error.message}`,
            error.stack
          )
        }
      })
    )
  }

  private generateRequestId(): string {
    return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }
}