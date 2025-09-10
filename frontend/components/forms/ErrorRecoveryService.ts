import { errorRecoveryMap, ErrorRecoveryConfig } from './schemas'

export interface ErrorContext {
  component: string
  action: string
  timestamp: Date
  userAgent: string
  url: string
  userId?: string
  sessionId?: string
  additionalData?: Record<string, any>
}

export interface ErrorReport {
  error: {
    code: string
    message: string
    details?: any
  }
  context: ErrorContext
  recovery?: {
    attempted: boolean
    successful: boolean
    strategy: string
    retryCount: number
  }
}

export class ErrorRecoveryService {
  private static instance: ErrorRecoveryService
  private errorHistory: ErrorReport[] = []
  private maxHistorySize = 100
  private retryAttempts = new Map<string, number>()

  private constructor() {}

  static getInstance(): ErrorRecoveryService {
    if (!ErrorRecoveryService.instance) {
      ErrorRecoveryService.instance = new ErrorRecoveryService()
    }
    return ErrorRecoveryService.instance
  }

  // Analyze error and determine recovery strategy
  analyzeError(
    error: { code: string; message: string; details?: any },
    context: Partial<ErrorContext>
  ): {
    config: ErrorRecoveryConfig
    strategy: 'retry' | 'fallback' | 'user-action' | 'escalate'
    recommendation: string
  } {
    const config = errorRecoveryMap[error.code] || {
      retryable: false,
      maxRetries: 0,
      retryDelay: 0,
      userMessage: error.message,
      severity: 'medium' as const,
      category: 'system' as const
    }

    let strategy: 'retry' | 'fallback' | 'user-action' | 'escalate' = 'escalate'
    let recommendation = 'Contact support for assistance'

    // Determine strategy based on error characteristics
    if (config.retryable) {
      const retryKey = `${error.code}-${context.component}-${context.action}`
      const currentRetries = this.retryAttempts.get(retryKey) || 0

      if (currentRetries < config.maxRetries) {
        strategy = 'retry'
        recommendation = `Automatically retry the operation (attempt ${currentRetries + 1}/${config.maxRetries})`
      } else {
        strategy = 'escalate'
        recommendation = 'Maximum retries reached. Manual intervention required.'
      }
    } else {
      // Non-retryable errors - determine best strategy
      switch (config.category) {
        case 'validation':
          strategy = 'user-action'
          recommendation = 'Please correct the input and try again'
          break
        case 'wallet':
          strategy = 'user-action'
          recommendation = 'Please check your wallet connection and try again'
          break
        case 'network':
          strategy = 'fallback'
          recommendation = 'Network issue detected. Trying alternative approach.'
          break
        case 'contract':
          strategy = 'escalate'
          recommendation = 'Smart contract error. Please contact support.'
          break
        default:
          strategy = 'escalate'
          recommendation = 'Unknown error. Please contact support.'
      }
    }

    return { config, strategy, recommendation }
  }

  // Execute recovery strategy
  async executeRecovery(
    error: { code: string; message: string; details?: any },
    context: Partial<ErrorContext>,
    recoveryFunction?: () => Promise<any>
  ): Promise<{
    success: boolean
    result?: any
    newError?: any
    strategy: string
  }> {
    const analysis = this.analyzeError(error, context)
    const retryKey = `${error.code}-${context.component}-${context.action}`
    
    // Record the error
    this.recordError(error, context as ErrorContext, {
      attempted: true,
      successful: false,
      strategy: analysis.strategy,
      retryCount: this.retryAttempts.get(retryKey) || 0
    })

    try {
      switch (analysis.strategy) {
        case 'retry':
          if (recoveryFunction) {
            // Increment retry count
            const currentRetries = this.retryAttempts.get(retryKey) || 0
            this.retryAttempts.set(retryKey, currentRetries + 1)

            // Wait for retry delay
            await this.delay(analysis.config.retryDelay)

            // Execute recovery function
            const result = await recoveryFunction()
            
            // Reset retry count on success
            this.retryAttempts.delete(retryKey)
            
            return {
              success: true,
              result,
              strategy: analysis.strategy
            }
          }
          break

        case 'fallback':
          // Implement fallback strategies
          return await this.executeFallbackStrategy(error, context)

        case 'user-action':
          // Return guidance for user action
          return {
            success: false,
            strategy: analysis.strategy
          }

        case 'escalate':
          // Log for support team
          await this.escalateError(error, context as ErrorContext)
          return {
            success: false,
            strategy: analysis.strategy
          }
      }
    } catch (recoveryError) {
      return {
        success: false,
        newError: recoveryError,
        strategy: analysis.strategy
      }
    }

    return {
      success: false,
      strategy: analysis.strategy
    }
  }

