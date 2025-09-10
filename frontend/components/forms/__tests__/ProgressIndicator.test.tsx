import React from 'react'
import { render, screen } from '@testing-library/react'
import ProgressIndicator from '../ProgressIndicator'

describe('ProgressIndicator', () => {
  const defaultProps = {
    currentStep: 2,
    totalSteps: 4,
  }

  it('should render correct number of steps', () => {
    render(<ProgressIndicator {...defaultProps} />)
    
    // Should render 4 step indicators
    const stepIndicators = screen.getAllByTestId(/step-indicator-/)
    expect(stepIndicators).toHaveLength(4)
  })

  it('should highlight current step', () => {
    render(<ProgressIndicator {...defaultProps} />)
    
    const currentStepIndicator = screen.getByTestId('step-indicator-2')
    expect(currentStepIndicator).toHaveClass('current')
  })

  it('should mark completed steps', () => {
    render(<ProgressIndicator {...defaultProps} />)
    
    const completedStepIndicator = screen.getByTestId('step-indicator-1')
    expect(completedStepIndicator).toHaveClass('completed')
  })

  it('should mark future steps as pending', () => {
    render(<ProgressIndicator {...defaultProps} />)
    
    const pendingStepIndicator = screen.getByTestId('step-indicator-3')
    expect(pendingStepIndicator).toHaveClass('pending')
  })

  it('should display step labels when provided', () => {
    const stepLabels = ['Basic Info', 'Details', 'Review', 'Complete']
    render(
      <ProgressIndicator 
        {...defaultProps} 
        stepLabels={stepLabels}
      />
    )
    
    stepLabels.forEach(label => {
      expect(screen.getByText(label)).toBeInTheDocument()
    })
  })

  it('should display step numbers when no labels provided', () => {
    render(<ProgressIndicator {...defaultProps} />)
    
    expect(screen.getByText('1')).toBeInTheDocument()
    expect(screen.getByText('2')).toBeInTheDocument()
    expect(screen.getByText('3')).toBeInTheDocument()
    expect(screen.getByText('4')).toBeInTheDocument()
  })

  it('should show progress bar with correct percentage', () => {
    render(<ProgressIndicator {...defaultProps} />)
    
    const progressBar = screen.getByTestId('progress-bar')
    // Step 2 of 4 = 25% progress (1 completed step out of 4)
    expect(progressBar).toHaveStyle('width: 25%')
  })

  it('should handle first step correctly', () => {
    render(<ProgressIndicator currentStep={1} totalSteps={3} />)
    
    const currentStepIndicator = screen.getByTestId('step-indicator-1')
    expect(currentStepIndicator).toHaveClass('current')
    
    const progressBar = screen.getByTestId('progress-bar')
    expect(progressBar).toHaveStyle('width: 0%')
  })

  it('should handle last step correctly', () => {
    render(<ProgressIndicator currentStep={4} totalSteps={4} />)
    
    const currentStepIndicator = screen.getByTestId('step-indicator-4')
    expect(currentStepIndicator).toHaveClass('current')
    
    const progressBar = screen.getByTestId('progress-bar')
    expect(progressBar).toHaveStyle('width: 75%')
  })

  it('should apply custom className', () => {
    render(
      <ProgressIndicator 
        {...defaultProps} 
        className="custom-progress"
      />
    )
    
    const container = screen.getByTestId('progress-indicator')
    expect(container).toHaveClass('custom-progress')
  })

  it('should have proper accessibility attributes', () => {
    const stepLabels = ['Step 1', 'Step 2', 'Step 3']
    render(
      <ProgressIndicator 
        currentStep={2}
        totalSteps={3}
        stepLabels={stepLabels}
      />
    )
    
    const progressIndicator = screen.getByTestId('progress-indicator')
    expect(progressIndicator).toHaveAttribute('role', 'progressbar')
    expect(progressIndicator).toHaveAttribute('aria-valuenow', '2')
    expect(progressIndicator).toHaveAttribute('aria-valuemin', '1')
    expect(progressIndicator).toHaveAttribute('aria-valuemax', '3')
    expect(progressIndicator).toHaveAttribute('aria-label', 'Step 2 of 3')
  })

  it('should handle edge cases gracefully', () => {
    // Test with 0 steps
    render(<ProgressIndicator currentStep={0} totalSteps={0} />)
    expect(screen.queryByTestId(/step-indicator-/)).not.toBeInTheDocument()
    
    // Test with negative current step
    render(<ProgressIndicator currentStep={-1} totalSteps={3} />)
    const progressBar = screen.getByTestId('progress-bar')
    expect(progressBar).toHaveStyle('width: 0%')
  })

  it('should show completion state when all steps are done', () => {
    render(<ProgressIndicator currentStep={3} totalSteps={3} />)
    
    const step1 = screen.getByTestId('step-indicator-1')
    const step2 = screen.getByTestId('step-indicator-2')
    const step3 = screen.getByTestId('step-indicator-3')
    
    expect(step1).toHaveClass('completed')
    expect(step2).toHaveClass('completed')
    expect(step3).toHaveClass('current')
  })

  it('should animate progress changes', () => {
    const { rerender } = render(<ProgressIndicator currentStep={1} totalSteps={3} />)
    
    let progressBar = screen.getByTestId('progress-bar')
    expect(progressBar).toHaveStyle('width: 0%')
    
    rerender(<ProgressIndicator currentStep={2} totalSteps={3} />)
    
    progressBar = screen.getByTestId('progress-bar')
    expect(progressBar).toHaveStyle('width: 33.333333333333336%')
  })

  it('should handle very long step labels', () => {
    const longLabels = [
      'This is a very long step label that might overflow',
      'Another extremely long label for testing purposes',
      'Short'
    ]
    
    render(
      <ProgressIndicator 
        currentStep={1}
        totalSteps={3}
        stepLabels={longLabels}
      />
    )
    
    longLabels.forEach(label => {
      expect(screen.getByText(label)).toBeInTheDocument()
    })
  })
})