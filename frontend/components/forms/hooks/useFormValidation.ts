import { useState, useCallback, useRef, useEffect } from 'react'
import { z } from 'zod'
import { FormValidationState } from '../types'
import { validateSchema, validateField as validateSingleField, ValidationResult } from '../schemas'

export interface FormValidationOptions {
  validateOnChange?: boolean
  validateOnBlur?: boolean
  validateOnSubmit?: boolean
  debounceMs?: number
  showErrorsOnlyAfterTouch?: boolean
  customValidators?: Record<string, (value: any) => Promise<string | null>>
}

export interface ExtendedFormValidationState extends FormValidationState {
  warnings: Record<string, string>
  isValidating: boolean
  validationCount: number
  lastValidated: Date | null
  fieldValidationStatus: Record<string, 'idle' | 'validating' | 'valid' | 'invalid'>
}

export const useFormValidation = <T extends z.ZodSchema>(
  schema: T,
  options: FormValidationOptions = {}
) => {
  const {
    validateOnChange = true,
    validateOnBlur = true,
    validateOnSubmit = true,
    debounceMs = 300,
    showErrorsOnlyAfterTouch = true,
    customValidators = {}
  } = options

  const [state, setState] = useState<ExtendedFormValidationState>({
    errors: {},
    warnings: {},
    isValid: false,
    isDirty: false,
    touchedFields: new Set(),
    isValidating: false,
    validationCount: 0,
    lastValidated: null,
    fieldValidationStatus: {}
  })

  const debounceTimeouts = useRef<Record<string, NodeJS.Timeout>>({})
  const validationCache = useRef<Record<string, { value: any; result: ValidationResult }>>({})
  const abortControllers = useRef<Record<string, AbortController>>({})

  // Clear debounce timeouts on unmount
  useEffect(() => {
    return () => {
      Object.values(debounceTimeouts.current).forEach(timeout => clearTimeout(timeout))
      Object.values(abortControllers.current).forEach(controller => controller.abort())
    }
  }, [])

  // Validate a single field
  const validateField = useCallback(async (
    fieldName: string, 
    value: any, 
    formData?: Record<string, any>
  ): Promise<{ isValid: boolean; error?: string; warning?: string }> => {
    // Cancel any ongoing validation for this field
    if (abortControllers.current[fieldName]) {
      abortControllers.current[fieldName].abort()
    }

    const abortController = new AbortController()
    abortControllers.current[fieldName] = abortController

    // Set field as validating
    setState(prev => ({
      ...prev,
      fieldValidationStatus: { ...prev.fieldValidationStatus, [fieldName]: 'validating' },
      touchedFields: new Set(Array.from(prev.touchedFields).concat(fieldName)),
      isDirty: true
    }))

    try {
      // Check cache first
      const cacheKey = `${fieldName}:${JSON.stringify(value)}`
      const cached = validationCache.current[cacheKey]
      if (cached && cached.value === value) {
        const result = {
          isValid: cached.result.isValid,
          error: cached.result.errors[fieldName],
          warning: cached.result.warnings?.[fieldName]
        }
        
        setState(prev => ({
          ...prev,
          errors: { ...prev.errors, [fieldName]: result.error || '' },
          warnings: { ...prev.warnings, [fieldName]: result.warning || '' },
          fieldValidationStatus: { 
            ...prev.fieldValidationStatus, 
            [fieldName]: result.isValid ? 'valid' : 'invalid' 
          }
        }))
        
        return result
      }

      // Schema validation using individual field validator
      const fieldResult = validateSingleField(fieldName, value)
      const schemaResult: ValidationResult = {
        isValid: fieldResult.isValid,
        errors: fieldResult.isValid ? {} : { [fieldName]: fieldResult.error || 'Validation failed' }
      }

      // Custom validation
      let customError: string | null = null
      if (customValidators[fieldName]) {
        try {
          customError = await customValidators[fieldName](value)
        } catch (error) {
          customError = 'Custom validation failed'
        }
      }

      // Check if validation was aborted
      if (abortController.signal.aborted) {
        return { isValid: false, error: 'Validation aborted' }
      }

      // Combine results
      const finalError = customError || schemaResult.errors[fieldName] || ''
      const isValid = !finalError && schemaResult.isValid
      const warning = schemaResult.warnings?.[fieldName]

      // Cache the result
      validationCache.current[cacheKey] = {
        value,
        result: {
          isValid,
          errors: { [fieldName]: finalError },
          warnings: warning ? { [fieldName]: warning } : undefined
        }
      }

      // Update state
      setState(prev => {
        const newErrors = { ...prev.errors }
        const newWarnings = { ...prev.warnings }
        
        if (finalError) {
          newErrors[fieldName] = finalError
        } else {
          delete newErrors[fieldName]
        }
        
        if (warning) {
          newWarnings[fieldName] = warning
        } else {
          delete newWarnings[fieldName]
        }

        return {
          ...prev,
          errors: newErrors,
          warnings: newWarnings,
          fieldValidationStatus: { 
            ...prev.fieldValidationStatus, 
            [fieldName]: isValid ? 'valid' : 'invalid' 
          },
          validationCount: prev.validationCount + 1,
          lastValidated: new Date()
        }
      })

      return { isValid, error: finalError || undefined, warning }

    } catch (error) {
      if (!abortController.signal.aborted) {
        setState(prev => ({
          ...prev,
          errors: { ...prev.errors, [fieldName]: 'Validation error occurred' },
          fieldValidationStatus: { ...prev.fieldValidationStatus, [fieldName]: 'invalid' }
        }))
      }
      return { isValid: false, error: 'Validation error occurred' }
    }
  }, [schema, customValidators])

  // Debounced field validation
  const validateFieldDebounced = useCallback((
    fieldName: string, 
    value: any, 
    formData?: Record<string, any>
  ) => {
    if (debounceTimeouts.current[fieldName]) {
      clearTimeout(debounceTimeouts.current[fieldName])
    }

    debounceTimeouts.current[fieldName] = setTimeout(() => {
      validateField(fieldName, value, formData)
    }, debounceMs)
  }, [validateField, debounceMs])

  // Validate entire form
  const validateForm = useCallback(async (data: Record<string, any>): Promise<ValidationResult> => {
    setState(prev => ({ ...prev, isValidating: true }))

    try {
      // Schema validation
      const schemaResult = validateSchema(schema, data)
      
      // Custom validations
      const customErrors: Record<string, string> = {}
      const customValidationPromises = Object.entries(customValidators).map(async ([fieldName, validator]) => {
        try {
          const error = await validator(data[fieldName])
          if (error) {
            customErrors[fieldName] = error
          }
        } catch (error) {
          customErrors[fieldName] = 'Custom validation failed'
        }
      })

      await Promise.all(customValidationPromises)

      // Combine results
      const allErrors = { ...schemaResult.errors, ...customErrors }
      const isValid = Object.keys(allErrors).length === 0

      setState(prev => ({
        ...prev,
        errors: allErrors,
        warnings: schemaResult.warnings || {},
        isValid,
        isValidating: false,
        validationCount: prev.validationCount + 1,
        lastValidated: new Date(),
        fieldValidationStatus: Object.keys(data).reduce((acc, fieldName) => ({
          ...acc,
          [fieldName]: allErrors[fieldName] ? 'invalid' : 'valid'
        }), {})
      }))

      return { isValid, errors: allErrors, warnings: schemaResult.warnings }

    } catch (error) {
      setState(prev => ({
        ...prev,
        errors: { general: 'Form validation failed' },
        isValid: false,
        isValidating: false
      }))
      return { isValid: false, errors: { general: 'Form validation failed' } }
    }
  }, [schema, customValidators])

  // Handle field change
  const handleFieldChange = useCallback((fieldName: string, value: any, formData?: Record<string, any>) => {
    setState(prev => ({
      ...prev,
      isDirty: true,
      touchedFields: new Set(Array.from(prev.touchedFields).concat(fieldName))
    }))

    if (validateOnChange) {
      validateFieldDebounced(fieldName, value, formData)
    }
  }, [validateOnChange, validateFieldDebounced])

  // Handle field blur
  const handleFieldBlur = useCallback((fieldName: string, value: any, formData?: Record<string, any>) => {
    setState(prev => ({
      ...prev,
      touchedFields: new Set(Array.from(prev.touchedFields).concat(fieldName))
    }))

    if (validateOnBlur) {
      validateField(fieldName, value, formData)
    }
  }, [validateOnBlur, validateField])

  // Clear errors
  const clearErrors = useCallback((fieldNames?: string[]) => {
    setState(prev => {
      if (fieldNames) {
        const newErrors = { ...prev.errors }
        const newWarnings = { ...prev.warnings }
        const newFieldStatus = { ...prev.fieldValidationStatus }
        
        fieldNames.forEach(fieldName => {
          delete newErrors[fieldName]
          delete newWarnings[fieldName]
          newFieldStatus[fieldName] = 'idle'
        })
        
        return {
          ...prev,
          errors: newErrors,
          warnings: newWarnings,
          fieldValidationStatus: newFieldStatus
        }
      } else {
        return {
          ...prev,
          errors: {},
          warnings: {},
          fieldValidationStatus: {}
        }
      }
    })
  }, [])

  // Set field error manually
  const setFieldError = useCallback((fieldName: string, error: string) => {
    setState(prev => ({
      ...prev,
      errors: { ...prev.errors, [fieldName]: error },
      fieldValidationStatus: { ...prev.fieldValidationStatus, [fieldName]: 'invalid' }
    }))
  }, [])

  // Set field warning manually
  const setFieldWarning = useCallback((fieldName: string, warning: string) => {
    setState(prev => ({
      ...prev,
      warnings: { ...prev.warnings, [fieldName]: warning }
    }))
  }, [])

  // Get field error (respecting touch state)
  const getFieldError = useCallback((fieldName: string): string | undefined => {
    if (showErrorsOnlyAfterTouch && !state.touchedFields.has(fieldName)) {
      return undefined
    }
    return state.errors[fieldName] || undefined
  }, [state.errors, state.touchedFields, showErrorsOnlyAfterTouch])

  // Get field warning
  const getFieldWarning = useCallback((fieldName: string): string | undefined => {
    return state.warnings[fieldName] || undefined
  }, [state.warnings])

  // Check if field is valid
  const isFieldValid = useCallback((fieldName: string): boolean => {
    return !state.errors[fieldName] && state.fieldValidationStatus[fieldName] !== 'invalid'
  }, [state.errors, state.fieldValidationStatus])

  // Check if field is touched
  const isFieldTouched = useCallback((fieldName: string): boolean => {
    return state.touchedFields.has(fieldName)
  }, [state.touchedFields])

  // Reset validation state
  const reset = useCallback(() => {
    // Clear all timeouts and abort controllers
    Object.values(debounceTimeouts.current).forEach(timeout => clearTimeout(timeout))
    Object.values(abortControllers.current).forEach(controller => controller.abort())
    debounceTimeouts.current = {}
    abortControllers.current = {}
    validationCache.current = {}

    setState({
      errors: {},
      warnings: {},
      isValid: false,
      isDirty: false,
      touchedFields: new Set(),
      isValidating: false,
      validationCount: 0,
      lastValidated: null,
      fieldValidationStatus: {}
    })
  }, [])

  // Get validation summary
  const getValidationSummary = useCallback(() => {
    const errorCount = Object.keys(state.errors).length
    const warningCount = Object.keys(state.warnings).length
    const touchedCount = state.touchedFields.size
    
    return {
      errorCount,
      warningCount,
      touchedCount,
      isValid: state.isValid,
      isDirty: state.isDirty,
      isValidating: state.isValidating,
      validationCount: state.validationCount,
      lastValidated: state.lastValidated
    }
  }, [state])

  return {
    // State
    ...state,
    
    // Validation functions
    validateField,
    validateForm,
    handleFieldChange,
    handleFieldBlur,
    
    // Error management
    clearErrors,
    setFieldError,
    setFieldWarning,
    getFieldError,
    getFieldWarning,
    
    // Field status
    isFieldValid,
    isFieldTouched,
    
    // Utilities
    reset,
    getValidationSummary
  }
}