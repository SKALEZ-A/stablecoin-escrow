import React, { Component, ReactNode } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { AlertCircle, RefreshCw, X, ExternalLink, Copy, CheckCircle } from 'lucide-react'
import { ErrorRecoveryConfig, TransactionState } from './types'
import { errorRecoveryMap, getErrorMessage, getErrorSeverity, isRetryableError, getRetryConfig } from './schemas'

// Error Boundary Component
interface ErrorBoundaryState {
  hasError: boolean
  error?: Error
  errorInfo?: React.ErrorInfo
}

interface ErrorBoundaryProps {
  children: ReactNode
  fallback?: (error: Error, errorInfo: React.ErrorInfo, retry: () => void) => ReactNode
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void
}

export class FormErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    this.setState({ errorInfo })
    this.props.onError?.(error, errorInfo)
    
    // Log error for debugging
    console.error('Form Error Boundary caught an error:', error, errorInfo)
  }

  retry = () => {
    this.setState({ hasError: false, error: undefined, errorInfo: undefined })
  }

  render() {
    if (this.state.hasError && this.state.error) {
      if (this.props.fallback) {
        return this.props.fallback(this.state.error, this.state.errorInfo!, this.retry)
      }

      return (
        <ErrorDisplay
          error={{
            code: 'COMPONENT_ERROR',
            message: this.state.error.message,
            details: this.state.error
          }}
          onRetry={this.retry}
          showDetails={process.env.NODE_ENV === 'development'}
        />
      )
    }

    return this.props.children
  }
}

// Error Display Component
interface ErrorDisplayProps {
  error: {
    code: string
    message: string
    details?: any
  }
  onRetry?: () => void
  onDismiss?: () => void
  showDetails?: boolean
  className?: string
  transactionHash?: string
}

