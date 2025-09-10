import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import EnhancedInput from '../EnhancedInput'

describe('EnhancedInput', () => {
  const defaultProps = {
    label: 'Test Input',
    name: 'testInput',
    value: '',
    onChange: jest.fn(),
  }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should render input with label', () => {
    render(<EnhancedInput {...defaultProps} />)
    
    expect(screen.getByLabelText('Test Input')).toBeInTheDocument()
    expect(screen.getByRole('textbox')).toBeInTheDocument()
  })

  it('should display current value', () => {
    render(<EnhancedInput {...defaultProps} value="test value" />)
    
    const input = screen.getByRole('textbox')
    expect(input).toHaveValue('test value')
  })

  it('should call onChange when value changes', async () => {
    const user = userEvent.setup()
    const mockOnChange = jest.fn()
    
    render(<EnhancedInput {...defaultProps} onChange={mockOnChange} />)
    
    const input = screen.getByRole('textbox')
    await user.type(input, 'new value')
    
    expect(mockOnChange).toHaveBeenCalledWith('new value')
  })

  it('should call onBlur when input loses focus', async () => {
    const user = userEvent.setup()
    const mockOnBlur = jest.fn()
    
    render(<EnhancedInput {...defaultProps} onBlur={mockOnBlur} />)
    
    const input = screen.getByRole('textbox')
    await user.click(input)
    await user.tab()
    
    expect(mockOnBlur).toHaveBeenCalled()
  })

  it('should display error message when error prop is provided', () => {
    render(<EnhancedInput {...defaultProps} error="This field is required" />)
    
    expect(screen.getByText('This field is required')).toBeInTheDocument()
    expect(screen.getByRole('textbox')).toHaveClass('error')
  })

  it('should show required indicator when required prop is true', () => {
    render(<EnhancedInput {...defaultProps} required />)
    
    expect(screen.getByText('*')).toBeInTheDocument()
  })

  it('should be disabled when disabled prop is true', () => {
    render(<EnhancedInput {...defaultProps} disabled />)
    
    const input = screen.getByRole('textbox')
    expect(input).toBeDisabled()
  })

  it('should display placeholder text', () => {
    render(<EnhancedInput {...defaultProps} placeholder="Enter text here" />)
    
    const input = screen.getByRole('textbox')
    expect(input).toHaveAttribute('placeholder', 'Enter text here')
  })

  it('should handle different input types', () => {
    render(<EnhancedInput {...defaultProps} type="email" />)
    
    const input = screen.getByRole('textbox')
    expect(input).toHaveAttribute('type', 'email')
  })

  it('should handle password input type', () => {
    render(<EnhancedInput {...defaultProps} type="password" />)
    
    const input = screen.getByLabelText('Test Input')
    expect(input).toHaveAttribute('type', 'password')
  })

  it('should handle number input type', () => {
    render(<EnhancedInput {...defaultProps} type="number" />)
    
    const input = screen.getByRole('spinbutton')
    expect(input).toHaveAttribute('type', 'number')
  })

  it('should apply custom className', () => {
    render(<EnhancedInput {...defaultProps} className="custom-input" />)
    
    const container = screen.getByTestId('enhanced-input-container')
    expect(container).toHaveClass('custom-input')
  })

  it('should have proper accessibility attributes', () => {
    render(
      <EnhancedInput 
        {...defaultProps} 
        required 
        error="Invalid input"
      />
    )
    
    const input = screen.getByRole('textbox')
    expect(input).toHaveAttribute('aria-required', 'true')
    expect(input).toHaveAttribute('aria-invalid', 'true')
    expect(input).toHaveAttribute('aria-describedby')
  })

  it('should focus input when label is clicked', async () => {
    const user = userEvent.setup()
    render(<EnhancedInput {...defaultProps} />)
    
    const label = screen.getByText('Test Input')
    await user.click(label)
    
    const input = screen.getByRole('textbox')
    expect(input).toHaveFocus()
  })

  it('should handle controlled input correctly', async () => {
    const user = userEvent.setup()
    const mockOnChange = jest.fn()
    
    const { rerender } = render(
      <EnhancedInput {...defaultProps} value="initial" onChange={mockOnChange} />
    )
    
    const input = screen.getByRole('textbox')
    expect(input).toHaveValue('initial')
    
    await user.clear(input)
    await user.type(input, 'updated')
    
    expect(mockOnChange).toHaveBeenCalledWith('updated')
    
    // Simulate parent component updating the value
    rerender(
      <EnhancedInput {...defaultProps} value="updated" onChange={mockOnChange} />
    )
    
    expect(input).toHaveValue('updated')
  })

  it('should show loading state when specified', () => {
    render(<EnhancedInput {...defaultProps} isLoading />)
    
    expect(screen.getByTestId('input-loading-indicator')).toBeInTheDocument()
    const input = screen.getByRole('textbox')
    expect(input).toBeDisabled()
  })

  it('should handle validation states visually', () => {
    const { rerender } = render(<EnhancedInput {...defaultProps} />)
    
    let input = screen.getByRole('textbox')
    expect(input).not.toHaveClass('error', 'success')
    
    // Error state
    rerender(<EnhancedInput {...defaultProps} error="Error message" />)
    input = screen.getByRole('textbox')
    expect(input).toHaveClass('error')
    
    // Success state (no error and has value)
    rerender(<EnhancedInput {...defaultProps} value="valid input" />)
    input = screen.getByRole('textbox')
    expect(input).toHaveClass('success')
  })

  it('should handle keyboard events', async () => {
    const user = userEvent.setup()
    const mockOnKeyDown = jest.fn()
    
    render(<EnhancedInput {...defaultProps} onKeyDown={mockOnKeyDown} />)
    
    const input = screen.getByRole('textbox')
    await user.type(input, '{enter}')
    
    expect(mockOnKeyDown).toHaveBeenCalledWith(
      expect.objectContaining({ key: 'Enter' })
    )
  })

  it('should clear input when clear button is clicked', async () => {
    const user = userEvent.setup()
    const mockOnChange = jest.fn()
    
    render(
      <EnhancedInput 
        {...defaultProps} 
        value="some text" 
        onChange={mockOnChange}
        clearable
      />
    )
    
    const clearButton = screen.getByTestId('input-clear-button')
    await user.click(clearButton)
    
    expect(mockOnChange).toHaveBeenCalledWith('')
  })

  it('should not show clear button when input is empty', () => {
    render(<EnhancedInput {...defaultProps} value="" clearable />)
    
    expect(screen.queryByTestId('input-clear-button')).not.toBeInTheDocument()
  })

  it('should handle input validation on blur', async () => {
    const user = userEvent.setup()
    const mockValidate = jest.fn().mockReturnValue('Validation error')
    
    render(
      <EnhancedInput 
        {...defaultProps} 
        validate={mockValidate}
        value="test"
      />
    )
    
    const input = screen.getByRole('textbox')
    await user.click(input)
    await user.tab()
    
    await waitFor(() => {
      expect(mockValidate).toHaveBeenCalledWith('test')
      expect(screen.getByText('Validation error')).toBeInTheDocument()
    })
  })
})