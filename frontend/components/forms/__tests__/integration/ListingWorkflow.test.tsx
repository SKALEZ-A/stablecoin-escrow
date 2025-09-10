import React from 'react'
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest'
import { WagmiProvider } from 'wagmi'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ListItemWizard } from '../../index'
import { mockWagmiConfig } from '../mocks/wagmi'

// Mock wagmi hooks
vi.mock('wagmi', async () => {
  const actual = await vi.importActual('wagmi')
  return {
    ...actual,
    useAccount: vi.fn(() => ({
      address: '0x1234567890123456789012345678901234567890',
      isConnected: true
    })),
    useWriteContract: vi.fn(() => ({
      writeContract: vi.fn(),
      data: null,
      isPending: false,
      error: null
    })),
    useWaitForTransactionReceipt: vi.fn(() => ({
      isLoading: false,
      isSuccess: false
    }))
  }
})

// Mock framer-motion
vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
    button: ({ children, ...props }: any) => <button {...props}>{children}</button>
  },
  AnimatePresence: ({ children }: any) => <>{children}</>
}))

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn()
}
Object.defineProperty(window, 'localStorage', {
  value: localStorageMock
})

describe('Listing Creation Workflow Integration Tests', () => {
  let queryClient: QueryClient
  let user: ReturnType<typeof userEvent.setup>
  let mockOnComplete: ReturnType<typeof vi.fn>
  let mockOnCancel: ReturnType<typeof vi.fn>

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false }
      }
    })
    user = userEvent.setup()
    mockOnComplete = vi.fn()
    mockOnCancel = vi.fn()
    
    // Clear localStorage mocks
    localStorageMock.getItem.mockReturnValue(null)
    localStorageMock.setItem.mockClear()
    localStorageMock.removeItem.mockClear()
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  const renderListItemWizard = (props = {}) => {
    return render(
      <WagmiProvider config={mockWagmiConfig}>
        <QueryClientProvider client={queryClient}>
          <ListItemWizard
            onComplete={mockOnComplete}
            onCancel={mockOnCancel}
            {...props}
          />
        </QueryClientProvider>
      </WagmiProvider>
    )
  }

  describe('Complete Listing Creation Flow', () => {
    it('should complete full listing workflow from start to finish', async () => {
      renderListItemWizard()

      // Step 1: Basic Information
      expect(screen.getByText('Basic Information')).toBeInTheDocument()
      expect(screen.getByText('Step 1 of 3')).toBeInTheDocument()

      // Fill out basic information
      const titleInput = screen.getByLabelText(/product title/i)
      const descriptionInput = screen.getByLabelText(/product description/i)
      const priceInput = screen.getByLabelText(/price/i)
      const categorySelect = screen.getByLabelText(/category/i)

      await user.type(titleInput, 'Test Digital Product')
      await user.type(descriptionInput, 'This is a comprehensive test description for our digital product that meets the minimum length requirements.')
      await user.type(priceInput, '29.99')
      await user.selectOptions(categorySelect, 'digital')

      // Verify form validation
      await waitFor(() => {
        expect(titleInput).toHaveValue('Test Digital Product')
        expect(descriptionInput).toHaveValue('This is a comprehensive test description for our digital product that meets the minimum length requirements.')
        expect(priceInput).toHaveValue('29.99')
      })

      // Proceed to next step
      const nextButton = screen.getByRole('button', { name: /next/i })
      expect(nextButton).not.toBeDisabled()
      await user.click(nextButton)

      // Step 2: Details & Media
      await waitFor(() => {
        expect(screen.getByText('Details & Media')).toBeInTheDocument()
        expect(screen.getByText('Step 2 of 3')).toBeInTheDocument()
      })

      // Add tags
      const tagsInput = screen.getByLabelText(/tags/i)
      await user.type(tagsInput, 'digital{enter}')
      await user.type(tagsInput, 'premium{enter}')

      // Add additional details
      const additionalDetailsInput = screen.getByLabelText(/additional details/i)
      await user.type(additionalDetailsInput, 'Additional product information and specifications.')

      // Proceed to next step
      const nextButton2 = screen.getByRole('button', { name: /next/i })
      await user.click(nextButton2)

      // Step 3: Review & Publish
      await waitFor(() => {
        expect(screen.getByText('Review & Publish')).toBeInTheDocument()
        expect(screen.getByText('Step 3 of 3')).toBeInTheDocument()
      })

      // Verify listing preview
      expect(screen.getByText('Test Digital Product')).toBeInTheDocument()
      expect(screen.getByText('29.99 USDC')).toBeInTheDocument()
      expect(screen.getByText('Digital')).toBeInTheDocument()

      // Agree to terms
      const termsCheckbox = screen.getByLabelText(/agree to terms/i)
      await user.click(termsCheckbox)

      // Submit listing
      const submitButton = screen.getByRole('button', { name: /publish listing/i })
      expect(submitButton).not.toBeDisabled()
      await user.click(submitButton)

      // Verify completion callback
      await waitFor(() => {
        expect(mockOnComplete).toHaveBeenCalledWith(
          expect.objectContaining({
            title: 'Test Digital Product',
            description: expect.stringContaining('comprehensive test description'),
            price: '29.99',
            category: 'digital',
            tags: ['digital', 'premium'],
            additionalDetails: 'Additional product information and specifications.',
            agreedToTerms: true
          })
        )
      })
    })

    it('should handle step navigation correctly', async () => {
      renderListItemWizard()

      // Fill step 1 minimally
      await user.type(screen.getByLabelText(/product title/i), 'Test Product')
      await user.type(screen.getByLabelText(/product description/i), 'Test description that is long enough to pass validation.')
      await user.type(screen.getByLabelText(/price/i), '10.00')

      // Go to step 2
      await user.click(screen.getByRole('button', { name: /next/i }))
      
      await waitFor(() => {
        expect(screen.getByText('Step 2 of 3')).toBeInTheDocument()
      })

      // Go back to step 1
      await user.click(screen.getByRole('button', { name: /previous/i }))
      
      await waitFor(() => {
        expect(screen.getByText('Step 1 of 3')).toBeInTheDocument()
        // Verify data is preserved
        expect(screen.getByDisplayValue('Test Product')).toBeInTheDocument()
      })

      // Go forward again
      await user.click(screen.getByRole('button', { name: /next/i }))
      
      await waitFor(() => {
        expect(screen.getByText('Step 2 of 3')).toBeInTheDocument()
      })
    })

    it('should validate required fields and prevent progression', async () => {
      renderListItemWizard()

      // Try to proceed without filling required fields
      const nextButton = screen.getByRole('button', { name: /next/i })
      expect(nextButton).toBeDisabled()

      // Fill only title
      await user.type(screen.getByLabelText(/product title/i), 'Test')
      
      // Should still be disabled
      expect(nextButton).toBeDisabled()

      // Fill description but too short
      await user.type(screen.getByLabelText(/product description/i), 'Short')
      expect(nextButton).toBeDisabled()

      // Fill proper description
      await user.clear(screen.getByLabelText(/product description/i))
      await user.type(screen.getByLabelText(/product description/i), 'This is a proper description that meets the minimum length requirements.')
      
      // Fill price
      await user.type(screen.getByLabelText(/price/i), '5.00')

      // Now should be enabled
      await waitFor(() => {
        expect(nextButton).not.toBeDisabled()
      })
    })

    it('should handle form cancellation', async () => {
      renderListItemWizard()

      // Fill some data
      await user.type(screen.getByLabelText(/product title/i), 'Test Product')

      // Cancel the form
      const cancelButton = screen.getByRole('button', { name: /close/i })
      await user.click(cancelButton)

      expect(mockOnCancel).toHaveBeenCalled()
    })
  })

  describe('Form Persistence Integration', () => {
    it('should save form data automatically', async () => {
      renderListItemWizard()

      // Fill form data
      await user.type(screen.getByLabelText(/product title/i), 'Auto Save Test')
      await user.type(screen.getByLabelText(/product description/i), 'Testing automatic save functionality with proper length.')

      // Wait for auto-save (debounced)
      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 1500))
      })

      // Verify localStorage was called
      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        expect.stringContaining('form-list-item-wizard'),
        expect.stringContaining('Auto Save Test')
      )
    })

    it('should restore form data from localStorage', async () => {
      // Mock saved data
      const savedData = {
        data: {
          title: 'Restored Product',
          description: 'This is a restored description from localStorage.',
          price: '15.99',
          category: 'digital'
        },
        timestamp: Date.now()
      }
      localStorageMock.getItem.mockReturnValue(JSON.stringify(savedData))

      renderListItemWizard()

      // Should show draft recovery modal
      await waitFor(() => {
        expect(screen.getByText('Listing Draft Found')).toBeInTheDocument()
      })

      // Restore the draft
      await user.click(screen.getByRole('button', { name: /restore draft/i }))

      // Verify data is restored
      await waitFor(() => {
        expect(screen.getByDisplayValue('Restored Product')).toBeInTheDocument()
        expect(screen.getByDisplayValue('15.99')).toBeInTheDocument()
      })
    })

    it('should clear saved data on successful submission', async () => {
      const { useWriteContract, useWaitForTransactionReceipt } = await import('wagmi')
      
      // Mock successful transaction
      const mockWriteContract = vi.fn()
      vi.mocked(useWriteContract).mockReturnValue({
        writeContract: mockWriteContract,
        data: '0xabcdef',
        isPending: false,
        error: null
      })
      
      vi.mocked(useWaitForTransactionReceipt).mockReturnValue({
        isLoading: false,
        isSuccess: true
      })

      renderListItemWizard()

      // Complete the form quickly
      await user.type(screen.getByLabelText(/product title/i), 'Test')
      await user.type(screen.getByLabelText(/product description/i), 'Test description that is long enough.')
      await user.type(screen.getByLabelText(/price/i), '10')
      
      // Navigate through steps
      await user.click(screen.getByRole('button', { name: /next/i }))
      await waitFor(() => screen.getByText('Step 2 of 3'))
      
      await user.click(screen.getByRole('button', { name: /next/i }))
      await waitFor(() => screen.getByText('Step 3 of 3'))
      
      // Agree to terms and submit
      await user.click(screen.getByLabelText(/agree to terms/i))
      await user.click(screen.getByRole('button', { name: /publish listing/i }))

      // Verify localStorage is cleared
      await waitFor(() => {
        expect(localStorageMock.removeItem).toHaveBeenCalledWith(
          expect.stringContaining('form-list-item-wizard')
        )
      })
    })
  })

  describe('Error Handling Integration', () => {
    it('should handle validation errors gracefully', async () => {
      renderListItemWizard()

      // Try invalid price
      await user.type(screen.getByLabelText(/price/i), '-5')
      
      // Should show validation error
      await waitFor(() => {
        expect(screen.getByText(/price must be/i)).toBeInTheDocument()
      })

      // Fix the price
      await user.clear(screen.getByLabelText(/price/i))
      await user.type(screen.getByLabelText(/price/i), '5.00')

      // Error should disappear
      await waitFor(() => {
        expect(screen.queryByText(/price must be/i)).not.toBeInTheDocument()
      })
    })

    it('should handle contract errors', async () => {
      const { useWriteContract } = await import('wagmi')
      
      // Mock contract error
      vi.mocked(useWriteContract).mockReturnValue({
        writeContract: vi.fn(),
        data: null,
        isPending: false,
        error: new Error('Contract execution failed')
      })

      renderListItemWizard()

      // Complete form and submit
      await user.type(screen.getByLabelText(/product title/i), 'Test')
      await user.type(screen.getByLabelText(/product description/i), 'Test description that is long enough.')
      await user.type(screen.getByLabelText(/price/i), '10')
      
      // Navigate to final step
      await user.click(screen.getByRole('button', { name: /next/i }))
      await waitFor(() => screen.getByText('Step 2 of 3'))
      await user.click(screen.getByRole('button', { name: /next/i }))
      await waitFor(() => screen.getByText('Step 3 of 3'))
      
      await user.click(screen.getByLabelText(/agree to terms/i))
      await user.click(screen.getByRole('button', { name: /publish listing/i }))

      // Should show error message
      await waitFor(() => {
        expect(screen.getByText(/contract execution failed/i)).toBeInTheDocument()
      })
    })
  })

  describe('Responsive Behavior Integration', () => {
    it('should adapt to mobile viewport', async () => {
      // Mock mobile viewport
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 375
      })

      renderListItemWizard()

      // Should show mobile-optimized layout
      expect(screen.getByText('Step 1 of 3')).toBeInTheDocument()
      
      // Progress indicator should be simplified on mobile
      expect(screen.queryByText('Basic Info')).not.toBeInTheDocument()
    })
  })
})