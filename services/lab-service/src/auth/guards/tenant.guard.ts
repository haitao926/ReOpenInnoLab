import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common'
import { Reflector } from '@nestjs/core'
import { ConfigService } from '@nestjs/config'

@Injectable()
export class TenantGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private configService: ConfigService
  ) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest()
    const tenantId = request.headers['x-tenant-id']

    // In development, allow requests without tenant ID
    if (this.configService.get('NODE_ENV') === 'development' && !tenantId) {
      request.tenant = { id: 'dev-tenant' }
      return true
    }

    if (!tenantId) {
      return false
    }

    // Attach tenant to request
    request.tenant = { id: tenantId }
    return true
  }
}