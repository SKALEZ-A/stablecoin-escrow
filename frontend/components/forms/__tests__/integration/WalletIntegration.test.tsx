import React from 'react'
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest'
import { WagmiProvider } from 'wagmi'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ListItemWizard, PurchaseCheckout } from '../../index'
import { mockWagmiConfig } from '../mocks/wagmi'

// Mock wagmi hooks with different wallet states
const mockUseAccount = vi.fn()
const mockUseWriteContract = vi.fn()
const mockUseWaitForTransactionReceipt = vi.fn()

vi.mock('wagmi', async () => {
  const actual = await vi.importActual('wagmi')
  return {
    ...actual,
    useAccount: () => mockUseAccount(),
    useWriteContract: () => mockUseWriteContract(),
    useWaitForTransactionReceipt: () => mockUseWaitForTransactionReceipt()
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

describe('Wallet Integration Tests', () => {
  let queryClient: QueryClient
  let user: ReturnType<typeof userEvent.setup>
  let mockOnComplete: ReturnType<typeof vi.fn>
  let mockOnCancel: ReturnType<typeof vi.fn>

  const mockItemData = {
    title: 'Test Product',
    price: BigInt('10000000'), // 10 USDC
    creator: '0x9876543210987654321098765432109876543210',
    active: true
  }

  const mockFeeData = {
    platformFee: BigInt('500000'), // 0.5 USDC
    creatorPayout: BigInt('9500000') // 9.5 USDC
  }

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

    // Default mocks
    mockUseWriteContract.mockReturnValue({
      writeContract: vi.fn(),
      data: null,
      isPending: false,
      error: null
    })

    mockUseWaitForTransactionReceipt.mockReturnValue({
      isLoading: false,
      isSuccess: false
    })
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  const renderWithWallet = (component: React.ReactElement) => {
    return render(
      <WagmiProvider config={mockWagmiConfig}>
        <QueryClientProvider client={queryClient}>
          {component}
        </QueryClientProvider>
      </WagmiProvider>
    )
  }

  describe('Wallet Connection States', () => {
    it('should handle disconnected wallet state', async () => {
      mockUseAccount.mockReturnValue({
        address: undefined,
        isConnected: false
      })

      renderWithWallet(
        <ListItemWizard onComplete={mockOnComplete} onCancel={mockOnCancel} />
      )

      // Should prompt for wallet connection
      expect(screen.getByText(/connect your wallet/i)).toBeInTheDocument()
    })

    it('should handle connected wallet state', async () => {
      mockUseAccount.mockReturnValue({
        address: '0x1234567890123456789012345678901234567890',
        isConnected: true
      })

      renderWithWallet(
        <ListItemWizard onComplete={mockOnComplete} onCancel={mockOnCancel} />
      )

      // Should show the form
      expect(screen.getByText('Basic Information')).toBeInTheDocument()
      
      // Creator address should be pre-populated
      const creatorInput = screen.getByLabelText(/creator address/i)
      expect(creatorInput).toHaveValue('0x1234567890123456789012345678901234567890')
    })

    it('should update creator address when wallet connects', async () => {
      // Start disconnected
      mockUseAccount.mockReturnValue({
        address: undefined,
        isConnected: false
      })

      const { rerender } = renderWithWallet(
        <ListItemWizard onComplete={mockOnComplete} onCancel={mockOnCancel} />
      )

      // Connect wallet
      mockUseAccount.mockReturnValue({
        address: '0x1234567890123456789012345678901234567890',
        isConnected: true
      })

      rerender(
        <WagmiProvider config={mockWagmiConfig}>
          <QueryClientProvider client={queryClient}>
            <ListItemWizard onComplete={mockOnComplete} onCancel={mockOnCancel} />
          </QueryClientProvider>
        </WagmiProvider>
      )

      // Creator address should be updated
      await waitFor(() => {
        const creatorInput = screen.getByLabelText(/creator address/i)
        expect(creatorInput).toHaveValue('0x1234567890123456789012345678901234567890')
      })
    })
  })

  describe('Wallet Address Validation', () => {
    it('should validate Ethereum addresses in listing form', async () => {
      mockUseAccount.mockReturnValue({
        address: '0x1234567890123456789012345678901234567890',
        isConnected: true
      })

      renderWithWallet(
        <ListItemWizard onComplete={mockOnComplete} onCancel={mockOnCancel} />
      )

      const creatorInput = screen.getByLabelText(/creator address/i)
      
      // Test invalid address
      await user.clear(creatorInput)
      await user.type(creatorInput, 'invalid-address')
      
      await waitFor(() => {
        expect(screen.getByText(/invalid ethereum address/i)).toBeInTheDocument()
      })

      // Test valid address
      await user.clear(creatorInput)
      await user.type(creatorInput, '0x9876543210987654321098765432109876543210')
      
      await waitFor(() => {
        expect(screen.queryByText(/invalid ethereum address/i)).not.toBeInTheDocument()
      })
    })

    it('should handle address input formatting', async () => {
      mockUseAccount.mockReturnValue({
        address: '0x1234567890123456789012345678901234567890',
        isConnected: true
      })

      renderWithWallet(
        <ListItemWizard onComplete={mockOnComplete} onCancel={mockOnCancel} />
      )

      const creatorInput = screen.getByLabelText(/creator address/i)
      
      // Test address without 0x prefix
      await user.clear(creatorInput)
      await user.type(creatorInput, '9876543210987654321098765432109876543210')
      
      // Should show validation error for missing 0x
      await waitFor(() => {
        expect(screen.getByText(/invalid ethereum address/i)).toBeInTheDocument()
      })
    })
  })

  describe('Transaction Signing Flow', () => {
    it('should handle user rejection of transaction', async () => {
      mockUseAccount.mockReturnValue({
        address: '0x1234567890123456789012345678901234567890',
        isConnected: true
      })

      mockUseWriteContract.mockReturnValue({
        writeContract: vi.fn(),
        data: null,
        isPending: false,
        error: new Error('User rejected the request')
      })

      renderWithWallet(
        <PurchaseCheckout
          itemId="1"
          itemData={mockItemData}
          feeData={mockFeeData}
          onComplete={mockOnComplete}
          onCancel={mockOnCancel}
        />
      )

      const approveButton = screen.getByRole('button', { name: /approve usdc/i })
      await user.click(approveButton)

      // Should show user rejection message
      await waitFor(() => {
        expect(screen.getByText(/user rejected/i)).toBeInTheDocument()
      })
    })

    it('should handle insufficient gas errors', async () => {
      mockUseAccount.mockReturnValue({
        address: '0x1234567890123456789012345678901234567890',
        isConnected: true
      })

      mockUseWriteContract.mockReturnValue({
        writeContract: vi.fn(),
        data: null,
        isPending: false,
        error: new Error('Insufficient funds for gas')
      })

      renderWithWallet(
        <PurchaseCheckout
          itemId="1"
          itemData={mockItemData}
          feeData={mockFeeData}
          onComplete={mockOnComplete}
          onCancel={mockOnCancel}
        />
      )

      const approveButton = screen.getByRole('button', { name: /approve usdc/i })
      await user.click(approveButton)

      // Should show gas error message
      await waitFor(() => {
        expect(screen.getByText(/insufficient funds for gas/i)).toBeInTheDocument()
      })
    })

    it('should handle network switching requirements', async () => {
      mockUseAccount.mockReturnValue({
        address: '0x1234567890123456789012345678901234567890',
        isConnected: true
      })

      mockUseWriteContract.mockReturnValue({
        writeContract: vi.fn(),
        data: null,
        isPending: false,
        error: new Error('Wrong network. Please switch to Base')
      })

      renderWithWallet(
        <PurchaseCheckout
          itemId="1"
          itemData={mockItemData}
          feeData={mockFeeData}
          onComplete={mockOnComplete}
          onCancel={mockOnCancel}
        />
      )

      const approveButton = screen.getByRole('button', { name: /approve usdc/i })
      await user.click(approveButton)

      // Should show network error
      await waitFor(() => {
        expect(screen.getByText(/wrong network/i)).toBeInTheDocument()
      })
    })
  })

  describe('Multi-Wallet Scenarios', () => {
    it('should handle wallet account switching', async () => {
      // Start with first account
      mockUseAccount.mockReturnValue({
        address: '0x1111111111111111111111111111111111111111',
        isConnected: true
      })

      const { rerender } = renderWithWallet(
        <ListItemWizard onComplete={mockOnComplete} onCancel={mockOnCancel} />
      )

      // Fill some form data
      await user.type(screen.getByLabelText(/product title/i), 'Test Product')

      // Switch to different account
      mockUseAccount.mockReturnValue({
        address: '0x2222222222222222222222222222222222222222',
        isConnected: true
      })

      rerender(
        <WagmiProvider config={mockWagmiConfig}>
          <QueryClientProvider client={queryClient}>
            <ListItemWizard onComplete={mockOnComplete} onCancel={mockOnCancel} />
          </QueryClientProvider>
        </WagmiProvider>
      )

      // Creator address should update to new account
      await waitFor(() => {
        const creatorInput = screen.getByLabelText(/creator address/i)
        expect(creatorInput).toHaveValue('0x2222222222222222222222222222222222222222')
      })

      // Form data should be preserved
      expect(screen.getByDisplayValue('Test Product')).toBeInTheDocument()
    })

    it('should handle wallet disconnection during form filling', async () => {
      // Start connected
      mockUseAccount.mockReturnValue({
        address: '0x1234567890123456789012345678901234567890',
        isConnected: true
      })

      const { rerender } = renderWithWallet(
        <ListItemWizard onComplete={mockOnComplete} onCancel={mockOnCancel} />
      )

      // Fill form data
      await user.type(screen.getByLabelText(/product title/i), 'Test Product')

      // Disconnect wallet
      mockUseAccount.mockReturnValue({
        address: undefined,
        isConnected: false
      })

      rerender(
        <WagmiProvider config={mockWagmiConfig}>
          <QueryClientProvider client={queryClient}>
            <ListItemWizard onComplete={mockOnComplete} onCancel={mockOnCancel} />
          </QueryClientProvider>
        </WagmiProvider>
      )

      // Should show wallet connection prompt
      await waitFor(() => {
        expect(screen.getByText(/connect your wallet/i)).toBeInTheDocument()
      })
    })
  })

  describe('Contract Interaction Edge Cases', () => {
    it('should handle contract not deployed error', async () => {
      mockUseAccount.mockReturnValue({
        address: '0x1234567890123456789012345678901234567890',
        isConnected: true
      })

      mockUseWriteContract.mockReturnValue({
        writeContract: vi.fn(),
        data: null,
        isPending: false,
        error: new Error('Contract not deployed on this network')
      })

      renderWithWallet(
        <PurchaseCheckout
          itemId="1"
          itemData={mockItemData}
          feeData={mockFeeData}
          onComplete={mockOnComplete}
          onCancel={mockOnCancel}
        />
      )

      const approveButton = screen.getByRole('button', { name: /approve usdc/i })
      await user.click(approveButton)

      // Should show contract error
      await waitFor(() => {
        expect(screen.getByText(/contract not deployed/i)).toBeInTheDocument()
      })
    })

    it('should handle transaction timeout', async () => {
      mockUseAccount.mockReturnValue({
        address: '0x1234567890123456789012345678901234567890',
        isConnected: true
      })

      mockUseWriteContract.mockReturnValue({
        writeContract: vi.fn(),
        data: '0xabc123',
        isPending: false,
        error: null
      })

      // Mock long confirmation time
      mockUseWaitForTransactionReceipt.mockReturnValue({
        isLoading: true,
        isSuccess: false
      })

      renderWithWallet(
        <PurchaseCheckout
          itemId="1"
          itemData={mockItemData}
          feeData={mockFeeData}
          onComplete={mockOnComplete}
          onCancel={mockOnCancel}
        />
      )

      const approveButton = screen.getByRole('button', { name: /approve usdc/i })
      await user.click(approveButton)

      // Should show confirming state
      await waitFor(() => {
        expect(screen.getByText(/confirming/i)).toBeInTheDocument()
      })

      // Should provide transaction link for manual checking
      expect(screen.getByRole('link', { name: /view transaction/i })).toBeInTheDocument()
    })
  })

  describe('Wallet Security Features', () => {
    it('should validate transaction parameters before signing', async () => {
      mockUseAccount.mockReturnValue({
        address: '0x1234567890123456789012345678901234567890',
        isConnected: true
      })

      const mockWriteContract = vi.fn()
      mockUseWriteContract.mockReturnValue({
        writeContract: mockWriteContract,
        data: null,
        isPending: false,
        error: null
      })

      renderWithWallet(
        <PurchaseCheckout
          itemId="1"
          itemData={mockItemData}
          feeData={mockFeeData}
          onComplete={mockOnComplete}
          onCancel={mockOnCancel}
        />
      )

      const approveButton = screen.getByRole('button', { name: /approve usdc/i })
      await user.click(approveButton)

      // Should call with correct parameters
      expect(mockWriteContract).toHaveBeenCalledWith(
        expect.objectContaining({
          functionName: 'approve',
          args: expect.arrayContaining([
            expect.any(String), // Contract address
            mockItemData.price // Exact amount
          ])
        })
      )
    })

    it('should prevent double spending attempts', async () => {
      mockUseAccount.mockReturnValue({
        address: '0x1234567890123456789012345678901234567890',
        isConnected: true
      })

      const mockWriteContract = vi.fn()
      mockUseWriteContract.mockReturnValue({
        writeContract: mockWriteContract,
        data: null,
        isPending: true, // Transaction in progress
        error: null
      })

      renderWithWallet(
        <PurchaseCheckout
          itemId="1"
          itemData={mockItemData}
          feeData={mockFeeData}
          onComplete={mockOnComplete}
          onCancel={mockOnCancel}
        />
      )

      const approveButton = screen.getByRole('button', { name: /approve usdc/i })
      
      // First click
      await user.click(approveButton)
      
      // Button should be disabled during transaction
      expect(approveButton).toBeDisabled()
      
      // Second click should not trigger another transaction
      await user.click(approveButton)
      
      // Should only be called once
      expect(mockWriteContract).toHaveBeenCalledTimes(1)
    })
  })
})