export const ErrorDisplay: React.FC<ErrorDisplayProps> = ({
  error,
  onRetry,
  onDismiss,
  showDetails = false,
  className = '',
  transactionHash
}) => {
  const [showFullDetails, setShowFullDetails] = React.useState(false)
  const [copied, setCopied] = React.useState(false)

  const errorConfig = errorRecoveryMap[error.code] || {
    retryable: false,
    maxRetries: 0,
    retryDelay: 0,
    userMessage: error.message,
    severity: 'medium' as const,
    category: 'system' as const
  }

  const severity = getErrorSeverity(error.code)
  const canRetry = isRetryableError(error.code) && onRetry

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'low': return 'yellow'
      case 'medium': return 'orange'
      case 'high': return 'red'
      case 'critical': return 'red'
      default: return 'red'
    }
  }

  const color = getSeverityColor(severity)

  const copyErrorDetails = async () => {
    const details = {
      code: error.code,
      message: error.message,
      timestamp: new Date().toISOString(),
      details: error.details,
      transactionHash
    }
    
    try {
      await navigator.clipboard.writeText(JSON.stringify(details, null, 2))
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error('Failed to copy error details:', err)
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className={`bg-${color}-50 border border-${color}-200 rounded-lg p-4 ${className}`}
    >
      <div className="flex items-start space-x-3">
        <div className="flex-shrink-0">
          <AlertCircle className={`w-5 h-5 text-${color}-600`} />
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h3 className={`text-sm font-medium text-${color}-900`}>
                {errorConfig.userMessage}
              </h3>
              
              {error.code !== 'UNKNOWN_ERROR' && (
                <p className={`text-xs text-${color}-700 mt-1`}>
                  Error Code: {error.code}
                </p>
              )}
              
              {errorConfig.suggestedActions && errorConfig.suggestedActions.length > 0 && (
                <div className="mt-2">
                  <p className={`text-xs text-${color}-800 font-medium mb-1`}>
                    Suggested actions:
                  </p>
                  <ul className={`text-xs text-${color}-700 space-y-0.5`}>
                    {errorConfig.suggestedActions.map((action, index) => (
                      <li key={index}>• {action}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
            
            {onDismiss && (
              <button
                onClick={onDismiss}
                className={`ml-2 text-${color}-400 hover:text-${color}-600`}
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
          
          {/* Action Buttons */}
          <div className="mt-3 flex flex-wrap gap-2">
            {canRetry && (
              <button
                onClick={onRetry}
                className={`inline-flex items-center px-3 py-1.5 text-xs font-medium text-${color}-800 bg-${color}-100 hover:bg-${color}-200 rounded-md transition-colors`}
              >
                <RefreshCw className="w-3 h-3 mr-1" />
                Try Again
              </button>
            )}
            
            {transactionHash && (
              <a
                href={`https://basescan.org/tx/${transactionHash}`}
                target="_blank"
                rel="noopener noreferrer"
                className={`inline-flex items-center px-3 py-1.5 text-xs font-medium text-${color}-800 bg-${color}-100 hover:bg-${color}-200 rounded-md transition-colors`}
              >
                <ExternalLink className="w-3 h-3 mr-1" />
                View Transaction
              </a>
            )}
            
            {showDetails && (
              <button
                onClick={() => setShowFullDetails(!showFullDetails)}
                className={`inline-flex items-center px-3 py-1.5 text-xs font-medium text-${color}-800 bg-${color}-100 hover:bg-${color}-200 rounded-md transition-colors`}
              >
                {showFullDetails ? 'Hide' : 'Show'} Details
              </button>
            )}
            
            <button
              onClick={copyErrorDetails}
              className={`inline-flex items-center px-3 py-1.5 text-xs font-medium text-${color}-800 bg-${color}-100 hover:bg-${color}-200 rounded-md transition-colors`}
            >
              {copied ? (
                <>
                  <CheckCircle className="w-3 h-3 mr-1" />
                  Copied
                </>
              ) : (
                <>
                  <Copy className="w-3 h-3 mr-1" />
                  Copy Details
                </>
              )}
            </button>
          </div>
          
          {/* Technical Details */}
          <AnimatePresence>
            {showFullDetails && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="mt-3 pt-3 border-t border-current border-opacity-20"
              >
                <details className={`text-xs text-${color}-700`}>
                  <summary className="cursor-pointer font-medium mb-2">
                    Technical Details
                  </summary>
                  <pre className={`bg-${color}-100 p-2 rounded text-xs overflow-auto max-h-32`}>
                    {JSON.stringify({
                      code: error.code,
                      message: error.message,
                      category: errorConfig.category,
                      severity: errorConfig.severity,
                      retryable: errorConfig.retryable,
                      timestamp: new Date().toISOString(),
                      details: error.details
                    }, null, 2)}
                  </pre>
                </details>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </motion.div>
  )
}

// Transaction Error Handler Component
interface TransactionErrorHandlerProps {
  transactionState: TransactionState
  onRetry?: () => void
  onDismiss?: () => void
  className?: string
}

export const TransactionErrorHandler: React.FC<TransactionErrorHandlerProps> = ({
  transactionState,
  onRetry,
  onDismiss,
  className
}) => {
  if (transactionState.status !== 'error' || !transactionState.error) {
    return null
  }

  return (
    <ErrorDisplay
      error={transactionState.error}
      onRetry={onRetry}
      onDismiss={onDismiss}
      className={className}
      transactionHash={transactionState.hash}
      showDetails={process.env.NODE_ENV === 'development'}
    />
  )
}

// Auto-retry Error Handler Component
interface AutoRetryErrorHandlerProps {
  error: {
    code: string
    message: string
    details?: any
  }
  onRetry: () => Promise<void>
  maxRetries?: number
  retryDelay?: number
  onMaxRetriesReached?: () => void
  className?: string
}

export const AutoRetryErrorHandler: React.FC<AutoRetryErrorHandlerProps> = ({
  error,
  onRetry,
  maxRetries = 3,
  retryDelay = 2000,
  onMaxRetriesReached,
  className
}) => {
  const [retryCount, setRetryCount] = React.useState(0)
  const [isRetrying, setIsRetrying] = React.useState(false)
  const [countdown, setCountdown] = React.useState(0)
  
  const retryTimeoutRef = React.useRef<NodeJS.Timeout>()
  const countdownIntervalRef = React.useRef<NodeJS.Timeout>()

  const errorConfig = errorRecoveryMap[error.code]
  const shouldAutoRetry = errorConfig?.retryable && retryCount < maxRetries

  React.useEffect(() => {
    if (shouldAutoRetry && !isRetrying) {
      setIsRetrying(true)
      setCountdown(Math.ceil(retryDelay / 1000))
      
      // Start countdown
      countdownIntervalRef.current = setInterval(() => {
        setCountdown(prev => {
          if (prev <= 1) {
            if (countdownIntervalRef.current) {
              clearInterval(countdownIntervalRef.current)
            }
            return 0
          }
          return prev - 1
        })
      }, 1000)
      
      // Schedule retry
      retryTimeoutRef.current = setTimeout(async () => {
        try {
          await onRetry()
          setRetryCount(prev => prev + 1)
        } catch (retryError) {
          console.error('Auto-retry failed:', retryError)
        } finally {
          setIsRetrying(false)
        }
      }, retryDelay)
    } else if (retryCount >= maxRetries) {
      onMaxRetriesReached?.()
    }

    return () => {
      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current)
      }
      if (countdownIntervalRef.current) {
        clearInterval(countdownIntervalRef.current)
      }
    }
  }, [shouldAutoRetry, isRetrying, retryCount, maxRetries, retryDelay, onRetry, onMaxRetriesReached])

  const manualRetry = async () => {
    if (retryTimeoutRef.current) {
      clearTimeout(retryTimeoutRef.current)
    }
    if (countdownIntervalRef.current) {
      clearInterval(countdownIntervalRef.current)
    }
    
    setIsRetrying(true)
    setCountdown(0)
    
    try {
      await onRetry()
      setRetryCount(prev => prev + 1)
    } catch (retryError) {
      console.error('Manual retry failed:', retryError)
    } finally {
      setIsRetrying(false)
    }
  }

  return (
    <div className={className}>
      <ErrorDisplay
        error={error}
        onRetry={shouldAutoRetry ? manualRetry : undefined}
        showDetails={process.env.NODE_ENV === 'development'}
      />
      
      {shouldAutoRetry && isRetrying && countdown > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-2 p-2 bg-blue-50 border border-blue-200 rounded-lg"
        >
          <div className="flex items-center space-x-2 text-sm text-blue-800">
            <RefreshCw className="w-4 h-4 animate-spin" />
            <span>Auto-retrying in {countdown} seconds... (Attempt {retryCount + 1}/{maxRetries})</span>
          </div>
        </motion.div>
      )}
      
      {retryCount >= maxRetries && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-2 p-2 bg-red-50 border border-red-200 rounded-lg"
        >
          <div className="text-sm text-red-800">
            Maximum retry attempts reached. Please try again manually or contact support.
          </div>
        </motion.div>
      )}
    </div>
  )
}

// Error Toast Component
interface ErrorToastProps {
  error: {
    code: string
    message: string
    details?: any
  }
  onDismiss: () => void
  duration?: number
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left'
}

export const ErrorToast: React.FC<ErrorToastProps> = ({
  error,
  onDismiss,
  duration = 5000,
  position = 'top-right'
}) => {
  React.useEffect(() => {
    const timer = setTimeout(onDismiss, duration)
    return () => clearTimeout(timer)
  }, [onDismiss, duration])

  const positionClasses = {
    'top-right': 'top-4 right-4',
    'top-left': 'top-4 left-4',
    'bottom-right': 'bottom-4 right-4',
    'bottom-left': 'bottom-4 left-4'
  }

  return (
    <motion.div
      initial={{ opacity: 0, x: position.includes('right') ? 100 : -100 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: position.includes('right') ? 100 : -100 }}
      className={`fixed ${positionClasses[position]} z-50 max-w-sm`}
    >
      <ErrorDisplay
        error={error}
        onDismiss={onDismiss}
        className="shadow-lg"
      />
    </motion.div>
  )
}

// Hook for managing error toasts
export const useErrorToast = () => {
  const [errors, setErrors] = React.useState<Array<{
    id: string
    error: { code: string; message: string; details?: any }
  }>>([])

  const showError = React.useCallback((error: { code: string; message: string; details?: any }) => {
    const id = Math.random().toString(36).substr(2, 9)
    setErrors(prev => [...prev, { id, error }])
  }, [])

  const dismissError = React.useCallback((id: string) => {
    setErrors(prev => prev.filter(e => e.id !== id))
  }, [])

  const clearAllErrors = React.useCallback(() => {
    setErrors([])
  }, [])

  const ErrorToasts = React.useMemo(() => {
    return (
      <AnimatePresence>
        {errors.map(({ id, error }) => (
          <ErrorToast
            key={id}
            error={error}
            onDismiss={() => dismissError(id)}
          />
        ))}
      </AnimatePresence>
    )
  }, [errors, dismissError])

  return {
    showError,
    dismissError,
    clearAllErrors,
    ErrorToasts,
    hasErrors: errors.length > 0,
    errorCount: errors.length
  }
}