import { renderHook, act } from '@testing-library/react'
import { z } from 'zod'
import { useFormValidation } from '../useFormValidation'

// Test schema
const testSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email format'),
  age: z.number().min(18, 'Must be at least 18 years old'),
})

describe('useFormValidation', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should initialize with default state', () => {
    const { result } = renderHook(() => useFormValidation(testSchema))

    expect(result.current.errors).toEqual({})
    expect(result.current.isValid).toBe(false)
    expect(result.current.isDirty).toBe(false)
    expect(result.current.isValidating).toBe(false)
    expect(result.current.touchedFields.size).toBe(0)
  })

  it('should validate form data correctly', async () => {
    const { result } = renderHook(() => useFormValidation(testSchema))

    const validData = {
      name: 'John Doe',
      email: 'john@example.com',
      age: 25,
    }

    let validationResult
    await act(async () => {
      validationResult = await result.current.validateForm(validData)
    })

    expect(validationResult.isValid).toBe(true)
    expect(validationResult.errors).toEqual({})
    expect(result.current.isValid).toBe(true)
  })

  it('should return validation errors for invalid data', async () => {
    const { result } = renderHook(() => useFormValidation(testSchema))

    const invalidData = {
      name: 'J', // Too short
      email: 'invalid-email', // Invalid format
      age: 16, // Too young
    }

    let validationResult
    await act(async () => {
      validationResult = await result.current.validateForm(invalidData)
    })

    expect(validationResult.isValid).toBe(false)
    expect(validationResult.errors.name).toBe('Name must be at least 2 characters')
    expect(validationResult.errors.email).toBe('Invalid email format')
    expect(validationResult.errors.age).toBe('Must be at least 18 years old')
    expect(result.current.isValid).toBe(false)
  })

  it('should validate individual fields', async () => {
    const { result } = renderHook(() => useFormValidation(testSchema))

    await act(async () => {
      await result.current.validateField('name', 'J')
    })

    expect(result.current.getFieldError('name')).toBe('Name must be at least 2 characters')
    expect(result.current.hasFieldError('name')).toBe(true)

    await act(async () => {
      await result.current.validateField('name', 'John Doe')
    })

    expect(result.current.getFieldError('name')).toBeUndefined()
    expect(result.current.hasFieldError('name')).toBe(false)
  })

  it('should handle field changes with debouncing', async () => {
    const { result } = renderHook(() => 
      useFormValidation(testSchema, { validateOnChange: true, debounceMs: 100 })
    )

    const formData = { name: '', email: '', age: 0 }

    await act(async () => {
      result.current.handleFieldChange('name', 'J', formData)
    })

    expect(result.current.isDirty).toBe(true)
    expect(result.current.touchedFields.has('name')).toBe(true)

    // Wait for debounce
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 150))
    })

    expect(result.current.getFieldError('name')).toBe('Name must be at least 2 characters')
  })

  it('should handle field blur events', async () => {
    const { result } = renderHook(() => 
      useFormValidation(testSchema, { validateOnBlur: true })
    )

    const formData = { name: 'J', email: '', age: 0 }

    await act(async () => {
      result.current.handleFieldBlur('name', 'J', formData)
    })

    expect(result.current.touchedFields.has('name')).toBe(true)
    expect(result.current.getFieldError('name')).toBe('Name must be at least 2 characters')
  })

  it('should clear field errors', () => {
    const { result } = renderHook(() => useFormValidation(testSchema))

    act(() => {
      result.current.setFieldError('name', 'Test error')
    })

    expect(result.current.getFieldError('name')).toBe('Test error')

    act(() => {
      result.current.clearFieldError('name')
    })

    expect(result.current.getFieldError('name')).toBeUndefined()
  })

  it('should clear all errors', () => {
    const { result } = renderHook(() => useFormValidation(testSchema))

    act(() => {
      result.current.setFieldError('name', 'Name error')
      result.current.setFieldError('email', 'Email error')
    })

    expect(Object.keys(result.current.errors)).toHaveLength(2)

    act(() => {
      result.current.clearAllErrors()
    })

    expect(result.current.errors).toEqual({})
  })

  it('should reset validation state', () => {
    const { result } = renderHook(() => useFormValidation(testSchema))

    act(() => {
      result.current.setFieldError('name', 'Test error')
      result.current.touchedFields.add('name')
    })

    expect(result.current.errors.name).toBe('Test error')
    expect(result.current.touchedFields.has('name')).toBe(true)

    act(() => {
      result.current.reset()
    })

    expect(result.current.errors).toEqual({})
    expect(result.current.touchedFields.size).toBe(0)
    expect(result.current.isDirty).toBe(false)
  })

  it('should handle validation with custom options', () => {
    const { result } = renderHook(() => 
      useFormValidation(testSchema, {
        validateOnChange: true,
        validateOnBlur: false,
        debounceMs: 500,
        showErrorsOnlyAfterTouch: true,
      })
    )

    expect(result.current.isValidating).toBe(false)
    // Test that options are applied correctly by checking behavior
  })

  it('should handle async validation errors gracefully', async () => {
    const errorSchema = z.object({
      name: z.string().refine(async () => {
        throw new Error('Async validation error')
      }, 'Async validation failed')
    })

    const { result } = renderHook(() => useFormValidation(errorSchema))

    let validationResult
    await act(async () => {
      validationResult = await result.current.validateForm({ name: 'test' })
    })

    expect(validationResult.isValid).toBe(false)
    expect(result.current.isValidating).toBe(false)
  })
})