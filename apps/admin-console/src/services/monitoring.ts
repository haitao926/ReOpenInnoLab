interface PerformanceMetric {
  name: string
  value: number
  timestamp: number
}

interface ErrorInfo {
  message: string
  stack?: string
  url: string
  line: number
  column: number
  timestamp: number
  userAgent: string
}

interface UserInteraction {
  type: string
  target: string
  timestamp: number
  duration?: number
}

class MonitoringService {
  private metrics: PerformanceMetric[] = []
  private errors: ErrorInfo[] = []
  private interactions: UserInteraction[] = []
  private isInitialized = false

  init() {
    if (this.isInitialized || typeof window === 'undefined') return

    // Performance monitoring
    this.observePerformance()

    // Error monitoring
    this.observeErrors()

    // User interaction monitoring
    this.observeInteractions()

    this.isInitialized = true
  }

  private observePerformance() {
    // Observe Core Web Vitals
    if ('PerformanceObserver' in window) {
      try {
        const observer = new PerformanceObserver((list) => {
          list.getEntries().forEach((entry) => {
            this.recordMetric(entry.name, entry.startTime)
          })
        })
        observer.observe({ entryTypes: ['navigation', 'resource', 'paint'] })
      } catch (e) {
        console.warn('Performance observation not supported')
      }
    }

    // Monitor page load
    window.addEventListener('load', () => {
      setTimeout(() => {
        const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming
        if (navigation) {
          this.recordMetric('pageLoadTime', navigation.loadEventEnd - navigation.fetchStart)
          this.recordMetric('domContentLoaded', navigation.domContentLoadedEventEnd - navigation.fetchStart)
        }
      }, 0)
    })
  }

  private observeErrors() {
    // JavaScript errors
    window.addEventListener('error', (event) => {
      this.recordError({
        message: event.message,
        stack: event.error?.stack,
        url: event.filename,
        line: event.lineno,
        column: event.colno,
        timestamp: Date.now(),
        userAgent: navigator.userAgent
      })
    })

    // Promise rejections
    window.addEventListener('unhandledrejection', (event) => {
      this.recordError({
        message: `Unhandled Promise Rejection: ${event.reason}`,
        stack: event.reason?.stack,
        url: window.location.href,
        line: 0,
        column: 0,
        timestamp: Date.now(),
        userAgent: navigator.userAgent
      })
    })
  }

  private observeInteractions() {
    let startTime: number

    // Track page visibility changes
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        const duration = Date.now() - startTime
        this.recordInteraction('pageHidden', 'page', duration)
      } else {
        startTime = Date.now()
        this.recordInteraction('pageVisible', 'page')
      }
    })

    startTime = Date.now()
  }

  recordMetric(name: string, value: number) {
    const metric: PerformanceMetric = {
      name,
      value,
      timestamp: Date.now()
    }

    this.metrics.push(metric)

    // Keep only last 100 metrics
    if (this.metrics.length > 100) {
      this.metrics.shift()
    }

    // Send to monitoring service
    this.sendMetric(metric)
  }

  recordError(error: ErrorInfo) {
    this.errors.push(error)

    // Keep only last 50 errors
    if (this.errors.length > 50) {
      this.errors.shift()
    }

    // Send to monitoring service
    this.sendError(error)
  }

  recordInteraction(type: string, target: string, duration?: number) {
    const interaction: UserInteraction = {
      type,
      target,
      timestamp: Date.now(),
      duration
    }

    this.interactions.push(interaction)

    // Keep only last 200 interactions
    if (this.interactions.length > 200) {
      this.interactions.shift()
    }
  }

  private async sendMetric(metric: PerformanceMetric) {
    try {
      // In production, send to your monitoring service
      if (import.meta.env.PROD) {
        await fetch('/api/admin/monitoring/metrics', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(metric)
        })
      }
    } catch (error) {
      console.warn('Failed to send metric:', error)
    }
  }

  private async sendError(error: ErrorInfo) {
    try {
      // In production, send to your error tracking service
      if (import.meta.env.PROD) {
        await fetch('/api/admin/monitoring/errors', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(error)
        })
      }
    } catch (err) {
      console.warn('Failed to send error:', err)
    }
  }

  // Public API for manual tracking
  trackEvent(name: string, properties?: Record<string, any>) {
    this.recordInteraction('custom', name, properties?.duration)
  }

  trackError(error: Error | string) {
    const errorInfo: ErrorInfo = {
      message: typeof error === 'string' ? error : error.message,
      stack: typeof error === 'string' ? undefined : error.stack,
      url: window.location.href,
      line: 0,
      column: 0,
      timestamp: Date.now(),
      userAgent: navigator.userAgent
    }
    this.recordError(errorInfo)
  }

  // Get metrics for debugging
  getMetrics(): PerformanceMetric[] {
    return [...this.metrics]
  }

  getErrors(): ErrorInfo[] {
    return [...this.errors]
  }

  getInteractions(): UserInteraction[] {
    return [...this.interactions]
  }
}

export const monitoring = new MonitoringService()

export const setupMonitoring = () => {
  monitoring.init()
}

// Vue composable for easy use
export const useMonitoring = () => {
  return {
    trackEvent: monitoring.trackEvent.bind(monitoring),
    trackError: monitoring.trackError.bind(monitoring),
    getMetrics: monitoring.getMetrics.bind(monitoring),
    getErrors: monitoring.getErrors.bind(monitoring)
  }
}