  // Execute fallback strategies
  private async executeFallbackStrategy(
    error: { code: string; message: string; details?: any },
    context: Partial<ErrorContext>
  ): Promise<{ success: boolean; result?: any; strategy: string }> {
    switch (error.code) {
      case 'NETWORK_ERROR':
        // Try alternative RPC endpoints
        return await this.tryAlternativeRPC()

      case 'GAS_ESTIMATION_FAILED':
        // Use default gas limits
        return await this.useDefaultGasLimits()

      case 'RPC_ERROR':
        // Switch to backup RPC
        return await this.switchToBackupRPC()

      default:
        return {
          success: false,
          strategy: 'fallback'
        }
    }
  }

  // Fallback implementations
  private async tryAlternativeRPC(): Promise<{ success: boolean; result?: any; strategy: string }> {
    // Implementation would try alternative RPC endpoints
    // This is a placeholder for the actual implementation
    return {
      success: false,
      strategy: 'fallback'
    }
  }

  private async useDefaultGasLimits(): Promise<{ success: boolean; result?: any; strategy: string }> {
    // Implementation would use predefined gas limits
    return {
      success: true,
      result: { gasLimit: '200000' },
      strategy: 'fallback'
    }
  }

  private async switchToBackupRPC(): Promise<{ success: boolean; result?: any; strategy: string }> {
    // Implementation would switch to backup RPC
    return {
      success: false,
      strategy: 'fallback'
    }
  }

  // Record error in history
  private recordError(
    error: { code: string; message: string; details?: any },
    context: ErrorContext,
    recovery?: {
      attempted: boolean
      successful: boolean
      strategy: string
      retryCount: number
    }
  ): void {
    const report: ErrorReport = {
      error,
      context: {
        ...context,
        timestamp: new Date(),
        userAgent: navigator.userAgent,
        url: window.location.href
      },
      recovery
    }

    this.errorHistory.unshift(report)

    // Maintain history size limit
    if (this.errorHistory.length > this.maxHistorySize) {
      this.errorHistory = this.errorHistory.slice(0, this.maxHistorySize)
    }

    // Log to console in development
    if (process.env.NODE_ENV === 'development') {
      console.error('Error recorded:', report)
    }
  }

  // Escalate error to support team
  private async escalateError(
    error: { code: string; message: string; details?: any },
    context: ErrorContext
  ): Promise<void> {
    // In a real implementation, this would send error reports to a logging service
    console.error('Error escalated to support:', { error, context })
    
    // Could integrate with services like Sentry, LogRocket, etc.
    // await this.sendToLoggingService({ error, context })
  }

