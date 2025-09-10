import { createConfig, http } from 'wagmi'
import { base } from 'wagmi/chains'

// Mock Wagmi configuration for testing
export const mockWagmiConfig = createConfig({
  chains: [base],
  transports: {
    [base.id]: http()
  }
})

// Mock contract addresses
export const MOCK_CONTRACTS = {
  ESCROW: '0x1234567890123456789012345678901234567890',
  USDC: '0x0987654321098765432109876543210987654321'
}

// Mock transaction hashes
export const MOCK_TX_HASHES = {
  APPROVAL: '0xapproval123456789abcdef',
  PURCHASE: '0xpurchase123456789abcdef',
  LISTING: '0xlisting123456789abcdef'
}

// Mock wallet addresses
export const MOCK_ADDRESSES = {
  USER: '0x1111111111111111111111111111111111111111',
  CREATOR: '0x2222222222222222222222222222222222222222',
  PLATFORM: '0x3333333333333333333333333333333333333333'
}

// Mock item data for testing
export const MOCK_ITEM_DATA = {
  id: '1',
  title: 'Test Digital Product',
  description: 'A comprehensive test product for integration testing.',
  price: BigInt('29990000'), // 29.99 USDC (6 decimals)
  creator: MOCK_ADDRESSES.CREATOR,
  active: true,
  category: 'digital' as const,
  tags: ['test', 'digital', 'product'],
  createdAt: new Date().toISOString()
}

// Mock fee data
export const MOCK_FEE_DATA = {
  platformFee: BigInt('1499500'), // ~1.50 USDC (5% of 29.99)
  creatorPayout: BigInt('28490500') // ~28.49 USDC (95% of 29.99)
}

// Helper to create mock form data
export const createMockFormData = (overrides = {}) => ({
  title: 'Test Product',
  description: 'This is a test description that meets the minimum length requirements for validation.',
  price: '10.00',
  category: 'digital' as const,
  tags: ['test'],
  additionalDetails: 'Additional test details',
  creatorAddress: MOCK_ADDRESSES.USER,
  agreedToTerms: true,
  ...overrides
})

// Mock localStorage for persistence testing
export const createMockLocalStorage = () => {
  const store: Record<string, string> = {}
  
  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value
    },
    removeItem: (key: string) => {
      delete store[key]
    },
    clear: () => {
      Object.keys(store).forEach(key => delete store[key])
    },
    key: (index: number) => Object.keys(store)[index] || null,
    get length() {
      return Object.keys(store).length
    }
  }
}

// Mock network responses
export const MOCK_NETWORK_RESPONSES = {
  success: {
    hash: MOCK_TX_HASHES.APPROVAL,
    blockNumber: 12345,
    gasUsed: BigInt('21000'),
    status: 'success' as const
  },
  failure: {
    error: 'Transaction failed',
    code: 'TRANSACTION_FAILED'
  },
  pending: {
    hash: MOCK_TX_HASHES.APPROVAL,
    status: 'pending' as const
  }
}