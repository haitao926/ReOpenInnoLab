import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger
} from '@nestjs/common'
import { Request, Response } from 'express'

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name)

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp()
    const response = ctx.getResponse<Response>()
    const request = ctx.getRequest<Request>()

    let status: HttpStatus
    let message: string
    let details: any = {}

    if (exception instanceof HttpException) {
      status = exception.getStatus()
      const exceptionResponse = exception.getResponse()

      if (typeof exceptionResponse === 'string') {
        message = exceptionResponse
      } else if (typeof exceptionResponse === 'object') {
        message = (exceptionResponse as any).message || exception.message
        details = (exceptionResponse as any).details || {}
      }
    } else if (exception instanceof Error) {
      status = HttpStatus.INTERNAL_SERVER_ERROR
      message = exception.message
      details = { stack: exception.stack }
    } else {
      status = HttpStatus.INTERNAL_SERVER_ERROR
      message = 'Internal server error'
      details = { originalError: exception }
    }

    // 记录错误日志
    this.logger.error(
      `${request.method} ${request.url} - Status: ${status} - Message: ${message}`,
      exception instanceof Error ? exception.stack : exception
    )

    // 构建错误响应
    const errorResponse = {
      success: false,
      error: {
        code: this.getErrorCode(status),
        message,
        ...(process.env.NODE_ENV === 'development' && { details })
      },
      timestamp: new Date().toISOString(),
      path: request.url,
      method: request.method
    }

    response.status(status).json(errorResponse)
  }

  private getErrorCode(status: HttpStatus): string {
    const errorCodeMap = {
      [HttpStatus.BAD_REQUEST]: 'BAD_REQUEST',
      [HttpStatus.UNAUTHORIZED]: 'UNAUTHORIZED',
      [HttpStatus.FORBIDDEN]: 'FORBIDDEN',
      [HttpStatus.NOT_FOUND]: 'NOT_FOUND',
      [HttpStatus.CONFLICT]: 'CONFLICT',
      [HttpStatus.TOO_MANY_REQUESTS]: 'TOO_MANY_REQUESTS',
      [HttpStatus.INTERNAL_SERVER_ERROR]: 'INTERNAL_SERVER_ERROR',
      [HttpStatus.BAD_GATEWAY]: 'BAD_GATEWAY',
      [HttpStatus.SERVICE_UNAVAILABLE]: 'SERVICE_UNAVAILABLE'
    }

    return errorCodeMap[status] || 'UNKNOWN_ERROR'
  }
}