  // Utility methods
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
  }

  // Get error statistics
  getErrorStatistics(): {
    totalErrors: number
    errorsByCode: Record<string, number>
    errorsByCategory: Record<string, number>
    errorsBySeverity: Record<string, number>
    recentErrors: ErrorReport[]
    recoverySuccessRate: number
  } {
    const errorsByCode: Record<string, number> = {}
    const errorsByCategory: Record<string, number> = {}
    const errorsBySeverity: Record<string, number> = {}
    let recoveryAttempts = 0
    let recoverySuccesses = 0

    this.errorHistory.forEach(report => {
      const code = report.error.code
      const config = errorRecoveryMap[code]

      // Count by code
      errorsByCode[code] = (errorsByCode[code] || 0) + 1

      // Count by category
      if (config) {
        const category = config.category
        errorsByCategory[category] = (errorsByCategory[category] || 0) + 1

        const severity = config.severity
        errorsBySeverity[severity] = (errorsBySeverity[severity] || 0) + 1
      }

      // Count recovery attempts
      if (report.recovery?.attempted) {
        recoveryAttempts++
        if (report.recovery.successful) {
          recoverySuccesses++
        }
      }
    })

    return {
      totalErrors: this.errorHistory.length,
      errorsByCode,
      errorsByCategory,
      errorsBySeverity,
      recentErrors: this.errorHistory.slice(0, 10),
      recoverySuccessRate: recoveryAttempts > 0 ? recoverySuccesses / recoveryAttempts : 0
    }
  }

  // Clear error history
  clearHistory(): void {
    this.errorHistory = []
    this.retryAttempts.clear()
  }

  // Get error patterns
  getErrorPatterns(): {
    frequentErrors: Array<{ code: string; count: number; lastOccurrence: Date }>
    errorTrends: Array<{ date: string; count: number }>
    problematicComponents: Array<{ component: string; errorCount: number }>
  } {
    const errorCounts = new Map<string, { count: number; lastOccurrence: Date }>()
    const componentErrors = new Map<string, number>()
    const dailyErrors = new Map<string, number>()

    this.errorHistory.forEach(report => {
      const code = report.error.code
      const component = report.context.component
      const date = report.context.timestamp.toDateString()

      // Count errors by code
      const existing = errorCounts.get(code)
      errorCounts.set(code, {
        count: (existing?.count || 0) + 1,
        lastOccurrence: report.context.timestamp
      })

      // Count errors by component
      componentErrors.set(component, (componentErrors.get(component) || 0) + 1)

      // Count errors by date
      dailyErrors.set(date, (dailyErrors.get(date) || 0) + 1)
    })

    return {
      frequentErrors: Array.from(errorCounts.entries())
        .map(([code, data]) => ({ code, ...data }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 10),
      
      errorTrends: Array.from(dailyErrors.entries())
        .map(([date, count]) => ({ date, count }))
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()),
      
      problematicComponents: Array.from(componentErrors.entries())
        .map(([component, errorCount]) => ({ component, errorCount }))
        .sort((a, b) => b.errorCount - a.errorCount)
        .slice(0, 10)
    }
  }

  // Check if error should be suppressed (to avoid spam)
  shouldSuppressError(
    error: { code: string; message: string; details?: any },
    context: Partial<ErrorContext>
  ): boolean {
    const recentSimilarErrors = this.errorHistory.filter(report => 
      report.error.code === error.code &&
      report.context.component === context.component &&
      Date.now() - report.context.timestamp.getTime() < 60000 // Within last minute
    )

    // Suppress if more than 3 similar errors in the last minute
    return recentSimilarErrors.length >= 3
  }
}

// Export singleton instance
export const errorRecoveryService = ErrorRecoveryService.getInstance()

// Hook for using error recovery service
export const useErrorRecovery = () => {
  const [isRecovering, setIsRecovering] = React.useState(false)

  const recoverFromError = React.useCallback(async (
    error: { code: string; message: string; details?: any },
    context: Partial<ErrorContext>,
    recoveryFunction?: () => Promise<any>
  ) => {
    setIsRecovering(true)
    
    try {
      const result = await errorRecoveryService.executeRecovery(error, context, recoveryFunction)
      return result
    } finally {
      setIsRecovering(false)
    }
  }, [])

  const analyzeError = React.useCallback((
    error: { code: string; message: string; details?: any },
    context: Partial<ErrorContext>
  ) => {
    return errorRecoveryService.analyzeError(error, context)
  }, [])

  const shouldSuppress = React.useCallback((
    error: { code: string; message: string; details?: any },
    context: Partial<ErrorContext>
  ) => {
    return errorRecoveryService.shouldSuppressError(error, context)
  }, [])

  return {
    recoverFromError,
    analyzeError,
    shouldSuppress,
    isRecovering,
    getStatistics: () => errorRecoveryService.getErrorStatistics(),
    getPatterns: () => errorRecoveryService.getErrorPatterns(),
    clearHistory: () => errorRecoveryService.clearHistory()
  }
}

export default ErrorRecoveryService