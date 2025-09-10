import React, { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Activity, Zap, Clock, HardDrive } from 'lucide-react'

interface PerformanceMetrics {
  renderTime: number
  bundleSize: number
  memoryUsage: number
  loadTime: number
  componentsLoaded: number
  lazyComponentsLoaded: number
}

interface PerformanceMonitorProps {
  enabled?: boolean
  position?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right'
  compact?: boolean
  onMetricsUpdate?: (metrics: PerformanceMetrics) => void
}

const PerformanceMonitor: React.FC<PerformanceMonitorProps> = ({
  enabled = process.env.NODE_ENV === 'development',
  position = 'bottom-right',
  compact = false,
  onMetricsUpdate
}) => {
  const [metrics, setMetrics] = useState<PerformanceMetrics>({
    renderTime: 0,
    bundleSize: 0,
    memoryUsage: 0,
    loadTime: 0,
    componentsLoaded: 0,
    lazyComponentsLoaded: 0
  })

  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    if (!enabled) return

    const updateMetrics = () => {
      const newMetrics: PerformanceMetrics = {
        renderTime: performance.now(),
        bundleSize: getBundleSize(),
        memoryUsage: getMemoryUsage(),
        loadTime: getLoadTime(),
        componentsLoaded: getComponentsLoaded(),
        lazyComponentsLoaded: getLazyComponentsLoaded()
      }

      setMetrics(newMetrics)
      onMetricsUpdate?.(newMetrics)
    }

    updateMetrics()
    const interval = setInterval(updateMetrics, 2000)

    return () => clearInterval(interval)
  }, [enabled, onMetricsUpdate])

  const getBundleSize = (): number => {
    if (typeof window !== 'undefined' && 'performance' in window) {
      const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming
      return Math.round((navigation.transferSize || 0) / 1024) // KB
    }
    return 0
  }

  const getMemoryUsage = (): number => {
    if (typeof window !== 'undefined' && 'memory' in (performance as any)) {
      const memory = (performance as any).memory
      return Math.round(memory.usedJSHeapSize / 1024 / 1024) // MB
    }
    return 0
  }

  const getLoadTime = (): number => {
    if (typeof window !== 'undefined' && 'performance' in window) {
      const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming
      return Math.round(navigation.loadEventEnd - navigation.loadEventStart)
    }
    return 0
  }

  const getComponentsLoaded = (): number => {
    // Count loaded React components (approximation)
    return document.querySelectorAll('[data-reactroot], [data-react-component]').length
  }

  const getLazyComponentsLoaded = (): number => {
    // Count lazy-loaded components (approximation)
    return document.querySelectorAll('[data-lazy-component]').length
  }

  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return '0 B'
    const k = 1024
    const sizes = ['B', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i]
  }

  const getPositionClasses = () => {
    const baseClasses = 'fixed z-50'
    switch (position) {
      case 'top-left':
        return `${baseClasses} top-4 left-4`
      case 'top-right':
        return `${baseClasses} top-4 right-4`
      case 'bottom-left':
        return `${baseClasses} bottom-4 left-4`
      case 'bottom-right':
      default:
        return `${baseClasses} bottom-4 right-4`
    }
  }

  const getPerformanceColor = (value: number, thresholds: { good: number; warning: number }) => {
    if (value <= thresholds.good) return 'text-green-600'
    if (value <= thresholds.warning) return 'text-yellow-600'
    return 'text-red-600'
  }

  if (!enabled) return null

  return (
    <div className={getPositionClasses()}>
      <AnimatePresence>
        {!isVisible && (
          <motion.button
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            exit={{ scale: 0 }}
            onClick={() => setIsVisible(true)}
            className="bg-gray-900 text-white p-2 rounded-full shadow-lg hover:bg-gray-800 transition-colors"
          >
            <Activity className="w-4 h-4" />
          </motion.button>
        )}

        {isVisible && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="bg-white border border-gray-200 rounded-lg shadow-lg p-4 min-w-[280px]"
          >
            {/* Header */}
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center space-x-2">
                <Activity className="w-4 h-4 text-blue-600" />
                <span className="font-medium text-gray-900">Performance</span>
              </div>
              <button
                onClick={() => setIsVisible(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                ×
              </button>
            </div>

            {/* Metrics */}
            <div className="space-y-2">
              {!compact && (
                <>
                  {/* Load Time */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Clock className="w-3 h-3 text-gray-500" />
                      <span className="text-sm text-gray-600">Load Time</span>
                    </div>
                    <span className={`text-sm font-mono ${getPerformanceColor(metrics.loadTime, { good: 1000, warning: 3000 })}`}>
                      {metrics.loadTime}ms
                    </span>
                  </div>

                  {/* Bundle Size */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <HardDrive className="w-3 h-3 text-gray-500" />
                      <span className="text-sm text-gray-600">Bundle</span>
                    </div>
                    <span className={`text-sm font-mono ${getPerformanceColor(metrics.bundleSize, { good: 500, warning: 1000 })}`}>
                      {metrics.bundleSize}KB
                    </span>
                  </div>

                  {/* Memory Usage */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Zap className="w-3 h-3 text-gray-500" />
                      <span className="text-sm text-gray-600">Memory</span>
                    </div>
                    <span className={`text-sm font-mono ${getPerformanceColor(metrics.memoryUsage, { good: 50, warning: 100 })}`}>
                      {metrics.memoryUsage}MB
                    </span>
                  </div>

                  {/* Components */}
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Components</span>
                    <span className="text-sm font-mono text-gray-700">
                      {metrics.componentsLoaded}
                    </span>
                  </div>

                  {/* Lazy Components */}
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Lazy Loaded</span>
                    <span className="text-sm font-mono text-blue-600">
                      {metrics.lazyComponentsLoaded}
                    </span>
                  </div>
                </>
              )}

              {compact && (
                <div className="flex items-center space-x-4 text-xs">
                  <span className={getPerformanceColor(metrics.loadTime, { good: 1000, warning: 3000 })}>
                    {metrics.loadTime}ms
                  </span>
                  <span className={getPerformanceColor(metrics.bundleSize, { good: 500, warning: 1000 })}>
                    {metrics.bundleSize}KB
                  </span>
                  <span className={getPerformanceColor(metrics.memoryUsage, { good: 50, warning: 100 })}>
                    {metrics.memoryUsage}MB
                  </span>
                </div>
              )}
            </div>

            {/* Performance Tips */}
            {!compact && (
              <div className="mt-3 pt-3 border-t border-gray-100">
                <div className="text-xs text-gray-500">
                  {metrics.bundleSize > 1000 && (
                    <div className="text-red-600">⚠️ Large bundle size</div>
                  )}
                  {metrics.memoryUsage > 100 && (
                    <div className="text-red-600">⚠️ High memory usage</div>
                  )}
                  {metrics.loadTime > 3000 && (
                    <div className="text-red-600">⚠️ Slow load time</div>
                  )}
                  {metrics.bundleSize <= 500 && metrics.memoryUsage <= 50 && metrics.loadTime <= 1000 && (
                    <div className="text-green-600">✅ Good performance</div>
                  )}
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default PerformanceMonitor