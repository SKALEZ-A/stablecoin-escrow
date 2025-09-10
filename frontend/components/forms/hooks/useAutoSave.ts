import { useCallback, useEffect, useRef, useState } from 'react'
import { useFormPersistence, FormPersistenceOptions } from './useFormPersistence'

export interface AutoSaveOptions extends FormPersistenceOptions {
  enabled?: boolean
  saveOnBlur?: boolean
  saveOnVisibilityChange?: boolean
  maxRetries?: number
  retryDelay?: number
  onSaveSuccess?: (data: Record<string, any>) => void
  onSaveError?: (error: Error, retryCount: number) => void
  onMaxRetriesReached?: (error: Error) => void
}

export interface AutoSaveState {
  isSaving: boolean
  lastSaved: Date | null
  hasUnsavedChanges: boolean
  isOnline: boolean
  saveCount: number
  retryCount: number
  error: string | null
}

export const useAutoSave = (
  key: string,
  data: Record<string, any>,
  options: AutoSaveOptions = {}
) => {
  const {
    enabled = true,
    saveOnBlur = true,
    saveOnVisibilityChange = true,
    maxRetries = 3,
    retryDelay = 1000,
    onSaveSuccess,
    onSaveError,
    onMaxRetriesReached,
    ...persistenceOptions
  } = options

  const [autoSaveState, setAutoSaveState] = useState<AutoSaveState>({
    isSaving: false,
    lastSaved: null,
    hasUnsavedChanges: false,
    isOnline: navigator.onLine,
    saveCount: 0,
    retryCount: 0,
    error: null
  })

  const retryTimeoutRef = useRef<NodeJS.Timeout>()
  const lastSaveAttemptRef = useRef<Date | null>(null)

  // Enhanced persistence with auto-save callbacks
  const persistence = useFormPersistence(key, data, {
    ...persistenceOptions,
    onSave: (savedData) => {
      setAutoSaveState(prev => ({
        ...prev,
        isSaving: false,
        lastSaved: new Date(),
        hasUnsavedChanges: false,
        saveCount: prev.saveCount + 1,
        retryCount: 0,
        error: null
      }))
      onSaveSuccess?.(savedData)
      persistenceOptions.onSave?.(savedData)
    },
    onError: (error) => {
      setAutoSaveState(prev => ({
        ...prev,
        isSaving: false,
        error: error.message,
        retryCount: prev.retryCount + 1
      }))
      
      const currentRetryCount = autoSaveState.retryCount + 1
      onSaveError?.(error, currentRetryCount)
      
      // Retry logic
      if (currentRetryCount < maxRetries && enabled) {
        retryTimeoutRef.current = setTimeout(() => {
          saveWithRetry()
        }, retryDelay * Math.pow(2, currentRetryCount)) // Exponential backoff
      } else if (currentRetryCount >= maxRetries) {
        onMaxRetriesReached?.(error)
      }
      
      persistenceOptions.onError?.(error)
    }
  })

  // Monitor online status
  useEffect(() => {
    const handleOnline = () => {
      setAutoSaveState(prev => ({ ...prev, isOnline: true }))
      // Retry save if there are unsaved changes
      if (autoSaveState.hasUnsavedChanges && enabled) {
        saveWithRetry()
      }
    }
    
    const handleOffline = () => {
      setAutoSaveState(prev => ({ ...prev, isOnline: false }))
    }

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [autoSaveState.hasUnsavedChanges, enabled])

  // Save with retry logic
  const saveWithRetry = useCallback(async () => {
    if (!enabled || !autoSaveState.isOnline) return

    setAutoSaveState(prev => ({ ...prev, isSaving: true, error: null }))
    lastSaveAttemptRef.current = new Date()
    
    try {
      await persistence.saveData(data, true) // Force immediate save
    } catch (error) {
      // Error handling is done in persistence onError callback
    }
  }, [enabled, autoSaveState.isOnline, persistence, data])

  // Force save function
  const forceSave = useCallback(async () => {
    if (retryTimeoutRef.current) {
      clearTimeout(retryTimeoutRef.current)
    }
    
    setAutoSaveState(prev => ({ ...prev, retryCount: 0 }))
    await saveWithRetry()
  }, [saveWithRetry])

  // Track data changes
  useEffect(() => {
    if (enabled && persistence.isLoaded) {
      const hasChanges = JSON.stringify(data) !== JSON.stringify(persistence.lastSavedData || {})
      setAutoSaveState(prev => ({ ...prev, hasUnsavedChanges: hasChanges }))
    }
  }, [data, persistence.isLoaded, persistence.lastSavedData, enabled])

  // Save on window blur
  useEffect(() => {
    if (!saveOnBlur || !enabled) return

    const handleBlur = () => {
      if (autoSaveState.hasUnsavedChanges) {
        forceSave()
      }
    }

    window.addEventListener('blur', handleBlur)
    return () => window.removeEventListener('blur', handleBlur)
  }, [saveOnBlur, enabled, autoSaveState.hasUnsavedChanges, forceSave])

  // Save on visibility change (tab switch, minimize, etc.)
  useEffect(() => {
    if (!saveOnVisibilityChange || !enabled) return

    const handleVisibilityChange = () => {
      if (document.hidden && autoSaveState.hasUnsavedChanges) {
        forceSave()
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange)
  }, [saveOnVisibilityChange, enabled, autoSaveState.hasUnsavedChanges, forceSave])

  // Save before page unload
  useEffect(() => {
    if (!enabled) return

    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (autoSaveState.hasUnsavedChanges) {
        // Try to save synchronously (limited time)
        persistence.saveImmediately()
        
        // Show confirmation dialog
        e.preventDefault()
        e.returnValue = 'You have unsaved changes. Are you sure you want to leave?'
        return e.returnValue
      }
    }

    window.addEventListener('beforeunload', handleBeforeUnload)
    return () => window.removeEventListener('beforeunload', handleBeforeUnload)
  }, [enabled, autoSaveState.hasUnsavedChanges, persistence])

  // Cleanup
  useEffect(() => {
    return () => {
      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current)
      }
    }
  }, [])

  // Get save status for UI
  const getSaveStatus = useCallback(() => {
    if (autoSaveState.isSaving) return 'saving'
    if (autoSaveState.error && autoSaveState.retryCount >= maxRetries) return 'error'
    if (autoSaveState.lastSaved && !autoSaveState.hasUnsavedChanges) return 'saved'
    if (autoSaveState.hasUnsavedChanges) return 'unsaved'
    return 'idle'
  }, [autoSaveState, maxRetries])

  // Get time since last save
  const getTimeSinceLastSave = useCallback(() => {
    if (!autoSaveState.lastSaved) return null
    
    const now = new Date()
    const diffMs = now.getTime() - autoSaveState.lastSaved.getTime()
    const diffSecs = Math.floor(diffMs / 1000)
    const diffMins = Math.floor(diffMs / (1000 * 60))
    
    if (diffSecs < 10) return 'just now'
    if (diffSecs < 60) return `${diffSecs}s ago`
    if (diffMins < 60) return `${diffMins}m ago`
    return autoSaveState.lastSaved.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  }, [autoSaveState.lastSaved])

  return {
    // State
    ...autoSaveState,
    ...persistence,
    
    // Computed
    saveStatus: getSaveStatus(),
    timeSinceLastSave: getTimeSinceLastSave(),
    canSave: enabled && autoSaveState.isOnline,
    
    // Actions
    forceSave,
    clearData: persistence.clearData,
    
    // Utilities
    getSaveStatus,
    getTimeSinceLastSave
  }
}