import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
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
    let message: string | object
    let error: string
    let details: any = {}

    if (exception instanceof HttpException) {
      status = exception.getStatus()
      const exceptionResponse = exception.getResponse()

      if (typeof exceptionResponse === 'string') {
        message = exceptionResponse
        error = exception.constructor.name
      } else {
        message = (exceptionResponse as any).message || exception.message
        error = (exceptionResponse as any).error || exception.constructor.name
        details = (exceptionResponse as any).details || {}
      }
    } else {
      status = HttpStatus.INTERNAL_SERVER_ERROR
      message = 'Internal server error'
      error = 'InternalServerError'

      // Log unexpected errors
      this.logger.error(
        `Unhandled exception: ${exception}`,
        (exception as Error).stack,
      )
    }

    // Log error details
    const logData = {
      method: request.method,
      url: request.url,
      status,
      error,
      message,
      details,
      userAgent: request.get('User-Agent'),
      ip: request.ip,
      tenantId: request.headers['x-tenant-id'],
      userId: request.headers['x-user-id'],
      timestamp: new Date().toISOString(),
    }

    if (status >= 500) {
      this.logger.error(JSON.stringify(logData, null, 2))
    } else if (status >= 400) {
      this.logger.warn(JSON.stringify(logData, null, 2))
    }

    // Build error response
    const errorResponse = {
      success: false,
      statusCode: status,
      error,
      message,
      path: request.url,
      method: request.method,
      timestamp: new Date().toISOString(),
      ...(Object.keys(details).length > 0 && { details }),
      // Include request ID for tracking
      requestId: request.headers['x-request-id'] || this.generateRequestId(),
    }

    // In development, include stack trace for errors
    if (process.env.NODE_ENV === 'development' && exception instanceof Error) {
      errorResponse['stack'] = exception.stack
    }

    response.status(status).json(errorResponse)
  }

  private generateRequestId(): string {
    return Math.random().toString(36).substring(2, 15) +
           Math.random().toString(36).substring(2, 15)
  }
}