import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import FormStep from '../FormStep'

describe('FormStep', () => {
  const defaultProps = {
    title: 'Test Step',
    description: 'Test description',
    children: <div>Step content</div>,
    isActive: true,
    isCompleted: false,
    canProceed: true,
    isLoading: false,
    stepNumber: 1,
    totalSteps: 3,
    validationErrors: [],
  }

  it('should render step content when active', () => {
    render(<FormStep {...defaultProps} />)
    
    expect(screen.getByText('Test Step')).toBeInTheDocument()
    expect(screen.getByText('Test description')).toBeInTheDocument()
    expect(screen.getByText('Step content')).toBeInTheDocument()
  })

  it('should not render step content when inactive', () => {
    render(<FormStep {...defaultProps} isActive={false} />)
    
    expect(screen.queryByText('Step content')).not.toBeInTheDocument()
  })

  it('should show next button when canProceed is true', () => {
    const mockOnNext = jest.fn()
    render(<FormStep {...defaultProps} onNext={mockOnNext} />)
    
    const nextButton = screen.getByRole('button', { name: /next/i })
    expect(nextButton).toBeInTheDocument()
    expect(nextButton).not.toBeDisabled()
    
    fireEvent.click(nextButton)
    expect(mockOnNext).toHaveBeenCalledTimes(1)
  })

  it('should disable next button when canProceed is false', () => {
    const mockOnNext = jest.fn()
    render(<FormStep {...defaultProps} canProceed={false} onNext={mockOnNext} />)
    
    const nextButton = screen.getByRole('button', { name: /next/i })
    expect(nextButton).toBeDisabled()
    
    fireEvent.click(nextButton)
    expect(mockOnNext).not.toHaveBeenCalled()
  })

  it('should show previous button when onPrevious is provided', () => {
    const mockOnPrevious = jest.fn()
    render(<FormStep {...defaultProps} onPrevious={mockOnPrevious} />)
    
    const prevButton = screen.getByRole('button', { name: /previous/i })
    expect(prevButton).toBeInTheDocument()
    
    fireEvent.click(prevButton)
    expect(mockOnPrevious).toHaveBeenCalledTimes(1)
  })

  it('should not show previous button when onPrevious is not provided', () => {
    render(<FormStep {...defaultProps} />)
    
    expect(screen.queryByRole('button', { name: /previous/i })).not.toBeInTheDocument()
  })

  it('should show loading state', () => {
    render(<FormStep {...defaultProps} isLoading={true} />)
    
    const nextButton = screen.getByRole('button', { name: /next/i })
    expect(nextButton).toBeDisabled()
    // Should show loading indicator
    expect(screen.getByText(/loading/i)).toBeInTheDocument()
  })

  it('should display validation errors', () => {
    const errors = ['Error 1', 'Error 2']
    render(<FormStep {...defaultProps} validationErrors={errors} />)
    
    expect(screen.getByText('Error 1')).toBeInTheDocument()
    expect(screen.getByText('Error 2')).toBeInTheDocument()
  })

  it('should show step progress when stepNumber and totalSteps are provided', () => {
    render(<FormStep {...defaultProps} stepNumber={2} totalSteps={5} />)
    
    expect(screen.getByText('Step 2 of 5')).toBeInTheDocument()
  })

  it('should show complete button on last step', () => {
    const mockOnNext = jest.fn()
    render(
      <FormStep 
        {...defaultProps} 
        stepNumber={3} 
        totalSteps={3} 
        onNext={mockOnNext} 
      />
    )
    
    const completeButton = screen.getByRole('button', { name: /complete/i })
    expect(completeButton).toBeInTheDocument()
    
    fireEvent.click(completeButton)
    expect(mockOnNext).toHaveBeenCalledTimes(1)
  })

  it('should handle completed step state', () => {
    render(<FormStep {...defaultProps} isCompleted={true} />)
    
    // Should show completion indicator
    expect(screen.getByTestId('step-completed-icon')).toBeInTheDocument()
  })

  it('should call onValidationError when validation errors exist', () => {
    const mockOnValidationError = jest.fn()
    const errors = ['Validation error']
    
    render(
      <FormStep 
        {...defaultProps} 
        validationErrors={errors}
        onValidationError={mockOnValidationError}
      />
    )
    
    expect(mockOnValidationError).toHaveBeenCalled()
  })

  it('should have proper accessibility attributes', () => {
    render(<FormStep {...defaultProps} />)
    
    const stepContainer = screen.getByRole('tabpanel')
    expect(stepContainer).toHaveAttribute('aria-labelledby')
    expect(stepContainer).toHaveAttribute('aria-describedby')
  })

  it('should handle keyboard navigation', () => {
    const mockOnNext = jest.fn()
    const mockOnPrevious = jest.fn()
    
    render(
      <FormStep 
        {...defaultProps} 
        onNext={mockOnNext}
        onPrevious={mockOnPrevious}
      />
    )
    
    const stepContainer = screen.getByRole('tabpanel')
    
    // Test Enter key for next
    fireEvent.keyDown(stepContainer, { key: 'Enter', ctrlKey: true })
    expect(mockOnNext).toHaveBeenCalledTimes(1)
    
    // Test Escape key for previous
    fireEvent.keyDown(stepContainer, { key: 'Escape' })
    expect(mockOnPrevious).toHaveBeenCalledTimes(1)
  })

  it('should animate step transitions', () => {
    const { rerender } = render(<FormStep {...defaultProps} isActive={false} />)
    
    // Step should not be visible when inactive
    expect(screen.queryByText('Step content')).not.toBeInTheDocument()
    
    // Activate step
    rerender(<FormStep {...defaultProps} isActive={true} />)
    
    // Step should become visible with animation
    expect(screen.getByText('Step content')).toBeInTheDocument()
  })

  it('should handle custom button text', () => {
    render(
      <FormStep 
        {...defaultProps} 
        onNext={jest.fn()}
        nextButtonText="Continue"
        previousButtonText="Go Back"
        onPrevious={jest.fn()}
      />
    )
    
    expect(screen.getByRole('button', { name: 'Continue' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Go Back' })).toBeInTheDocument()
  })
})