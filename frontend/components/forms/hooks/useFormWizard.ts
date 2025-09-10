import { useState, useCallback, useEffect, useRef } from 'react'
import { FormWizardState } from '../types'

export interface FormWizardOptions {
  persistKey?: string // Key for localStorage persistence
  validateStep?: (step: number, data: Record<string, any>) => Promise<{ isValid: boolean; errors: string[] }>
  onStepChange?: (step: number, direction: 'next' | 'previous') => void
  onComplete?: (data: Record<string, any>) => Promise<void>
  allowSkipSteps?: boolean // Allow jumping to any step
  autoSave?: boolean // Auto-save form data
  autoSaveDelay?: number // Debounce delay for auto-save
}

export interface ExtendedFormWizardState extends FormWizardState {
  completedSteps: Set<number>
  visitedSteps: Set<number>
  stepErrors: Record<number, string[]>
  isDirty: boolean
  lastSavedData: Record<string, any>
}

export const useFormWizard = (
  totalSteps: number, 
  initialData: Record<string, any> = {},
  options: FormWizardOptions = {}
) => {
  const {
    persistKey,
    validateStep,
    onStepChange,
    onComplete,
    allowSkipSteps = false,
    autoSave = true,
    autoSaveDelay = 1000
  } = options

  const [state, setState] = useState<ExtendedFormWizardState>(() => {
    // Try to load persisted data
    let persistedData = initialData
    if (persistKey && typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem(`form-wizard-${persistKey}`)
        if (saved) {
          const parsed = JSON.parse(saved)
          persistedData = { ...initialData, ...parsed.formData }
        }
      } catch (error) {
        console.warn('Failed to load persisted form data:', error)
      }
    }

    return {
      currentStep: 1,
      totalSteps,
      formData: persistedData,
      isValid: false,
      isLoading: false,
      completedSteps: new Set<number>(),
      visitedSteps: new Set([1]),
      stepErrors: {},
      isDirty: false,
      lastSavedData: persistedData
    }
  })

  const autoSaveTimeoutRef = useRef<NodeJS.Timeout>()
  const validationCacheRef = useRef<Record<number, { isValid: boolean; errors: string[] }>>({})

  // Auto-save functionality
  const saveFormData = useCallback(() => {
    if (persistKey && typeof window !== 'undefined') {
      try {
        const dataToSave = {
          formData: state.formData,
          currentStep: state.currentStep,
          completedSteps: Array.from(state.completedSteps),
          visitedSteps: Array.from(state.visitedSteps),
          timestamp: Date.now()
        }
        localStorage.setItem(`form-wizard-${persistKey}`, JSON.stringify(dataToSave))
        setState(prev => ({ ...prev, lastSavedData: prev.formData, isDirty: false }))
      } catch (error) {
        console.warn('Failed to save form data:', error)
      }
    }
  }, [persistKey, state.formData, state.currentStep, state.completedSteps, state.visitedSteps])

  // Debounced auto-save
  useEffect(() => {
    if (autoSave && state.isDirty) {
      if (autoSaveTimeoutRef.current) {
        clearTimeout(autoSaveTimeoutRef.current)
      }
      autoSaveTimeoutRef.current = setTimeout(saveFormData, autoSaveDelay)
    }
    return () => {
      if (autoSaveTimeoutRef.current) {
        clearTimeout(autoSaveTimeoutRef.current)
      }
    }
  }, [state.isDirty, autoSave, autoSaveDelay, saveFormData])

  // Validate current step
  const validateCurrentStep = useCallback(async (): Promise<{ isValid: boolean; errors: string[] }> => {
    if (!validateStep) {
      return { isValid: true, errors: [] }
    }

    // Check cache first
    const cacheKey = state.currentStep
    const cached = validationCacheRef.current[cacheKey]
    if (cached) {
      return cached
    }

    try {
      setState(prev => ({ ...prev, isLoading: true }))
      const result = await validateStep(state.currentStep, state.formData)
      
      // Cache the result
      validationCacheRef.current[cacheKey] = result
      
      setState(prev => ({
        ...prev,
        isLoading: false,
        isValid: result.isValid,
        stepErrors: { ...prev.stepErrors, [state.currentStep]: result.errors }
      }))
      
      return result
    } catch (error) {
      console.error('Step validation failed:', error)
      setState(prev => ({ ...prev, isLoading: false, isValid: false }))
      return { isValid: false, errors: ['Validation failed'] }
    }
  }, [validateStep, state.currentStep, state.formData])

  // Clear validation cache when form data changes
  const clearValidationCache = useCallback((step?: number) => {
    if (step) {
      delete validationCacheRef.current[step]
    } else {
      validationCacheRef.current = {}
    }
  }, [])

  // Navigate to next step
  const nextStep = useCallback(async () => {
    if (state.currentStep >= totalSteps) return false

    // Validate current step before proceeding
    const validation = await validateCurrentStep()
    if (!validation.isValid) {
      return false
    }

    const nextStepNumber = state.currentStep + 1
    
    setState(prev => ({
      ...prev,
      currentStep: nextStepNumber,
      completedSteps: new Set(Array.from(prev.completedSteps).concat(prev.currentStep)),
      visitedSteps: new Set(Array.from(prev.visitedSteps).concat(nextStepNumber)),
      isValid: false // Reset validation for new step
    }))

    onStepChange?.(nextStepNumber, 'next')
    return true
  }, [state.currentStep, totalSteps, validateCurrentStep, onStepChange])

  // Navigate to previous step
  const previousStep = useCallback(() => {
    if (state.currentStep <= 1) return false

    const prevStepNumber = state.currentStep - 1
    
    setState(prev => ({
      ...prev,
      currentStep: prevStepNumber,
      isValid: prev.completedSteps.has(prevStepNumber) // Previous step was completed
    }))

    onStepChange?.(prevStepNumber, 'previous')
    return true
  }, [state.currentStep, onStepChange])

  // Jump to specific step
  const goToStep = useCallback(async (step: number) => {
    if (step < 1 || step > totalSteps) return false
    if (step === state.currentStep) return true

    // Check if step jumping is allowed
    if (!allowSkipSteps && !state.visitedSteps.has(step)) {
      // Only allow going to next unvisited step if all previous steps are completed
      const requiredSteps = Array.from({ length: step - 1 }, (_, i) => i + 1)
      const allPreviousCompleted = requiredSteps.every(s => state.completedSteps.has(s))
      if (!allPreviousCompleted) {
        return false
      }
    }

    // If going forward, validate current step
    if (step > state.currentStep) {
      const validation = await validateCurrentStep()
      if (!validation.isValid) {
        return false
      }
      setState(prev => ({
        ...prev,
        completedSteps: new Set(Array.from(prev.completedSteps).concat(prev.currentStep))
      }))
    }

    setState(prev => ({
      ...prev,
      currentStep: step,
      visitedSteps: new Set(Array.from(prev.visitedSteps).concat(step)),
      isValid: prev.completedSteps.has(step)
    }))

    onStepChange?.(step, step > state.currentStep ? 'next' : 'previous')
    return true
  }, [state.currentStep, totalSteps, allowSkipSteps, state.visitedSteps, state.completedSteps, validateCurrentStep, onStepChange])

  // Update form data
  const updateFormData = useCallback((data: Partial<Record<string, any>>) => {
    setState(prev => ({
      ...prev,
      formData: { ...prev.formData, ...data },
      isDirty: true
    }))
    
    // Clear validation cache for current step when data changes
    clearValidationCache(state.currentStep)
  }, [state.currentStep, clearValidationCache])

  // Update specific field
  const updateField = useCallback((fieldName: string, value: any) => {
    updateFormData({ [fieldName]: value })
  }, [updateFormData])

  // Set loading state
  const setLoading = useCallback((isLoading: boolean) => {
    setState(prev => ({ ...prev, isLoading }))
  }, [])

  // Set validation state
  const setValid = useCallback((isValid: boolean) => {
    setState(prev => ({ ...prev, isValid }))
  }, [])

  // Complete the wizard
  const complete = useCallback(async () => {
    // Validate all steps
    setState(prev => ({ ...prev, isLoading: true }))
    
    try {
      if (validateStep) {
        for (let step = 1; step <= totalSteps; step++) {
          const validation = await validateStep(step, state.formData)
          if (!validation.isValid) {
            setState(prev => ({
              ...prev,
              isLoading: false,
              currentStep: step,
              stepErrors: { ...prev.stepErrors, [step]: validation.errors }
            }))
            return false
          }
        }
      }

      await onComplete?.(state.formData)
      
      // Clear persisted data on successful completion
      if (persistKey && typeof window !== 'undefined') {
        localStorage.removeItem(`form-wizard-${persistKey}`)
      }
      
      setState(prev => ({ ...prev, isLoading: false }))
      return true
    } catch (error) {
      console.error('Form completion failed:', error)
      setState(prev => ({ ...prev, isLoading: false }))
      return false
    }
  }, [validateStep, totalSteps, state.formData, onComplete, persistKey])

  // Reset wizard
  const reset = useCallback(() => {
    setState({
      currentStep: 1,
      totalSteps,
      formData: initialData,
      isValid: false,
      isLoading: false,
      completedSteps: new Set<number>(),
      visitedSteps: new Set([1]),
      stepErrors: {},
      isDirty: false,
      lastSavedData: initialData
    })
    
    // Clear validation cache
    validationCacheRef.current = {}
    
    // Clear persisted data
    if (persistKey && typeof window !== 'undefined') {
      localStorage.removeItem(`form-wizard-${persistKey}`)
    }
  }, [totalSteps, initialData, persistKey])

  // Get step status
  const getStepStatus = useCallback((step: number) => {
    if (step === state.currentStep) return 'current'
    if (state.completedSteps.has(step)) return 'completed'
    if (state.visitedSteps.has(step)) return 'visited'
    return 'unvisited'
  }, [state.currentStep, state.completedSteps, state.visitedSteps])

  // Check if step can be accessed
  const canAccessStep = useCallback((step: number) => {
    if (allowSkipSteps) return true
    if (step <= state.currentStep) return true
    
    // Can access next step if current step is completed
    if (step === state.currentStep + 1 && state.completedSteps.has(state.currentStep)) {
      return true
    }
    
    return false
  }, [allowSkipSteps, state.currentStep, state.completedSteps])

  return {
    // State
    ...state,
    
    // Computed properties
    isFirstStep: state.currentStep === 1,
    isLastStep: state.currentStep === totalSteps,
    canGoNext: state.currentStep < totalSteps,
    canGoPrevious: state.currentStep > 1,
    progress: (state.completedSteps.size / totalSteps) * 100,
    
    // Actions
    nextStep,
    previousStep,
    goToStep,
    updateFormData,
    updateField,
    setLoading,
    setValid,
    complete,
    reset,
    validateCurrentStep,
    saveFormData,
    clearValidationCache,
    
    // Utilities
    getStepStatus,
    canAccessStep
  }
}