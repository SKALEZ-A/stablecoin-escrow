# Enhanced Form System Tests

This directory contains comprehensive unit tests for the enhanced form system components and hooks.

## Test Structure

```
__tests__/
├── hooks/
│   ├── useFormValidation.test.ts    # Form validation hook tests
│   ├── useFormWizard.test.ts        # Form wizard hook tests
│   └── useFormPersistence.test.ts   # Form persistence hook tests
├── FormStep.test.tsx                # Form step component tests
├── ProgressIndicator.test.tsx       # Progress indicator tests
├── SaveStatusIndicator.test.tsx     # Save status indicator tests
├── FormDraftRecovery.test.tsx       # Draft recovery modal tests
├── fields/
│   └── EnhancedInput.test.tsx       # Enhanced input field tests
├── index.test.ts                    # Test suite runner
└── README.md                        # This file
```

## Running Tests

### All Tests
```bash
npm test
```

### Watch Mode (for development)
```bash
npm run test:watch
```

### Coverage Report
```bash
npm run test:coverage
```

### CI Mode
```bash
npm run test:ci
```

## Test Coverage

The test suite maintains minimum coverage thresholds:
- **Branches**: 70%
- **Functions**: 70%
- **Lines**: 70%
- **Statements**: 70%

## Testing Framework

- **Jest**: Test runner and assertion library
- **React Testing Library**: Component testing utilities
- **User Event**: User interaction simulation
- **Jest DOM**: Custom Jest matchers for DOM testing

## Test Categories

### 1. Hook Tests
Tests for custom React hooks that manage form state, validation, and persistence.

**Key Test Areas:**
- State initialization and updates
- Async operations (validation, persistence)
- Error handling and recovery
- Side effects and cleanup
- Integration with localStorage

### 2. Component Tests
Tests for React components that render form UI elements.

**Key Test Areas:**
- Rendering and props handling
- User interactions (clicks, typing, focus)
- Accessibility attributes
- Error states and validation
- Responsive behavior

### 3. Integration Scenarios
Tests that verify components work together correctly.

**Key Test Areas:**
- Form wizard flow completion
- Data persistence across steps
- Validation error propagation
- Success and error state handling

## Mocking Strategy

### External Dependencies
- **wagmi hooks**: Mocked to return predictable wallet states
- **Next.js router**: Mocked for navigation testing
- **framer-motion**: Simplified to avoid animation complexity
- **localStorage**: Mocked for persistence testing

### Browser APIs
- **matchMedia**: Mocked for responsive design tests
- **IntersectionObserver**: Mocked for scroll-based features
- **ResizeObserver**: Mocked for dynamic sizing

## Writing New Tests

### Component Test Template
```typescript
import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import YourComponent from '../YourComponent'

describe('YourComponent', () => {
  const defaultProps = {
    // Define minimal required props
  }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should render correctly', () => {
    render(<YourComponent {...defaultProps} />)
    expect(screen.getByRole('...')).toBeInTheDocument()
  })

  it('should handle user interactions', async () => {
    const user = userEvent.setup()
    const mockHandler = jest.fn()
    
    render(<YourComponent {...defaultProps} onAction={mockHandler} />)
    
    await user.click(screen.getByRole('button'))
    expect(mockHandler).toHaveBeenCalled()
  })
})
```

### Hook Test Template
```typescript
import { renderHook, act } from '@testing-library/react'
import { useYourHook } from '../useYourHook'

describe('useYourHook', () => {
  it('should initialize with correct state', () => {
    const { result } = renderHook(() => useYourHook())
    
    expect(result.current.someState).toBe(expectedValue)
  })

  it('should handle state updates', () => {
    const { result } = renderHook(() => useYourHook())
    
    act(() => {
      result.current.updateState(newValue)
    })
    
    expect(result.current.someState).toBe(newValue)
  })
})
```

## Best Practices

### 1. Test Behavior, Not Implementation
- Focus on what the component does, not how it does it
- Test user-visible behavior and outcomes
- Avoid testing internal state or implementation details

### 2. Use Semantic Queries
- Prefer `getByRole`, `getByLabelText`, `getByText`
- Use `getByTestId` only when semantic queries aren't sufficient
- Follow accessibility best practices in queries

### 3. Async Testing
- Use `waitFor` for async operations
- Use `act` when updating state in hooks
- Handle promises and timeouts properly

### 4. Accessibility Testing
- Test keyboard navigation
- Verify ARIA attributes
- Check screen reader compatibility
- Test focus management

### 5. Error Scenarios
- Test error states and error boundaries
- Verify error messages are user-friendly
- Test recovery mechanisms

## Debugging Tests

### Common Issues
1. **Async operations not awaited**: Use `waitFor` or `act`
2. **Missing cleanup**: Clear mocks and timers in `beforeEach`
3. **DOM queries failing**: Check element rendering and accessibility
4. **Mock not working**: Verify mock setup and import order

### Debugging Tools
- `screen.debug()`: Print current DOM state
- `logRoles(container)`: Show available roles
- Jest `--verbose` flag: Detailed test output
- React DevTools: Component inspection

## Future Enhancements

### Planned Test Additions
- Visual regression tests with Storybook
- End-to-end tests with Playwright
- Performance testing with React Profiler
- Accessibility auditing with axe-core

### Integration Test Expansion
- Complete user journeys
- Cross-browser compatibility
- Mobile device testing
- Network failure scenarios