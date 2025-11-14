import { Controller, Get, Post, Put, Delete, Patch, Param, Body, Query, Res, Req, Headers } from '@nestjs/common'
import { ApiTags, ApiOperation } from '@nestjs/swagger'
import { Response, Request } from 'express'
import { ProxyService } from './proxy.service'

@ApiTags('Proxy')
@Controller('proxy')
export class ProxyController {
  constructor(private readonly proxyService: ProxyService) {}

  @Get(':service/*')
  @ApiOperation({ summary: 'Proxy GET requests to microservices' })
  async proxyGet(
    @Param('service') service: string,
    @Param() params: any,
    @Query() query: any,
    @Req() req: Request,
    @Res() res: Response,
    @Headers() headers: any
  ) {
    return this.proxyService.proxyRequest('GET', service, params[0], query, null, headers, req, res)
  }

  @Post(':service/*')
  @ApiOperation({ summary: 'Proxy POST requests to microservices' })
  async proxyPost(
    @Param('service') service: string,
    @Param() params: any,
    @Body() body: any,
    @Query() query: any,
    @Req() req: Request,
    @Res() res: Response,
    @Headers() headers: any
  ) {
    return this.proxyService.proxyRequest('POST', service, params[0], query, body, headers, req, res)
  }

  @Put(':service/*')
  @ApiOperation({ summary: 'Proxy PUT requests to microservices' })
  async proxyPut(
    @Param('service') service: string,
    @Param() params: any,
    @Body() body: any,
    @Query() query: any,
    @Req() req: Request,
    @Res() res: Response,
    @Headers() headers: any
  ) {
    return this.proxyService.proxyRequest('PUT', service, params[0], query, body, headers, req, res)
  }

  @Delete(':service/*')
  @ApiOperation({ summary: 'Proxy DELETE requests to microservices' })
  async proxyDelete(
    @Param('service') service: string,
    @Param() params: any,
    @Query() query: any,
    @Req() req: Request,
    @Res() res: Response,
    @Headers() headers: any
  ) {
    return this.proxyService.proxyRequest('DELETE', service, params[0], query, null, headers, req, res)
  }

  @Patch(':service/*')
  @ApiOperation({ summary: 'Proxy PATCH requests to microservices' })
  async proxyPatch(
    @Param('service') service: string,
    @Param() params: any,
    @Body() body: any,
    @Query() query: any,
    @Req() req: Request,
    @Res() res: Response,
    @Headers() headers: any
  ) {
    return this.proxyService.proxyRequest('PATCH', service, params[0], query, body, headers, req, res)
  }
}