import { renderHook, act } from '@testing-library/react'
import { useFormPersistence } from '../useFormPersistence'

// Mock localStorage
const mockLocalStorage = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
}
Object.defineProperty(window, 'localStorage', {
  value: mockLocalStorage,
})

describe('useFormPersistence', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockLocalStorage.getItem.mockReturnValue(null)
    jest.useFakeTimers()
  })

  afterEach(() => {
    jest.useRealTimers()
  })

  it('should initialize with default state', () => {
    const { result } = renderHook(() => 
      useFormPersistence('test-key', { name: 'initial' })
    )

    expect(result.current.data).toEqual({ name: 'initial' })
    expect(result.current.isLoaded).toBe(false)
    expect(result.current.isLoading).toBe(true)
    expect(result.current.isSaving).toBe(false)
    expect(result.current.hasUnsavedChanges).toBe(false)
    expect(result.current.hasSavedData).toBe(false)
    expect(result.current.saveStatus).toBe('idle')
  })

  it('should load saved data on mount', async () => {
    const savedData = JSON.stringify({
      data: { name: 'saved', email: 'test@example.com' },
      timestamp: Date.now(),
      version: '1.0'
    })
    mockLocalStorage.getItem.mockReturnValue(savedData)

    const mockOnRestore = jest.fn()

    const { result } = renderHook(() => 
      useFormPersistence('test-key', { name: 'initial' }, {
        onRestore: mockOnRestore
      })
    )

    // Wait for async loading
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0))
    })

    expect(result.current.data).toEqual({ name: 'saved', email: 'test@example.com' })
    expect(result.current.isLoaded).toBe(true)
    expect(result.current.isLoading).toBe(false)
    expect(result.current.hasSavedData).toBe(true)
    expect(mockOnRestore).toHaveBeenCalledWith({ name: 'saved', email: 'test@example.com' })
  })

  it('should handle expired data', async () => {
    const expiredData = JSON.stringify({
      data: { name: 'expired' },
      timestamp: Date.now() - (25 * 60 * 60 * 1000), // 25 hours ago
      version: '1.0'
    })
    mockLocalStorage.getItem.mockReturnValue(expiredData)

    const { result } = renderHook(() => 
      useFormPersistence('test-key', { name: 'initial' }, {
        maxAge: 24 * 60 * 60 * 1000 // 24 hours
      })
    )

    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0))
    })

    expect(result.current.data).toEqual({ name: 'initial' })
    expect(result.current.hasSavedData).toBe(false)
    expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('form-test-key')
  })

  it('should save data with auto-save', async () => {
    const mockOnSave = jest.fn()

    const { result } = renderHook(() => 
      useFormPersistence('test-key', {}, {
        autoSave: true,
        autoSaveDelay: 1000,
        onSave: mockOnSave
      })
    )

    // Wait for initial loading
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0))
    })

    // Update data
    act(() => {
      result.current.saveData({ name: 'test' })
    })

    expect(result.current.hasUnsavedChanges).toBe(true)

    // Fast-forward time to trigger auto-save
    act(() => {
      jest.advanceTimersByTime(1000)
    })

    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0))
    })

    expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
      'form-test-key',
      expect.stringContaining('"name":"test"')
    )
    expect(result.current.hasUnsavedChanges).toBe(false)
    expect(result.current.saveStatus).toBe('saved')
    expect(mockOnSave).toHaveBeenCalledWith({ name: 'test' })
  })

  it('should save immediately when requested', async () => {
    const { result } = renderHook(() => 
      useFormPersistence('test-key', {})
    )

    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0))
    })

    await act(async () => {
      await result.current.saveData({ name: 'immediate' }, true)
    })

    expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
      'form-test-key',
      expect.stringContaining('"name":"immediate"')
    )
    expect(result.current.saveStatus).toBe('saved')
  })

  it('should update individual fields', async () => {
    const { result } = renderHook(() => 
      useFormPersistence('test-key', { name: 'initial' })
    )

    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0))
    })

    act(() => {
      result.current.updateField('email', 'test@example.com')
    })

    expect(result.current.data).toEqual({
      name: 'initial',
      email: 'test@example.com'
    })
    expect(result.current.hasUnsavedChanges).toBe(true)
  })

  it('should clear saved data', async () => {
    const { result } = renderHook(() => 
      useFormPersistence('test-key', { name: 'initial' })
    )

    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0))
    })

    act(() => {
      result.current.clearData()
    })

    expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('form-test-key')
    expect(result.current.data).toEqual({ name: 'initial' })
    expect(result.current.hasUnsavedChanges).toBe(false)
    expect(result.current.hasSavedData).toBe(false)
  })

  it('should handle save errors', async () => {
    const mockOnError = jest.fn()
    mockLocalStorage.setItem.mockImplementation(() => {
      throw new Error('Storage quota exceeded')
    })

    const { result } = renderHook(() => 
      useFormPersistence('test-key', {}, {
        onError: mockOnError
      })
    )

    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0))
    })

    await act(async () => {
      await result.current.saveData({ name: 'test' }, true)
    })

    expect(result.current.saveStatus).toBe('error')
    expect(result.current.error).toBe('Storage quota exceeded')
    expect(mockOnError).toHaveBeenCalledWith(expect.any(Error))
  })

  it('should handle load errors', async () => {
    const mockOnError = jest.fn()
    mockLocalStorage.getItem.mockReturnValue('invalid json')

    const { result } = renderHook(() => 
      useFormPersistence('test-key', { name: 'initial' }, {
        onError: mockOnError
      })
    )

    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0))
    })

    expect(result.current.isLoaded).toBe(true)
    expect(result.current.error).toBeTruthy()
    expect(result.current.hasSavedData).toBe(false)
    expect(mockOnError).toHaveBeenCalled()
  })

  it('should check for saved data without loading', () => {
    mockLocalStorage.getItem.mockReturnValue('{"data": {}}')

    const { result } = renderHook(() => 
      useFormPersistence('test-key', {})
    )

    const hasSaved = result.current.checkHasSavedData()
    expect(hasSaved).toBe(true)
    expect(mockLocalStorage.getItem).toHaveBeenCalledWith('form-test-key')
  })

  it('should get saved data info', () => {
    const timestamp = Date.now()
    const savedData = JSON.stringify({
      data: { name: 'test' },
      timestamp,
      version: '1.0'
    })
    mockLocalStorage.getItem.mockReturnValue(savedData)

    const { result } = renderHook(() => 
      useFormPersistence('test-key', {})
    )

    const info = result.current.getSavedDataInfo()
    expect(info.hasData).toBe(true)
    expect(info.timestamp).toEqual(new Date(timestamp))
    expect(info.version).toBe('1.0')
  })

  it('should disable auto-save when option is false', async () => {
    const { result } = renderHook(() => 
      useFormPersistence('test-key', {}, {
        autoSave: false
      })
    )

    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0))
    })

    act(() => {
      result.current.saveData({ name: 'test' })
    })

    // Should save immediately when auto-save is disabled
    expect(mockLocalStorage.setItem).toHaveBeenCalled()
    expect(result.current.hasUnsavedChanges).toBe(false)
  })

  it('should reset save status after delay', async () => {
    const { result } = renderHook(() => 
      useFormPersistence('test-key', {})
    )

    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0))
    })

    await act(async () => {
      await result.current.saveData({ name: 'test' }, true)
    })

    expect(result.current.saveStatus).toBe('saved')

    // Fast-forward time to reset status
    act(() => {
      jest.advanceTimersByTime(2000)
    })

    expect(result.current.saveStatus).toBe('idle')
  })
})