/**
 * Structured Logging Service
 * Sprint 22 - Observability Improvement
 *
 * Purpose:
 * - Unified logging interface across the application
 * - Structured log events with metadata
 * - Log levels for filtering (info, warn, error)
 * - Future: Send logs to analytics/monitoring service
 *
 * Usage:
 * import { logger } from '@/services/logger'
 * logger.info('User signed in', { userId, email })
 * logger.warn('Token refresh failed', { error: err.message })
 * logger.error('Fatal error', { error: err, stack: err.stack })
 */

export type LogLevel = 'info' | 'warn' | 'error' | 'debug'

export interface LogEvent {
  level: LogLevel
  context: string
  message: string
  metadata?: Record<string, unknown>
  timestamp: number
}

/**
 * Logger class for structured logging
 * Replaces direct console.log/warn/error calls
 */
export class Logger {
  private context: string

  constructor(context: string) {
    this.context = context
  }

  /**
   * Log info message (general information)
   */
  info(message: string, metadata?: Record<string, unknown>): void {
    this.log({
      level: 'info',
      context: this.context,
      message,
      metadata,
      timestamp: Date.now()
    })
  }

  /**
   * Log warning message (non-critical issues)
   */
  warn(message: string, metadata?: Record<string, unknown>): void {
    this.log({
      level: 'warn',
      context: this.context,
      message,
      metadata,
      timestamp: Date.now()
    })
  }

  /**
   * Log error message (critical failures)
   */
  error(message: string, error?: Error | unknown, metadata?: Record<string, unknown>): void {
    const errorMetadata = error instanceof Error
      ? {
          error: error.message,
          stack: error.stack,
          name: error.name,
          ...metadata
        }
      : { error: String(error), ...metadata }

    this.log({
      level: 'error',
      context: this.context,
      message,
      metadata: errorMetadata,
      timestamp: Date.now()
    })
  }

  /**
   * Log debug message (detailed diagnostic info)
   * Only shown in development mode
   */
  debug(message: string, metadata?: Record<string, unknown>): void {
    if (import.meta.env.DEV) {
      this.log({
        level: 'debug',
        context: this.context,
        message,
        metadata,
        timestamp: Date.now()
      })
    }
  }

  /**
   * Core logging implementation
   * Sprint 22: Logs to console (can be extended to send to analytics)
   */
  private log(event: LogEvent): void {
    const prefix = `[${event.context}]`

    // Console output
    const consoleMethod = event.level === 'error' ? console.error :
                         event.level === 'warn' ? console.warn :
                         event.level === 'debug' ? console.debug :
                         console.log

    if (event.metadata && Object.keys(event.metadata).length > 0) {
      consoleMethod(prefix, event.message, event.metadata)
    } else {
      consoleMethod(prefix, event.message)
    }

    // Future: Send to analytics service
    // if (import.meta.env.PROD) {
    //   this.sendToAnalytics(event)
    // }
  }

  /**
   * Future: Send logs to analytics/monitoring service
   * Examples: Sentry, LogRocket, Datadog, Google Analytics
   */
  // private sendToAnalytics(event: LogEvent): void {
  //   // Example: Google Analytics
  //   if (window.gtag) {
  //     window.gtag('event', `log_${event.level}`, {
  //       event_category: event.context,
  //       event_label: event.message,
  //       ...event.metadata
  //     })
  //   }
  //
  //   // Example: Sentry (errors only)
  //   if (event.level === 'error' && window.Sentry) {
  //     window.Sentry.captureException(new Error(event.message), {
  //       level: 'error',
  //       tags: { context: event.context },
  //       extra: event.metadata
  //     })
  //   }
  // }
}

/**
 * Create logger instance for a component/service
 * Usage: const logger = createLogger('ComponentName')
 */
export function createLogger(context: string): Logger {
  return new Logger(context)
}

/**
 * Default logger instance (for quick usage)
 * Usage: logger.info('Message')
 */
export const logger = createLogger('App')

/**
 * Pre-configured loggers for common contexts
 */
export const loggers = {
  app: createLogger('App'),
  auth: createLogger('Auth'),
  oauth: createLogger('OAuth'),
  drive: createLogger('Drive'),
  editor: createLogger('Editor'),
  settings: createLogger('Settings'),
  performance: createLogger('Performance'),
  network: createLogger('Network'),
  security: createLogger('Security'),
}
