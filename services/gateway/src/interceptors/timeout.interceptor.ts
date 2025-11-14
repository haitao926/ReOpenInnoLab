import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  RequestTimeoutException
} from '@nestjs/common'
import { Observable, throwError, TimeoutError } from 'rxjs'
import { catchError, timeout } from 'rxjs/operators'

@Injectable()
export class TimeoutInterceptor implements NestInterceptor {
  private readonly defaultTimeout = 30000 // 30 seconds

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest()
    const timeoutValue = request.headers['x-timeout']
      ? parseInt(request.headers['x-timeout'], 10)
      : this.defaultTimeout

    return next.handle().pipe(
      timeout(timeoutValue),
      catchError(err => {
        if (err instanceof TimeoutError) {
          throw new RequestTimeoutException(`Request timeout after ${timeoutValue}ms`)
        }
        return throwError(() => err)
      })
    )
  }
}