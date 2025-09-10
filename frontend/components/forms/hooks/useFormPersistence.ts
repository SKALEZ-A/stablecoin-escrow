import { useState, useEffect, useCallback, useRef } from 'react'

export interface FormPersistenceOptions {
  autoSave?: boolean
  autoSaveDelay?: number
  maxAge?: number // Maximum age in milliseconds before data expires
  onRestore?: (data: Record<string, any>) => void
  onSave?: (data: Record<string, any>) => void
  onError?: (error: Error) => void
}

export interface FormPersistenceState {
  data: Record<string, any>
  isLoaded: boolean
  isLoading: boolean
  isSaving: boolean
  lastSaved: Date | null
  hasUnsavedChanges: boolean
  hasSavedData: boolean
  saveStatus: 'idle' | 'saving' | 'saved' | 'error'
  error: string | null
}

export const useFormPersistence = (
  key: string, 
  initialData: Record<string, any> = {},
  options: FormPersistenceOptions = {}
) => {
  const {
    autoSave = true,
    autoSaveDelay = 1000,
    maxAge = 24 * 60 * 60 * 1000, // 24 hours default
    onRestore,
    onSave,
    onError
  } = options

  const [state, setState] = useState<FormPersistenceState>({
    data: initialData,
    isLoaded: false,
    isLoading: true,
    isSaving: false,
    lastSaved: null,
    hasUnsavedChanges: false,
    hasSavedData: false,
    saveStatus: 'idle',
    error: null
  })

  const autoSaveTimeoutRef = useRef<NodeJS.Timeout>()
  const storageKey = `form-${key}`

  // Load data from localStorage on mount
  useEffect(() => {
    const loadData = async () => {
      setState(prev => ({ ...prev, isLoading: true, error: null }))
      
      try {
        const saved = localStorage.getItem(storageKey)
        if (saved) {
          const parsedData = JSON.parse(saved)
          
          // Check if data has expired
          if (parsedData.timestamp && maxAge > 0) {
            const age = Date.now() - parsedData.timestamp
            if (age > maxAge) {
              // Data expired, remove it
              localStorage.removeItem(storageKey)
              setState(prev => ({
                ...prev,
                data: initialData,
                isLoaded: true,
                isLoading: false,
                hasSavedData: false
              }))
              return
            }
          }

          const restoredData = { ...initialData, ...parsedData.data }
          setState(prev => ({
            ...prev,
            data: restoredData,
            isLoaded: true,
            isLoading: false,
            hasSavedData: true,
            lastSaved: parsedData.timestamp ? new Date(parsedData.timestamp) : null
          }))

          // Call restore callback
          if (onRestore) {
            onRestore(restoredData)
          }
        } else {
          setState(prev => ({
            ...prev,
            data: initialData,
            isLoaded: true,
            isLoading: false,
            hasSavedData: false
          }))
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Failed to load form data'
        setState(prev => ({
          ...prev,
          isLoaded: true,
          isLoading: false,
          error: errorMessage,
          hasSavedData: false
        }))
        
        if (onError) {
          onError(error instanceof Error ? error : new Error(errorMessage))
        }
      }
    }

    loadData()
  }, [key, maxAge, onRestore, onError, storageKey])

  // Save data to localStorage
  const saveData = useCallback(async (newData: Record<string, any>, immediate = false) => {
    // Clear existing timeout if immediate save
    if (immediate && autoSaveTimeoutRef.current) {
      clearTimeout(autoSaveTimeoutRef.current)
    }

    const performSave = () => {
      setState(prev => ({ ...prev, isSaving: true, saveStatus: 'saving', error: null }))
      
      try {
        const dataToSave = {
          data: newData,
          timestamp: Date.now(),
          version: '1.0'
        }
        
        localStorage.setItem(storageKey, JSON.stringify(dataToSave))
        
        const now = new Date()
        setState(prev => ({
          ...prev,
          data: newData,
          isSaving: false,
          lastSaved: now,
          hasUnsavedChanges: false,
          hasSavedData: true,
          saveStatus: 'saved',
          error: null
        }))

        // Call save callback
        if (onSave) {
          onSave(newData)
        }

        // Reset save status after a delay
        setTimeout(() => {
          setState(prev => ({ ...prev, saveStatus: 'idle' }))
        }, 2000)

      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Failed to save form data'
        setState(prev => ({
          ...prev,
          isSaving: false,
          saveStatus: 'error',
          error: errorMessage
        }))
        
        if (onError) {
          onError(error instanceof Error ? error : new Error(errorMessage))
        }
      }
    }

    if (immediate || !autoSave) {
      performSave()
    } else {
      // Auto-save with debounce
      setState(prev => ({ ...prev, data: newData, hasUnsavedChanges: true }))
      
      if (autoSaveTimeoutRef.current) {
        clearTimeout(autoSaveTimeoutRef.current)
      }
      
      autoSaveTimeoutRef.current = setTimeout(performSave, autoSaveDelay)
    }
  }, [storageKey, autoSave, autoSaveDelay, onSave, onError])

  // Update specific field
  const updateField = useCallback((fieldName: string, value: any) => {
    const newData = { ...state.data, [fieldName]: value }
    saveData(newData)
  }, [state.data, saveData])

  // Save immediately (bypass auto-save delay)
  const saveImmediately = useCallback(() => {
    saveData(state.data, true)
  }, [state.data, saveData])

  // Clear saved data
  const clearData = useCallback(() => {
    try {
      localStorage.removeItem(storageKey)
      
      if (autoSaveTimeoutRef.current) {
        clearTimeout(autoSaveTimeoutRef.current)
      }
      
      setState(prev => ({
        ...prev,
        data: initialData,
        hasUnsavedChanges: false,
        hasSavedData: false,
        lastSaved: null,
        saveStatus: 'idle',
        error: null
      }))
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to clear form data'
      setState(prev => ({ ...prev, error: errorMessage, saveStatus: 'error' }))
      
      if (onError) {
        onError(error instanceof Error ? error : new Error(errorMessage))
      }
    }
  }, [storageKey, initialData, onError])

  // Check if there's saved data (without loading it)
  const checkHasSavedData = useCallback(() => {
    try {
      const saved = localStorage.getItem(storageKey)
      return saved !== null
    } catch (error) {
      return false
    }
  }, [storageKey])

  // Get saved data info without loading
  const getSavedDataInfo = useCallback(() => {
    try {
      const saved = localStorage.getItem(storageKey)
      if (saved) {
        const parsedData = JSON.parse(saved)
        return {
          timestamp: parsedData.timestamp ? new Date(parsedData.timestamp) : null,
          version: parsedData.version || 'unknown',
          hasData: true
        }
      }
      return { hasData: false }
    } catch (error) {
      return { hasData: false, error: error instanceof Error ? error.message : 'Unknown error' }
    }
  }, [storageKey])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (autoSaveTimeoutRef.current) {
        clearTimeout(autoSaveTimeoutRef.current)
      }
    }
  }, [])

  return {
    // State
    ...state,
    
    // Actions
    saveData,
    updateField,
    saveImmediately,
    clearData,
    
    // Utilities
    checkHasSavedData,
    getSavedDataInfo
  }
}