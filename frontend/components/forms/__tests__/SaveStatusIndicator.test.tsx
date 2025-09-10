import React from 'react'
import { render, screen } from '@testing-library/react'
import SaveStatusIndicator from '../SaveStatusIndicator'

describe('SaveStatusIndicator', () => {
  it('should not render when status is idle and no unsaved changes', () => {
    render(
      <SaveStatusIndicator 
        status="idle" 
        hasUnsavedChanges={false}
      />
    )
    
    expect(screen.queryByTestId('save-status-indicator')).not.toBeInTheDocument()
  })

  it('should show saving status with loading animation', () => {
    render(<SaveStatusIndicator status="saving" />)
    
    expect(screen.getByText('Saving...')).toBeInTheDocument()
    expect(screen.getByTestId('loading-icon')).toBeInTheDocument()
  })

  it('should show saved status with timestamp', () => {
    const lastSaved = new Date(Date.now() - 5000) // 5 seconds ago
    
    render(
      <SaveStatusIndicator 
        status="saved" 
        lastSaved={lastSaved}
      />
    )
    
    expect(screen.getByText(/Saved/)).toBeInTheDocument()
    expect(screen.getByText(/5s ago/)).toBeInTheDocument()
  })

  it('should show error status with error message', () => {
    render(
      <SaveStatusIndicator 
        status="error" 
        error="Network error"
      />
    )
    
    expect(screen.getByText('Save failed')).toBeInTheDocument()
    expect(screen.getByText('Network error')).toBeInTheDocument()
  })

  it('should show unsaved changes indicator', () => {
    render(
      <SaveStatusIndicator 
        status="idle" 
        hasUnsavedChanges={true}
      />
    )
    
    expect(screen.getByText('Unsaved changes')).toBeInTheDocument()
  })

  it('should render in compact mode', () => {
    render(
      <SaveStatusIndicator 
        status="saved" 
        lastSaved={new Date()}
        compact={true}
      />
    )
    
    const indicator = screen.getByTestId('save-status-indicator')
    expect(indicator).toHaveClass('compact')
  })

  it('should hide text when showText is false', () => {
    render(
      <SaveStatusIndicator 
        status="saving" 
        showText={false}
      />
    )
    
    expect(screen.queryByText('Saving...')).not.toBeInTheDocument()
    expect(screen.getByTestId('loading-icon')).toBeInTheDocument()
  })

  it('should apply custom className', () => {
    render(
      <SaveStatusIndicator 
        status="saved" 
        className="custom-indicator"
      />
    )
    
    const indicator = screen.getByTestId('save-status-indicator')
    expect(indicator).toHaveClass('custom-indicator')
  })

  it('should format different time intervals correctly', () => {
    const testCases = [
      { seconds: 5, expected: '5s ago' },
      { seconds: 65, expected: '1m ago' },
      { seconds: 3665, expected: '1:01' }, // Over an hour, show time
    ]

    testCases.forEach(({ seconds, expected }) => {
      const lastSaved = new Date(Date.now() - seconds * 1000)
      
      const { unmount } = render(
        <SaveStatusIndicator 
          status="saved" 
          lastSaved={lastSaved}
        />
      )
      
      expect(screen.getByText(new RegExp(expected))).toBeInTheDocument()
      unmount()
    })
  })

  it('should handle just now timestamp', () => {
    const lastSaved = new Date(Date.now() - 500) // 0.5 seconds ago
    
    render(
      <SaveStatusIndicator 
        status="saved" 
        lastSaved={lastSaved}
      />
    )
    
    expect(screen.getByText(/just now/)).toBeInTheDocument()
  })

  it('should have proper accessibility attributes', () => {
    render(
      <SaveStatusIndicator 
        status="saving"
        aria-label="Save status"
      />
    )
    
    const indicator = screen.getByTestId('save-status-indicator')
    expect(indicator).toHaveAttribute('role', 'status')
    expect(indicator).toHaveAttribute('aria-live', 'polite')
  })

  it('should animate status changes', () => {
    const { rerender } = render(<SaveStatusIndicator status="idle" />)
    
    // Change to saving
    rerender(<SaveStatusIndicator status="saving" />)
    
    const indicator = screen.getByTestId('save-status-indicator')
    expect(indicator).toHaveClass('animate-in')
  })

  it('should show different icons for different statuses', () => {
    const statuses = [
      { status: 'saving', iconTestId: 'loading-icon' },
      { status: 'saved', iconTestId: 'check-icon' },
      { status: 'error', iconTestId: 'error-icon' },
    ] as const

    statuses.forEach(({ status, iconTestId }) => {
      const { unmount } = render(<SaveStatusIndicator status={status} />)
      
      expect(screen.getByTestId(iconTestId)).toBeInTheDocument()
      unmount()
    })
  })
})