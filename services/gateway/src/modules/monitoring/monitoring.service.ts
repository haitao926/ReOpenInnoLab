import { Injectable, Logger } from '@nestjs/common'

interface MetricData {
  name: string
  value: number
  tags?: Record<string, string>
  timestamp?: number
}

interface ErrorData {
  message: string
  stack?: string
  url?: string
  userAgent?: string
  userId?: string
  timestamp?: number
}

@Injectable()
export class MonitoringService {
  private readonly logger = new Logger(MonitoringService.name)

  private metrics: MetricData[] = []
  private errors: ErrorData[] = []
  private requestCounts = new Map<string, number>()
  private responseTimes = new Map<string, number[]>()

  constructor() {
    // Clean up old data periodically
    setInterval(() => this.cleanupOldData(), 60000) // Every minute
  }

  getHealthStatus() {
    const uptime = process.uptime()
    const memoryUsage = process.memoryUsage()

    return {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime,
      memory: {
        used: memoryUsage.heapUsed,
        total: memoryUsage.heapTotal,
        external: memoryUsage.external,
        rss: memoryUsage.rss
      },
      version: process.env.npm_package_version || '1.0.0',
      environment: process.env.NODE_ENV || 'development'
    }
  }

  getMetrics(query: any) {
    const timeRange = query.range || '1h'
    const now = Date.now()
    let startTime = now

    switch (timeRange) {
      case '1h':
        startTime = now - 60 * 60 * 1000
        break
      case '24h':
        startTime = now - 24 * 60 * 60 * 1000
        break
      case '7d':
        startTime = now - 7 * 24 * 60 * 60 * 1000
        break
    }

    const filteredMetrics = this.metrics.filter(m =>
      (m.timestamp || now) >= startTime
    )

    return {
      timeRange,
      startTime: new Date(startTime).toISOString(),
      endTime: new Date(now).toISOString(),
      metrics: filteredMetrics,
      requestCounts: Object.fromEntries(this.requestCounts),
      averageResponseTimes: this.calculateAverageResponseTimes(),
      summary: this.generateMetricsSummary(filteredMetrics)
    }
  }

  recordMetric(metricData: MetricData, headers: any) {
    const metric: MetricData = {
      ...metricData,
      timestamp: metricData.timestamp || Date.now(),
      tags: {
        ...metricData.tags,
        source: this.extractSource(headers),
        userAgent: headers['user-agent']
      }
    }

    this.metrics.push(metric)

    // Keep only last 1000 metrics
    if (this.metrics.length > 1000) {
      this.metrics = this.metrics.slice(-1000)
    }

    this.logger.debug(`Recorded metric: ${metric.name} = ${metric.value}`)

    return { success: true, id: this.generateMetricId() }
  }

  recordError(errorData: ErrorData, headers: any) {
    const error: ErrorData = {
      ...errorData,
      timestamp: errorData.timestamp || Date.now(),
      userAgent: headers['user-agent']
    }

    this.errors.push(error)

    // Keep only last 500 errors
    if (this.errors.length > 500) {
      this.errors = this.errors.slice(-500)
    }

    this.logger.error(`Recorded error: ${error.message}`, error.stack)

    // In a real implementation, you might send this to an error tracking service
    return { success: true, id: this.generateErrorId() }
  }

  getStats(query: any) {
    const uptime = process.uptime()
    const memoryUsage = process.memoryUsage()

    return {
      uptime,
      memory: memoryUsage,
      metrics: {
        total: this.metrics.length,
        recent: this.metrics.filter(m => (Date.now() - (m.timestamp || 0)) < 60000).length
      },
      errors: {
        total: this.errors.length,
        recent: this.errors.filter(e => (Date.now() - (e.timestamp || 0)) < 60000).length
      },
      requests: Object.fromEntries(this.requestCounts),
      performance: this.calculateAverageResponseTimes()
    }
  }

  incrementRequestCount(endpoint: string) {
    const current = this.requestCounts.get(endpoint) || 0
    this.requestCounts.set(endpoint, current + 1)
  }

  recordResponseTime(endpoint: string, time: number) {
    if (!this.responseTimes.has(endpoint)) {
      this.responseTimes.set(endpoint, [])
    }

    const times = this.responseTimes.get(endpoint)!
    times.push(time)

    // Keep only last 100 response times per endpoint
    if (times.length > 100) {
      this.responseTimes.set(endpoint, times.slice(-100))
    }
  }

  private cleanupOldData() {
    const now = Date.now()
    const cutoff = now - 24 * 60 * 60 * 1000 // 24 hours

    this.metrics = this.metrics.filter(m => (m.timestamp || now) >= cutoff)
    this.errors = this.errors.filter(e => (e.timestamp || now) >= cutoff)
  }

  private extractSource(headers: any): string {
    const userAgent = headers['user-agent'] || ''
    if (userAgent.includes('Mozilla')) return 'browser'
    if (userAgent.includes('axios') || userAgent.includes('node-fetch')) return 'api_client'
    return 'unknown'
  }

  private calculateAverageResponseTimes(): Record<string, number> {
    const result: Record<string, number> = {}

    for (const [endpoint, times] of this.responseTimes.entries()) {
      if (times.length > 0) {
        const sum = times.reduce((a, b) => a + b, 0)
        result[endpoint] = Math.round(sum / times.length)
      }
    }

    return result
  }

  private generateMetricsSummary(metrics: MetricData[]) {
    const summary: Record<string, any> = {}

    for (const metric of metrics) {
      if (!summary[metric.name]) {
        summary[metric.name] = {
          count: 0,
          sum: 0,
          min: Infinity,
          max: -Infinity,
          avg: 0
        }
      }

      const s = summary[metric.name]
      s.count++
      s.sum += metric.value
      s.min = Math.min(s.min, metric.value)
      s.max = Math.max(s.max, metric.value)
      s.avg = Math.round(s.sum / s.count * 100) / 100
    }

    return summary
  }

  private generateMetricId(): string {
    return `metric_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  private generateErrorId(): string {
    return `error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }
}