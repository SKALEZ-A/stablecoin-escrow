import React, { useEffect, useCallback, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Save, Wifi, WifiOff, AlertTriangle } from 'lucide-react'

export interface AutoSaveManagerProps {
  data: Record<string, any>
  onSave: (data: Record<string, any>) => Promise<void>
  saveDelay?: number
  enabled?: boolean
  onSaveStatusChange?: (status: 'idle' | 'saving' | 'saved' | 'error') => void
  onError?: (error: Error) => void
  showIndicator?: boolean
  className?: string
}

export interface AutoSaveState {
  status: 'idle' | 'saving' | 'saved' | 'error'
  lastSaved: Date | null
  hasUnsavedChanges: boolean
  isOnline: boolean
  error: string | null
  saveCount: number
}

const AutoSaveManager: React.FC<AutoSaveManagerProps> = ({
  data,
  onSave,
  saveDelay = 2000,
  enabled = true,
  onSaveStatusChange,
  onError,
  showIndicator = true,
  className = ''
}) => {
  const [state, setState] = React.useState<AutoSaveState>({
    status: 'idle',
    lastSaved: null,
    hasUnsavedChanges: false,
    isOnline: navigator.onLine,
    error: null,
    saveCount: 0
  })

  const saveTimeoutRef = useRef<NodeJS.Timeout>()
  const lastDataRef = useRef<string>('')
  const retryTimeoutRef = useRef<NodeJS.Timeout>()
  const retryCountRef = useRef(0)

  // Monitor online status
  useEffect(() => {
    const handleOnline = () => setState(prev => ({ ...prev, isOnline: true }))
    const handleOffline = () => setState(prev => ({ ...prev, isOnline: false }))

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  // Perform save operation
  const performSave = useCallback(async () => {
    if (!enabled || !state.isOnline) return

    setState(prev => ({ ...prev, status: 'saving', error: null }))
    onSaveStatusChange?.('saving')

    try {
      await onSave(data)
      
      const now = new Date()
      setState(prev => ({
        ...prev,
        status: 'saved',
        lastSaved: now,
        hasUnsavedChanges: false,
        error: null,
        saveCount: prev.saveCount + 1
      }))
      
      onSaveStatusChange?.('saved')
      retryCountRef.current = 0

      // Reset status to idle after showing success
      setTimeout(() => {
        setState(prev => ({ ...prev, status: 'idle' }))
        onSaveStatusChange?.('idle')
      }, 2000)

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Save failed'
      setState(prev => ({
        ...prev,
        status: 'error',
        error: errorMessage
      }))
      
      onSaveStatusChange?.('error')
      onError?.(error instanceof Error ? error : new Error(errorMessage))

      // Retry logic
      if (retryCountRef.current < 3) {
        retryCountRef.current++
        retryTimeoutRef.current = setTimeout(() => {
          performSave()
        }, Math.pow(2, retryCountRef.current) * 1000) // Exponential backoff
      }
    }
  }, [data, enabled, state.isOnline, onSave, onSaveStatusChange, onError])

  // Auto-save when data changes
  useEffect(() => {
    if (!enabled) return

    const currentDataString = JSON.stringify(data)
    
    // Skip if data hasn't changed
    if (currentDataString === lastDataRef.current) return
    
    // Skip if data is empty/initial
    if (!data || Object.keys(data).length === 0) return

    lastDataRef.current = currentDataString
    
    setState(prev => ({ ...prev, hasUnsavedChanges: true }))

    // Clear existing timeout
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current)
    }

    // Set new timeout for auto-save
    saveTimeoutRef.current = setTimeout(performSave, saveDelay)

    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current)
      }
    }
  }, [data, enabled, saveDelay, performSave])

  // Save immediately when coming back online
  useEffect(() => {
    if (state.isOnline && state.hasUnsavedChanges && enabled) {
      performSave()
    }
  }, [state.isOnline, state.hasUnsavedChanges, enabled, performSave])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current)
      }
      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current)
      }
    }
  }, [])

  // Force save function
  const forceSave = useCallback(() => {
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current)
    }
    performSave()
  }, [performSave])

  // Format last saved time
  const formatLastSaved = (date: Date) => {
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffSecs = Math.floor(diffMs / 1000)
    const diffMins = Math.floor(diffMs / (1000 * 60))

    if (diffSecs < 10) return 'just now'
    if (diffSecs < 60) return `${diffSecs}s ago`
    if (diffMins < 60) return `${diffMins}m ago`
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  }

  if (!showIndicator) {
    return null
  }

  return (
    <div className={`inline-flex items-center space-x-2 ${className}`}>
      {/* Connection Status */}
      <div className="flex items-center space-x-1">
        {state.isOnline ? (
          <Wifi className="w-4 h-4 text-green-500" />
        ) : (
          <WifiOff className="w-4 h-4 text-red-500" />
        )}
      </div>

      {/* Save Status */}
      <AnimatePresence mode="wait">
        {state.status === 'saving' && (
          <motion.div
            key="saving"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            className="flex items-center space-x-1 text-blue-600"
          >
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            >
              <Save className="w-4 h-4" />
            </motion.div>
            <span className="text-xs">Saving...</span>
          </motion.div>
        )}

        {state.status === 'saved' && state.lastSaved && (
          <motion.div
            key="saved"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            className="flex items-center space-x-1 text-green-600"
          >
            <Save className="w-4 h-4" />
            <span className="text-xs">
              Saved {formatLastSaved(state.lastSaved)}
            </span>
          </motion.div>
        )}

        {state.status === 'error' && (
          <motion.div
            key="error"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            className="flex items-center space-x-1 text-red-600"
          >
            <AlertTriangle className="w-4 h-4" />
            <span className="text-xs">Save failed</span>
            <button
              onClick={forceSave}
              className="text-xs underline hover:no-underline"
            >
              Retry
            </button>
          </motion.div>
        )}

        {state.hasUnsavedChanges && state.status === 'idle' && (
          <motion.div
            key="unsaved"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            className="flex items-center space-x-1 text-amber-600"
          >
            <Save className="w-4 h-4" />
            <span className="text-xs">Unsaved changes</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Offline indicator */}
      {!state.isOnline && (
        <div className="px-2 py-1 bg-red-100 text-red-800 text-xs rounded-full">
          Offline
        </div>
      )}
    </div>
  )
}

export default AutoSaveManager