import { renderHook, act } from '@testing-library/react'
import { useFormWizard } from '../useFormWizard'

// Mock localStorage
const mockLocalStorage = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
}
Object.defineProperty(window, 'localStorage', {
  value: mockLocalStorage,
})

describe('useFormWizard', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockLocalStorage.getItem.mockReturnValue(null)
  })

  it('should initialize with correct default state', () => {
    const { result } = renderHook(() => useFormWizard(3, { name: 'test' }))

    expect(result.current.currentStep).toBe(1)
    expect(result.current.totalSteps).toBe(3)
    expect(result.current.formData).toEqual({ name: 'test' })
    expect(result.current.isValid).toBe(false)
    expect(result.current.isLoading).toBe(false)
    expect(result.current.completedSteps.size).toBe(0)
    expect(result.current.visitedSteps.has(1)).toBe(true)
    expect(result.current.isFirstStep).toBe(true)
    expect(result.current.isLastStep).toBe(false)
    expect(result.current.canGoNext).toBe(true)
    expect(result.current.canGoPrevious).toBe(false)
  })

  it('should navigate to next step successfully', async () => {
    const mockValidateStep = jest.fn().mockResolvedValue({ isValid: true, errors: [] })
    const mockOnStepChange = jest.fn()

    const { result } = renderHook(() => 
      useFormWizard(3, {}, {
        validateStep: mockValidateStep,
        onStepChange: mockOnStepChange,
      })
    )

    await act(async () => {
      const success = await result.current.nextStep()
      expect(success).toBe(true)
    })

    expect(result.current.currentStep).toBe(2)
    expect(result.current.completedSteps.has(1)).toBe(true)
    expect(result.current.visitedSteps.has(2)).toBe(true)
    expect(mockValidateStep).toHaveBeenCalledWith(1, {})
    expect(mockOnStepChange).toHaveBeenCalledWith(2, 'next')
  })

  it('should not navigate to next step if validation fails', async () => {
    const mockValidateStep = jest.fn().mockResolvedValue({ 
      isValid: false, 
      errors: ['Validation error'] 
    })

    const { result } = renderHook(() => 
      useFormWizard(3, {}, { validateStep: mockValidateStep })
    )

    await act(async () => {
      const success = await result.current.nextStep()
      expect(success).toBe(false)
    })

    expect(result.current.currentStep).toBe(1)
    expect(result.current.completedSteps.size).toBe(0)
  })

  it('should navigate to previous step', () => {
    const mockOnStepChange = jest.fn()

    const { result } = renderHook(() => 
      useFormWizard(3, {}, { onStepChange: mockOnStepChange })
    )

    // First go to step 2
    act(() => {
      result.current.goToStep(2)
    })

    // Then go back to step 1
    act(() => {
      const success = result.current.previousStep()
      expect(success).toBe(true)
    })

    expect(result.current.currentStep).toBe(1)
    expect(mockOnStepChange).toHaveBeenCalledWith(1, 'previous')
  })

  it('should not go to previous step from first step', () => {
    const { result } = renderHook(() => useFormWizard(3))

    act(() => {
      const success = result.current.previousStep()
      expect(success).toBe(false)
    })

    expect(result.current.currentStep).toBe(1)
  })

  it('should jump to specific step when allowed', async () => {
    const mockValidateStep = jest.fn().mockResolvedValue({ isValid: true, errors: [] })

    const { result } = renderHook(() => 
      useFormWizard(3, {}, { 
        validateStep: mockValidateStep,
        allowSkipSteps: true 
      })
    )

    await act(async () => {
      const success = await result.current.goToStep(3)
      expect(success).toBe(true)
    })

    expect(result.current.currentStep).toBe(3)
    expect(result.current.visitedSteps.has(3)).toBe(true)
  })

  it('should not jump to step when not allowed', async () => {
    const { result } = renderHook(() => 
      useFormWizard(3, {}, { allowSkipSteps: false })
    )

    await act(async () => {
      const success = await result.current.goToStep(3)
      expect(success).toBe(false)
    })

    expect(result.current.currentStep).toBe(1)
  })

  it('should update form data', () => {
    const { result } = renderHook(() => useFormWizard(3, { name: 'initial' }))

    act(() => {
      result.current.updateFormData({ name: 'updated', email: 'test@example.com' })
    })

    expect(result.current.formData).toEqual({
      name: 'updated',
      email: 'test@example.com'
    })
    expect(result.current.isDirty).toBe(true)
  })

  it('should update individual field', () => {
    const { result } = renderHook(() => useFormWizard(3, {}))

    act(() => {
      result.current.updateField('name', 'John Doe')
    })

    expect(result.current.formData.name).toBe('John Doe')
    expect(result.current.isDirty).toBe(true)
  })

  it('should complete wizard successfully', async () => {
    const mockValidateStep = jest.fn().mockResolvedValue({ isValid: true, errors: [] })
    const mockOnComplete = jest.fn().mockResolvedValue(undefined)

    const { result } = renderHook(() => 
      useFormWizard(2, { name: 'test' }, {
        validateStep: mockValidateStep,
        onComplete: mockOnComplete,
      })
    )

    await act(async () => {
      const success = await result.current.complete()
      expect(success).toBe(true)
    })

    expect(mockValidateStep).toHaveBeenCalledTimes(2) // Validates all steps
    expect(mockOnComplete).toHaveBeenCalledWith({ name: 'test' })
  })

  it('should not complete wizard if validation fails', async () => {
    const mockValidateStep = jest.fn()
      .mockResolvedValueOnce({ isValid: true, errors: [] })
      .mockResolvedValueOnce({ isValid: false, errors: ['Step 2 error'] })

    const mockOnComplete = jest.fn()

    const { result } = renderHook(() => 
      useFormWizard(2, {}, {
        validateStep: mockValidateStep,
        onComplete: mockOnComplete,
      })
    )

    await act(async () => {
      const success = await result.current.complete()
      expect(success).toBe(false)
    })

    expect(mockOnComplete).not.toHaveBeenCalled()
    expect(result.current.currentStep).toBe(2) // Should jump to failing step
  })

  it('should reset wizard state', () => {
    const { result } = renderHook(() => useFormWizard(3, { name: 'initial' }))

    // Make some changes
    act(() => {
      result.current.updateField('name', 'changed')
      result.current.goToStep(2)
    })

    expect(result.current.currentStep).toBe(2)
    expect(result.current.formData.name).toBe('changed')

    // Reset
    act(() => {
      result.current.reset()
    })

    expect(result.current.currentStep).toBe(1)
    expect(result.current.formData).toEqual({ name: 'initial' })
    expect(result.current.completedSteps.size).toBe(0)
    expect(result.current.isDirty).toBe(false)
  })

  it('should get correct step status', () => {
    const { result } = renderHook(() => useFormWizard(3))

    expect(result.current.getStepStatus(1)).toBe('current')
    expect(result.current.getStepStatus(2)).toBe('unvisited')

    act(() => {
      result.current.goToStep(2)
    })

    expect(result.current.getStepStatus(1)).toBe('visited')
    expect(result.current.getStepStatus(2)).toBe('current')
  })

  it('should check step accessibility correctly', () => {
    const { result } = renderHook(() => useFormWizard(3, {}, { allowSkipSteps: false }))

    expect(result.current.canAccessStep(1)).toBe(true)
    expect(result.current.canAccessStep(2)).toBe(true) // Next step is accessible
    expect(result.current.canAccessStep(3)).toBe(false) // Can't skip to step 3
  })

  it('should persist data to localStorage when persistKey is provided', () => {
    const { result } = renderHook(() => 
      useFormWizard(3, { name: 'test' }, { persistKey: 'test-wizard' })
    )

    act(() => {
      result.current.updateField('name', 'updated')
    })

    // Should save to localStorage after debounce
    expect(mockLocalStorage.setItem).toHaveBeenCalled()
  })

  it('should load persisted data on initialization', () => {
    const persistedData = JSON.stringify({
      formData: { name: 'persisted' },
      currentStep: 2,
      completedSteps: [1],
      visitedSteps: [1, 2],
      timestamp: Date.now()
    })

    mockLocalStorage.getItem.mockReturnValue(persistedData)

    const { result } = renderHook(() => 
      useFormWizard(3, { name: 'initial' }, { persistKey: 'test-wizard' })
    )

    expect(result.current.formData.name).toBe('persisted')
  })

  it('should calculate progress correctly', () => {
    const { result } = renderHook(() => useFormWizard(4))

    expect(result.current.progress).toBe(0)

    act(() => {
      result.current.completedSteps.add(1)
      result.current.completedSteps.add(2)
    })

    expect(result.current.progress).toBe(50) // 2 out of 4 steps = 50%
  })
})