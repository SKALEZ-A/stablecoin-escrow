import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import FormDraftRecovery from '../FormDraftRecovery'

describe('FormDraftRecovery', () => {
  const defaultProps = {
    isVisible: true,
    onRestore: jest.fn(),
    onDiscard: jest.fn(),
    onDismiss: jest.fn(),
  }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should render when visible', () => {
    render(<FormDraftRecovery {...defaultProps} />)
    
    expect(screen.getByText('Draft Found')).toBeInTheDocument()
    expect(screen.getByText(/We found a saved draft/)).toBeInTheDocument()
  })

  it('should not render when not visible', () => {
    render(<FormDraftRecovery {...defaultProps} isVisible={false} />)
    
    expect(screen.queryByText('Draft Found')).not.toBeInTheDocument()
  })

  it('should display custom title and description', () => {
    render(
      <FormDraftRecovery 
        {...defaultProps}
        title="Custom Title"
        description="Custom description text"
      />
    )
    
    expect(screen.getByText('Custom Title')).toBeInTheDocument()
    expect(screen.getByText('Custom description text')).toBeInTheDocument()
  })

  it('should display saved date when provided', () => {
    const savedDate = new Date(Date.now() - 60000) // 1 minute ago
    
    render(
      <FormDraftRecovery 
        {...defaultProps}
        savedDate={savedDate}
      />
    )
    
    expect(screen.getByText(/Saved 1 minute ago/)).toBeInTheDocument()
  })

  it('should call onRestore when restore button is clicked', async () => {
    const user = userEvent.setup()
    const mockOnRestore = jest.fn()
    
    render(
      <FormDraftRecovery 
        {...defaultProps}
        onRestore={mockOnRestore}
      />
    )
    
    const restoreButton = screen.getByRole('button', { name: /restore draft/i })
    await user.click(restoreButton)
    
    expect(mockOnRestore).toHaveBeenCalledTimes(1)
  })

  it('should call onDiscard when start fresh button is clicked', async () => {
    const user = userEvent.setup()
    const mockOnDiscard = jest.fn()
    
    render(
      <FormDraftRecovery 
        {...defaultProps}
        onDiscard={mockOnDiscard}
      />
    )
    
    const discardButton = screen.getByRole('button', { name: /start fresh/i })
    await user.click(discardButton)
    
    expect(mockOnDiscard).toHaveBeenCalledTimes(1)
  })

  it('should call onDismiss when close button is clicked', async () => {
    const user = userEvent.setup()
    const mockOnDismiss = jest.fn()
    
    render(
      <FormDraftRecovery 
        {...defaultProps}
        onDismiss={mockOnDismiss}
      />
    )
    
    const closeButton = screen.getByRole('button', { name: /close/i })
    await user.click(closeButton)
    
    expect(mockOnDismiss).toHaveBeenCalledTimes(1)
  })

  it('should call onDismiss when clicking outside modal', async () => {
    const user = userEvent.setup()
    const mockOnDismiss = jest.fn()
    
    render(
      <FormDraftRecovery 
        {...defaultProps}
        onDismiss={mockOnDismiss}
      />
    )
    
    const backdrop = screen.getByTestId('modal-backdrop')
    await user.click(backdrop)
    
    expect(mockOnDismiss).toHaveBeenCalledTimes(1)
  })

  it('should not call onDismiss when clicking inside modal content', async () => {
    const user = userEvent.setup()
    const mockOnDismiss = jest.fn()
    
    render(
      <FormDraftRecovery 
        {...defaultProps}
        onDismiss={mockOnDismiss}
      />
    )
    
    const modalContent = screen.getByTestId('modal-content')
    await user.click(modalContent)
    
    expect(mockOnDismiss).not.toHaveBeenCalled()
  })

  it('should handle keyboard navigation', async () => {
    const user = userEvent.setup()
    const mockOnRestore = jest.fn()
    const mockOnDiscard = jest.fn()
    
    render(
      <FormDraftRecovery 
        {...defaultProps}
        onRestore={mockOnRestore}
        onDiscard={mockOnDiscard}
      />
    )
    
    // Tab to restore button and press Enter
    await user.tab()
    await user.keyboard('{Enter}')
    
    expect(mockOnRestore).toHaveBeenCalledTimes(1)
  })

  it('should handle escape key to dismiss', async () => {
    const user = userEvent.setup()
    const mockOnDismiss = jest.fn()
    
    render(
      <FormDraftRecovery 
        {...defaultProps}
        onDismiss={mockOnDismiss}
      />
    )
    
    await user.keyboard('{Escape}')
    
    expect(mockOnDismiss).toHaveBeenCalledTimes(1)
  })

  it('should format different time intervals correctly', () => {
    const testCases = [
      { minutes: 0, expected: 'just now' },
      { minutes: 1, expected: '1 minute ago' },
      { minutes: 5, expected: '5 minutes ago' },
      { minutes: 65, expected: '1 hour ago' },
      { minutes: 1440, expected: '1 day ago' },
      { minutes: 10080, expected: '1 week ago' },
    ]

    testCases.forEach(({ minutes, expected }) => {
      const savedDate = new Date(Date.now() - minutes * 60000)
      
      const { unmount } = render(
        <FormDraftRecovery 
          {...defaultProps}
          savedDate={savedDate}
        />
      )
      
      expect(screen.getByText(new RegExp(expected))).toBeInTheDocument()
      unmount()
    })
  })

  it('should have proper accessibility attributes', () => {
    render(<FormDraftRecovery {...defaultProps} />)
    
    const modal = screen.getByRole('dialog')
    expect(modal).toHaveAttribute('aria-labelledby')
    expect(modal).toHaveAttribute('aria-describedby')
    expect(modal).toHaveAttribute('aria-modal', 'true')
  })

  it('should trap focus within modal', async () => {
    const user = userEvent.setup()
    
    render(<FormDraftRecovery {...defaultProps} />)
    
    const restoreButton = screen.getByRole('button', { name: /restore draft/i })
    const discardButton = screen.getByRole('button', { name: /start fresh/i })
    const closeButton = screen.getByRole('button', { name: /close/i })
    
    // Focus should start on first focusable element
    expect(restoreButton).toHaveFocus()
    
    // Tab through elements
    await user.tab()
    expect(discardButton).toHaveFocus()
    
    await user.tab()
    expect(closeButton).toHaveFocus()
    
    // Tab should wrap back to first element
    await user.tab()
    expect(restoreButton).toHaveFocus()
  })

  it('should animate modal entrance and exit', () => {
    const { rerender } = render(<FormDraftRecovery {...defaultProps} isVisible={false} />)
    
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    
    rerender(<FormDraftRecovery {...defaultProps} isVisible={true} />)
    
    const modal = screen.getByRole('dialog')
    expect(modal).toHaveClass('animate-in')
  })

  it('should show information about what happens next', () => {
    render(<FormDraftRecovery {...defaultProps} />)
    
    expect(screen.getByText('What happens next?')).toBeInTheDocument()
    expect(screen.getByText(/Restore.*Continue where you left off/)).toBeInTheDocument()
    expect(screen.getByText(/Start Fresh.*Begin with a clean form/)).toBeInTheDocument()
  })

  it('should handle very old dates gracefully', () => {
    const veryOldDate = new Date('2020-01-01')
    
    render(
      <FormDraftRecovery 
        {...defaultProps}
        savedDate={veryOldDate}
      />
    )
    
    // Should show formatted date for very old dates
    expect(screen.getByText(/1\/1\/2020/)).toBeInTheDocument()
  })
})