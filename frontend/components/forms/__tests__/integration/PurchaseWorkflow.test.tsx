import React from 'react'
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest'
import { WagmiProvider } from 'wagmi'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { PurchaseCheckout } from '../../index'
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

describe('Purchase Workflow Integration Tests', () => {
  let queryClient: QueryClient
  let user: ReturnType<typeof userEvent.setup>
  let mockOnComplete: ReturnType<typeof vi.fn>
  let mockOnCancel: ReturnType<typeof vi.fn>
  let mockWriteContract: ReturnType<typeof vi.fn>

  const mockItemData = {
    title: 'Test Digital Product',
    price: BigInt('29990000'), // 29.99 USDC (6 decimals)
    creator: '0x9876543210987654321098765432109876543210',
    active: true
  }

  const mockFeeData = {
    platformFee: BigInt('1499500'), // ~1.50 USDC
    creatorPayout: BigInt('28490500') // ~28.49 USDC
  }

  beforeEach(async () => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false }
      }
    })
    user = userEvent.setup()
    mockOnComplete = vi.fn()
    mockOnCancel = vi.fn()
    mockWriteContract = vi.fn()

    const { useWriteContract } = await import('wagmi')
    vi.mocked(useWriteContract).mockReturnValue({
      writeContract: mockWriteContract,
      data: null,
      isPending: false,
      error: null
    })
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  const renderPurchaseCheckout = (props = {}) => {
    return render(
      <WagmiProvider config={mockWagmiConfig}>
        <QueryClientProvider client={queryClient}>
          <PurchaseCheckout
            itemId="1"
            itemData={mockItemData}
            feeData={mockFeeData}
            onComplete={mockOnComplete}
            onCancel={mockOnCancel}
            {...props}
          />
        </QueryClientProvider>
      </WagmiProvider>
    )
  }

  describe('Complete Purchase Flow', () => {
    it('should complete full purchase workflow with USDC approval and purchase', async () => {
      const { useWriteContract, useWaitForTransactionReceipt } = await import('wagmi')
      
      // Mock approval transaction
      let currentHash: string | null = null
      let isApprovalConfirmed = false
      let isPurchaseConfirmed = false

      vi.mocked(useWriteContract).mockReturnValue({
        writeContract: mockWriteContract.mockImplementation(() => {
          if (!currentHash) {
            // First call - approval
            currentHash = '0xapproval123'
          } else {
            // Second call - purchase
            currentHash = '0xpurchase456'
          }
        }),
        data: currentHash,
        isPending: false,
        error: null
      })

      vi.mocked(useWaitForTransactionReceipt).mockImplementation(() => ({
        isLoading: false,
        isSuccess: currentHash === '0xapproval123' ? isApprovalConfirmed : isPurchaseConfirmed
      }))

      renderPurchaseCheckout()

      // Should show item details
      expect(screen.getByText('Test Digital Product')).toBeInTheDocument()
      expect(screen.getByText('29.99')).toBeInTheDocument()
      expect(screen.getByText('Available')).toBeInTheDocument()

      // Should show fee breakdown
      expect(screen.getByText(/platform fee/i)).toBeInTheDocument()
      expect(screen.getByText(/creator gets/i)).toBeInTheDocument()

      // Step 1: Approve USDC spending
      const approveButton = screen.getByRole('button', { name: /approve usdc/i })
      expect(approveButton).toBeInTheDocument()
      await user.click(approveButton)

      // Should call writeContract for approval
      expect(mockWriteContract).toHaveBeenCalledWith(
        expect.objectContaining({
          functionName: 'approve',
          args: expect.arrayContaining([
            expect.any(String), // ESCROW_CONTRACT address
            mockItemData.price
          ])
        })
      )

      // Simulate approval confirmation
      act(() => {
        isApprovalConfirmed = true
      })

      // Step 2: Purchase item
      await waitFor(() => {
        const purchaseButton = screen.getByRole('button', { name: /purchase item/i })
        expect(purchaseButton).toBeInTheDocument()
      })

      const purchaseButton = screen.getByRole('button', { name: /purchase item/i })
      await user.click(purchaseButton)

      // Should call writeContract for purchase
      expect(mockWriteContract).toHaveBeenCalledWith(
        expect.objectContaining({
          functionName: 'buyItem',
          args: [BigInt('1')]
        })
      )

      // Simulate purchase confirmation
      act(() => {
        isPurchaseConfirmed = true
      })

      // Should complete the purchase
      await waitFor(() => {
        expect(mockOnComplete).toHaveBeenCalledWith('0xpurchase456')
      })
    })

    it('should handle purchase cancellation', async () => {
      renderPurchaseCheckout()

      // Cancel the purchase
      const cancelButton = screen.getByRole('button', { name: /close/i })
      await user.click(cancelButton)

      expect(mockOnCancel).toHaveBeenCalled()
    })

    it('should show proper loading states during transactions', async () => {
      const { useWriteContract } = await import('wagmi')
      
      // Mock pending transaction
      vi.mocked(useWriteContract).mockReturnValue({
        writeContract: mockWriteContract,
        data: null,
        isPending: true,
        error: null
      })

      renderPurchaseCheckout()

      const approveButton = screen.getByRole('button', { name: /approve usdc/i })
      await user.click(approveButton)

      // Should show loading state
      expect(screen.getByText(/approving/i)).toBeInTheDocument()
      expect(approveButton).toBeDisabled()
    })
  })

  describe('Error Handling in Purchase Flow', () => {
    it('should handle USDC approval errors', async () => {
      const { useWriteContract } = await import('wagmi')
      
      // Mock approval error
      vi.mocked(useWriteContract).mockReturnValue({
        writeContract: mockWriteContract,
        data: null,
        isPending: false,
        error: new Error('Insufficient USDC balance')
      })

      renderPurchaseCheckout()

      const approveButton = screen.getByRole('button', { name: /approve usdc/i })
      await user.click(approveButton)

      // Should show error message
      await waitFor(() => {
        expect(screen.getByText(/insufficient usdc balance/i)).toBeInTheDocument()
      })

      // Should show retry option
      expect(screen.getByRole('button', { name: /retry/i })).toBeInTheDocument()
    })

    it('should handle purchase transaction errors', async () => {
      const { useWriteContract, useWaitForTransactionReceipt } = await import('wagmi')
      
      // Mock successful approval first
      let callCount = 0
      vi.mocked(useWriteContract).mockImplementation(() => {
        callCount++
        if (callCount === 1) {
          return {
            writeContract: mockWriteContract,
            data: '0xapproval123',
            isPending: false,
            error: null
          }
        } else {
          return {
            writeContract: mockWriteContract,
            data: null,
            isPending: false,
            error: new Error('Transaction failed')
          }
        }
      })

      vi.mocked(useWaitForTransactionReceipt).mockReturnValue({
        isLoading: false,
        isSuccess: true // Approval succeeded
      })

      renderPurchaseCheckout()

      // Complete approval
      const approveButton = screen.getByRole('button', { name: /approve usdc/i })
      await user.click(approveButton)

      // Try purchase (will fail)
      await waitFor(() => {
        const purchaseButton = screen.getByRole('button', { name: /purchase item/i })
        expect(purchaseButton).toBeInTheDocument()
      })

      const purchaseButton = screen.getByRole('button', { name: /purchase item/i })
      await user.click(purchaseButton)

      // Should show purchase error
      await waitFor(() => {
        expect(screen.getByText(/transaction failed/i)).toBeInTheDocument()
      })
    })

    it('should handle wallet disconnection during purchase', async () => {
      const { useAccount } = await import('wagmi')
      
      // Start connected
      vi.mocked(useAccount).mockReturnValue({
        address: undefined,
        isConnected: false
      })

      renderPurchaseCheckout()

      // Should show wallet connection prompt
      expect(screen.getByText(/connect your wallet/i)).toBeInTheDocument()
    })
  })

  describe('Purchase Flow Validation', () => {
    it('should prevent purchase of inactive items', async () => {
      const inactiveItemData = {
        ...mockItemData,
        active: false
      }

      renderPurchaseCheckout({
        itemData: inactiveItemData
      })

      // Should show item as unavailable
      expect(screen.getByText('Sold Out')).toBeInTheDocument()
      
      // Purchase button should be disabled
      const approveButton = screen.queryByRole('button', { name: /approve usdc/i })
      expect(approveButton).toBeDisabled()
    })

    it('should show correct fee calculations', async () => {
      renderPurchaseCheckout()

      // Should display correct amounts
      expect(screen.getByText('29.99')).toBeInTheDocument() // Item price
      expect(screen.getByText(/1\.50/)).toBeInTheDocument() // Platform fee
      expect(screen.getByText(/28\.49/)).toBeInTheDocument() // Creator payout
    })

    it('should handle zero-price items correctly', async () => {
      const freeItemData = {
        ...mockItemData,
        price: BigInt('0')
      }

      const freeFeeData = {
        platformFee: BigInt('0'),
        creatorPayout: BigInt('0')
      }

      renderPurchaseCheckout({
        itemData: freeItemData,
        feeData: freeFeeData
      })

      // Should show free item
      expect(screen.getByText('0.00')).toBeInTheDocument()
      
      // Should still require approval (for 0 amount)
      expect(screen.getByRole('button', { name: /approve usdc/i })).toBeInTheDocument()
    })
  })

  describe('Purchase Flow UI/UX', () => {
    it('should show purchase progress correctly', async () => {
      renderPurchaseCheckout()

      // Initially should show step 1
      expect(screen.getByText(/step 1/i)).toBeInTheDocument()
      expect(screen.getByText(/approve usdc spending/i)).toBeInTheDocument()

      // After approval, should show step 2
      // (This would require mocking the approval success state)
    })

    it('should display item information clearly', async () => {
      renderPurchaseCheckout()

      // Item details
      expect(screen.getByText('Test Digital Product')).toBeInTheDocument()
      expect(screen.getByText(/0x9876...3210/)).toBeInTheDocument() // Truncated creator address
      
      // Purchase terms
      expect(screen.getByText(/all sales are final/i)).toBeInTheDocument()
      expect(screen.getByText(/instant access/i)).toBeInTheDocument()
      expect(screen.getByText(/escrow protection/i)).toBeInTheDocument()
    })

    it('should handle responsive layout', async () => {
      // Mock mobile viewport
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 375
      })

      renderPurchaseCheckout()

      // Should render without errors on mobile
      expect(screen.getByText('Purchase Checkout')).toBeInTheDocument()
      expect(screen.getByText('Test Digital Product')).toBeInTheDocument()
    })
  })

  describe('Transaction Status Tracking', () => {
    it('should track transaction confirmations', async () => {
      const { useWaitForTransactionReceipt } = await import('wagmi')
      
      // Mock confirming transaction
      vi.mocked(useWaitForTransactionReceipt).mockReturnValue({
        isLoading: true,
        isSuccess: false
      })

      renderPurchaseCheckout()

      const approveButton = screen.getByRole('button', { name: /approve usdc/i })
      await user.click(approveButton)

      // Should show confirmation status
      await waitFor(() => {
        expect(screen.getByText(/confirming/i)).toBeInTheDocument()
      })
    })

    it('should provide transaction hash links', async () => {
      const { useWriteContract, useWaitForTransactionReceipt } = await import('wagmi')
      
      vi.mocked(useWriteContract).mockReturnValue({
        writeContract: mockWriteContract,
        data: '0xabcdef123456',
        isPending: false,
        error: null
      })

      vi.mocked(useWaitForTransactionReceipt).mockReturnValue({
        isLoading: false,
        isSuccess: true
      })

      renderPurchaseCheckout()

      const approveButton = screen.getByRole('button', { name: /approve usdc/i })
      await user.click(approveButton)

      // Should show transaction link
      await waitFor(() => {
        const txLink = screen.getByRole('link', { name: /view transaction/i })
        expect(txLink).toHaveAttribute('href', expect.stringContaining('0xabcdef123456'))
      })
    })
  })
})