import { z } from 'zod'

// Custom validation functions
const ethereumAddressRegex = /^0x[a-fA-F0-9]{40}$/
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const urlRegex = /^https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)$/

// Custom Zod validators
const ethereumAddress = z.string()
  .min(1, "Address is required")
  .regex(ethereumAddressRegex, "Invalid Ethereum address format")
  .refine((address) => {
    // Additional checksum validation could be added here
    return address.length === 42
  }, "Ethereum address must be 42 characters long")

const usdcPrice = z.string()
  .min(1, "Price is required")
  .refine((val) => {
    const num = parseFloat(val.replace(/,/g, ''))
    return !isNaN(num)
  }, "Price must be a valid number")
  .refine((val) => {
    const num = parseFloat(val.replace(/,/g, ''))
    return num > 0
  }, "Price must be greater than 0")
  .refine((val) => {
    const num = parseFloat(val.replace(/,/g, ''))
    return num <= 1000000
  }, "Price cannot exceed 1,000,000 USDC")
  .refine((val) => {
    const num = parseFloat(val.replace(/,/g, ''))
    const decimals = val.split('.')[1]
    return !decimals || decimals.length <= 6
  }, "Price can have at most 6 decimal places")

const productTitle = z.string()
  .min(1, "Title is required")
  .min(3, "Title must be at least 3 characters")
  .max(100, "Title must be less than 100 characters")
  .refine((val) => val.trim().length > 0, "Title cannot be only whitespace")
  .refine((val) => !/^\d+$/.test(val), "Title cannot be only numbers")
  .refine((val) => {
    const words = val.trim().split(/\s+/)
    return words.length >= 2
  }, "Title should contain at least 2 words")

const productDescription = z.string()
  .min(1, "Description is required")
  .min(10, "Description must be at least 10 characters")
  .max(1000, "Description must be less than 1000 characters")
  .refine((val) => val.trim().length >= 10, "Description must contain meaningful content")
  .refine((val) => {
    const words = val.trim().split(/\s+/)
    return words.length >= 5
  }, "Description should contain at least 5 words")

const tagArray = z.array(
  z.string()
    .min(1, "Tag cannot be empty")
    .max(30, "Tag must be less than 30 characters")
    .refine((val) => !/^\s*$/.test(val), "Tag cannot be only whitespace")
    .refine((val) => /^[a-zA-Z0-9\s-_]+$/.test(val), "Tag can only contain letters, numbers, spaces, hyphens, and underscores")
)
  .max(10, "Maximum 10 tags allowed")
  .refine((tags) => {
    const uniqueTags = new Set(tags.map(tag => tag.toLowerCase().trim()))
    return uniqueTags.size === tags.length
  }, "Tags must be unique")

// Enhanced Listing Form Schema
export const listingFormSchema = z.object({
  // Step 1: Basic Information
  title: productTitle,
  description: productDescription,
  price: usdcPrice,
  category: z.enum(["digital", "physical", "service", "subscription", "course", "software", "ebook", "template", "other"], {
    errorMap: () => ({ message: "Please select a valid category" })
  }),
  
  // Step 2: Details & Media
  tags: tagArray.default([]),
  additionalDetails: z.string()
    .max(500, "Additional details must be less than 500 characters")
    .optional(),
  images: z.array(z.any()).max(5, "Maximum 5 images allowed").default([]),
  
  // Step 3: Review
  creatorAddress: ethereumAddress,
  agreedToTerms: z.boolean()
    .refine((val) => val === true, "You must agree to the terms and conditions"),
  
  // Optional fields for enhanced functionality
  externalUrl: z.string()
    .url("Invalid URL format")
    .optional()
    .or(z.literal("")),
  contactEmail: z.string()
    .email("Invalid email format")
    .optional()
    .or(z.literal("")),
  deliveryTime: z.enum(["instant", "1-day", "3-days", "1-week", "2-weeks", "1-month", "custom"])
    .default("instant"),
  refundPolicy: z.enum(["no-refund", "7-days", "14-days", "30-days", "custom"])
    .default("no-refund")
})

// Enhanced Purchase Form Schema
export const purchaseFormSchema = z.object({
  itemId: z.string()
    .min(1, "Item ID is required")
    .refine((val) => {
      const num = parseInt(val)
      return !isNaN(num) && num > 0
    }, "Invalid item ID")
    .refine((val) => {
      const num = parseInt(val)
      return num <= Number.MAX_SAFE_INTEGER
    }, "Item ID is too large"),
  
  buyerAddress: ethereumAddress,
  
  confirmPurchase: z.boolean()
    .refine((val) => val === true, "You must confirm the purchase"),
  
  agreedToTerms: z.boolean()
    .refine((val) => val === true, "You must agree to the purchase terms"),
  
  // Transaction details
  expectedPrice: usdcPrice.optional(),
  maxGasPrice: z.string()
    .refine((val) => {
      if (!val) return true // Optional
      const num = parseFloat(val)
      return !isNaN(num) && num > 0
    }, "Invalid gas price")
    .optional(),
  
  // Purchase metadata
  purchaseReason: z.enum(["personal", "business", "resale", "gift", "other"])
    .default("personal"),
  
  // Contact information for digital delivery
  deliveryEmail: z.string()
    .email("Invalid email format")
    .optional()
    .or(z.literal("")),
  
  // Special instructions
  specialInstructions: z.string()
    .max(200, "Special instructions must be less than 200 characters")
    .optional()
})

// Step-specific schemas for validation
export const basicInfoSchema = listingFormSchema.pick({
  title: true,
  description: true,
  price: true,
  category: true
})

export const detailsMediaSchema = listingFormSchema.pick({
  tags: true,
  additionalDetails: true,
  images: true,
  externalUrl: true,
  contactEmail: true,
  deliveryTime: true,
  refundPolicy: true
})

export const reviewPublishSchema = listingFormSchema.pick({
  creatorAddress: true,
  agreedToTerms: true
})

// Purchase step schemas
export const purchaseReviewSchema = purchaseFormSchema.pick({
  itemId: true,
  buyerAddress: true,
  expectedPrice: true,
  purchaseReason: true,
  deliveryEmail: true,
  specialInstructions: true
})

export const purchaseConfirmSchema = purchaseFormSchema.pick({
  confirmPurchase: true,
  agreedToTerms: true,
  maxGasPrice: true
})

// Wallet connection schema
export const walletConnectionSchema = z.object({
  address: ethereumAddress,
  chainId: z.number()
    .refine((val) => [1, 5, 11155111].includes(val), "Unsupported network. Please switch to Ethereum Mainnet or Goerli"),
  isConnected: z.boolean()
    .refine((val) => val === true, "Wallet must be connected"),
  balance: z.string()
    .refine((val) => {
      const num = parseFloat(val)
      return !isNaN(num) && num >= 0
    }, "Invalid balance")
})

// Transaction schema
export const transactionSchema = z.object({
  hash: z.string()
    .regex(/^0x[a-fA-F0-9]{64}$/, "Invalid transaction hash"),
  from: ethereumAddress,
  to: ethereumAddress,
  value: z.string()
    .refine((val) => {
      const num = parseFloat(val)
      return !isNaN(num) && num >= 0
    }, "Invalid transaction value"),
  gasLimit: z.string()
    .refine((val) => {
      const num = parseInt(val)
      return !isNaN(num) && num > 0
    }, "Invalid gas limit"),
  gasPrice: z.string()
    .refine((val) => {
      const num = parseFloat(val)
      return !isNaN(num) && num > 0
    }, "Invalid gas price"),
  nonce: z.number()
    .int("Nonce must be an integer")
    .min(0, "Nonce must be non-negative")
})

// Form field validation schemas
export const fieldValidationSchemas = {
  title: productTitle,
  description: productDescription,
  price: usdcPrice,
  ethereumAddress: ethereumAddress,
  email: z.string().email("Invalid email format"),
  url: z.string().url("Invalid URL format"),
  tags: tagArray,
  category: z.enum(["digital", "physical", "service", "subscription", "course", "software", "ebook", "template", "other"]),
  boolean: z.boolean(),
  positiveNumber: z.number().positive("Must be a positive number"),
  nonNegativeNumber: z.number().min(0, "Must be non-negative")
}

// Enhanced validation helper functions
export const validateEthereumAddress = (address: string): { isValid: boolean; error?: string } => {
  if (!address) return { isValid: false, error: "Address is required" }
  if (!ethereumAddressRegex.test(address)) return { isValid: false, error: "Invalid Ethereum address format" }
  if (address.length !== 42) return { isValid: false, error: "Ethereum address must be 42 characters long" }
  return { isValid: true }
}

export const validatePrice = (price: string): { isValid: boolean; error?: string } => {
  if (!price) return { isValid: false, error: "Price is required" }
  
  const cleanPrice = price.replace(/,/g, '')
  const num = parseFloat(cleanPrice)
  
  if (isNaN(num)) return { isValid: false, error: "Price must be a valid number" }
  if (num <= 0) return { isValid: false, error: "Price must be greater than 0" }
  if (num > 1000000) return { isValid: false, error: "Price cannot exceed 1,000,000 USDC" }
  
  const decimals = cleanPrice.split('.')[1]
  if (decimals && decimals.length > 6) {
    return { isValid: false, error: "Price can have at most 6 decimal places" }
  }
  
  return { isValid: true }
}

export const validateRequired = (value: string, fieldName: string = "Field"): { isValid: boolean; error?: string } => {
  if (!value || value.trim().length === 0) {
    return { isValid: false, error: `${fieldName} is required` }
  }
  return { isValid: true }
}

export const validateEmail = (email: string): { isValid: boolean; error?: string } => {
  if (!email) return { isValid: false, error: "Email is required" }
  if (!emailRegex.test(email)) return { isValid: false, error: "Invalid email format" }
  if (email.length > 254) return { isValid: false, error: "Email is too long" }
  return { isValid: true }
}

export const validateUrl = (url: string): { isValid: boolean; error?: string } => {
  if (!url) return { isValid: true } // URL is optional
  if (!urlRegex.test(url)) return { isValid: false, error: "Invalid URL format" }
  if (url.length > 2048) return { isValid: false, error: "URL is too long" }
  return { isValid: true }
}

export const validateTags = (tags: string[]): { isValid: boolean; error?: string } => {
  if (tags.length > 10) return { isValid: false, error: "Maximum 10 tags allowed" }
  
  const uniqueTags = new Set(tags.map(tag => tag.toLowerCase().trim()))
  if (uniqueTags.size !== tags.length) return { isValid: false, error: "Tags must be unique" }
  
  for (const tag of tags) {
    if (!tag || tag.trim().length === 0) return { isValid: false, error: "Tag cannot be empty" }
    if (tag.length > 30) return { isValid: false, error: "Tag must be less than 30 characters" }
    if (!/^[a-zA-Z0-9\s-_]+$/.test(tag)) {
      return { isValid: false, error: "Tag can only contain letters, numbers, spaces, hyphens, and underscores" }
    }
  }
  
  return { isValid: true }
}

export const validateTransactionHash = (hash: string): { isValid: boolean; error?: string } => {
  if (!hash) return { isValid: false, error: "Transaction hash is required" }
  if (!/^0x[a-fA-F0-9]{64}$/.test(hash)) return { isValid: false, error: "Invalid transaction hash format" }
  return { isValid: true }
}

export const validateGasPrice = (gasPrice: string): { isValid: boolean; error?: string } => {
  if (!gasPrice) return { isValid: true } // Gas price is optional
  
  const num = parseFloat(gasPrice)
  if (isNaN(num)) return { isValid: false, error: "Gas price must be a valid number" }
  if (num <= 0) return { isValid: false, error: "Gas price must be greater than 0" }
  if (num > 1000) return { isValid: false, error: "Gas price seems too high (>1000 Gwei)" }
  
  return { isValid: true }
}

// Comprehensive field validation function
export const validateField = (fieldName: string, value: any, schema?: z.ZodSchema): { isValid: boolean; error?: string } => {
  try {
    if (schema) {
      schema.parse(value)
      return { isValid: true }
    }
    
    // Fallback to specific validators
    switch (fieldName) {
      case 'ethereumAddress':
      case 'creatorAddress':
      case 'buyerAddress':
        return validateEthereumAddress(value)
      case 'price':
      case 'expectedPrice':
        return validatePrice(value)
      case 'email':
      case 'contactEmail':
      case 'deliveryEmail':
        return validateEmail(value)
      case 'url':
      case 'externalUrl':
        return validateUrl(value)
      case 'tags':
        return validateTags(value)
      case 'transactionHash':
        return validateTransactionHash(value)
      case 'gasPrice':
      case 'maxGasPrice':
        return validateGasPrice(value)
      default:
        return validateRequired(value, fieldName)
    }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { isValid: false, error: error.errors[0]?.message || "Validation failed" }
    }
    return { isValid: false, error: "Validation failed" }
  }
}

// Enhanced error recovery configuration
export interface ErrorRecoveryConfig {
  retryable: boolean
  maxRetries: number
  retryDelay: number
  userMessage: string
  technicalDetails?: string
  severity: 'low' | 'medium' | 'high' | 'critical'
  category: 'validation' | 'network' | 'wallet' | 'contract' | 'user' | 'system'
  suggestedActions?: string[]
}

export const errorRecoveryMap: Record<string, ErrorRecoveryConfig> = {
  // Validation Errors
  'VALIDATION_FAILED': {
    retryable: false,
    maxRetries: 0,
    retryDelay: 0,
    userMessage: 'Please check your input and try again.',
    technicalDetails: 'Form validation failed',
    severity: 'medium',
    category: 'validation',
    suggestedActions: ['Check required fields', 'Verify input format']
  },
  'INVALID_ADDRESS': {
    retryable: false,
    maxRetries: 0,
    retryDelay: 0,
    userMessage: 'Invalid Ethereum address. Please check the address format.',
    technicalDetails: 'Ethereum address validation failed',
    severity: 'medium',
    category: 'validation',
    suggestedActions: ['Verify address format (0x...)', 'Check address length (42 characters)']
  },
  'INVALID_PRICE': {
    retryable: false,
    maxRetries: 0,
    retryDelay: 0,
    userMessage: 'Invalid price. Please enter a valid amount.',
    technicalDetails: 'Price validation failed',
    severity: 'medium',
    category: 'validation',
    suggestedActions: ['Enter a positive number', 'Check decimal places (max 6)', 'Ensure price is within limits']
  },
  
  // Wallet Errors
  'WALLET_NOT_CONNECTED': {
    retryable: false,
    maxRetries: 0,
    retryDelay: 0,
    userMessage: 'Please connect your wallet to continue.',
    technicalDetails: 'No wallet connection detected',
    severity: 'high',
    category: 'wallet',
    suggestedActions: ['Click "Connect Wallet"', 'Install MetaMask or compatible wallet', 'Refresh the page']
  },
  'WALLET_LOCKED': {
    retryable: true,
    maxRetries: 3,
    retryDelay: 2000,
    userMessage: 'Wallet is locked. Please unlock your wallet.',
    technicalDetails: 'Wallet is locked and needs to be unlocked',
    severity: 'high',
    category: 'wallet',
    suggestedActions: ['Unlock your wallet', 'Enter wallet password']
  },
  'WRONG_NETWORK': {
    retryable: false,
    maxRetries: 0,
    retryDelay: 0,
    userMessage: 'Please switch to the correct network.',
    technicalDetails: 'Connected to wrong blockchain network',
    severity: 'high',
    category: 'wallet',
    suggestedActions: ['Switch to Ethereum Mainnet', 'Check network settings']
  },
  'INSUFFICIENT_BALANCE': {
    retryable: false,
    maxRetries: 0,
    retryDelay: 0,
    userMessage: 'Insufficient USDC balance. Please add funds to your wallet.',
    technicalDetails: 'User wallet does not have enough USDC tokens',
    severity: 'high',
    category: 'wallet',
    suggestedActions: ['Add USDC to wallet', 'Check token balance', 'Use a different wallet']
  },
  'INSUFFICIENT_GAS': {
    retryable: true,
    maxRetries: 2,
    retryDelay: 1000,
    userMessage: 'Insufficient ETH for gas fees. Please add ETH to your wallet.',
    technicalDetails: 'Not enough ETH to pay for transaction gas',
    severity: 'high',
    category: 'wallet',
    suggestedActions: ['Add ETH for gas fees', 'Lower gas price', 'Try again later']
  },
  
  // User Action Errors
  'USER_REJECTED': {
    retryable: true,
    maxRetries: 3,
    retryDelay: 1000,
    userMessage: 'Transaction was rejected. Please try again.',
    technicalDetails: 'User rejected the transaction in their wallet',
    severity: 'low',
    category: 'user',
    suggestedActions: ['Approve the transaction', 'Check transaction details', 'Try again']
  },
  'USER_CANCELLED': {
    retryable: true,
    maxRetries: 1,
    retryDelay: 500,
    userMessage: 'Operation was cancelled.',
    technicalDetails: 'User cancelled the operation',
    severity: 'low',
    category: 'user'
  },
  
  // Network Errors
  'NETWORK_ERROR': {
    retryable: true,
    maxRetries: 5,
    retryDelay: 2000,
    userMessage: 'Network error. Retrying...',
    technicalDetails: 'Failed to connect to blockchain network',
    severity: 'medium',
    category: 'network',
    suggestedActions: ['Check internet connection', 'Try again later', 'Switch RPC provider']
  },
  'RPC_ERROR': {
    retryable: true,
    maxRetries: 3,
    retryDelay: 3000,
    userMessage: 'RPC connection failed. Retrying...',
    technicalDetails: 'RPC endpoint is not responding',
    severity: 'medium',
    category: 'network',
    suggestedActions: ['Wait and retry', 'Switch to different RPC', 'Check network status']
  },
  'TIMEOUT_ERROR': {
    retryable: true,
    maxRetries: 2,
    retryDelay: 5000,
    userMessage: 'Request timed out. Retrying...',
    technicalDetails: 'Network request exceeded timeout limit',
    severity: 'medium',
    category: 'network',
    suggestedActions: ['Check connection speed', 'Try again', 'Wait for network to stabilize']
  },
  
  // Contract Errors
  'CONTRACT_ERROR': {
    retryable: false,
    maxRetries: 0,
    retryDelay: 0,
    userMessage: 'Smart contract error. Please check your input and try again.',
    technicalDetails: 'Smart contract execution failed',
    severity: 'high',
    category: 'contract',
    suggestedActions: ['Verify input parameters', 'Check contract state', 'Contact support']
  },
  'CONTRACT_PAUSED': {
    retryable: false,
    maxRetries: 0,
    retryDelay: 0,
    userMessage: 'Contract is currently paused. Please try again later.',
    technicalDetails: 'Smart contract is in paused state',
    severity: 'high',
    category: 'contract',
    suggestedActions: ['Wait for contract to be unpaused', 'Check announcements', 'Contact support']
  },
  'ITEM_NOT_AVAILABLE': {
    retryable: false,
    maxRetries: 0,
    retryDelay: 0,
    userMessage: 'Item is no longer available for purchase.',
    technicalDetails: 'Item has been sold or removed',
    severity: 'medium',
    category: 'contract',
    suggestedActions: ['Browse other items', 'Check item status', 'Contact seller']
  },
  'ITEM_ALREADY_SOLD': {
    retryable: false,
    maxRetries: 0,
    retryDelay: 0,
    userMessage: 'This item has already been sold.',
    technicalDetails: 'Item is no longer available for purchase',
    severity: 'medium',
    category: 'contract',
    suggestedActions: ['Browse similar items', 'Check marketplace', 'Contact seller for alternatives']
  },
  
  // Gas Errors
  'GAS_ESTIMATION_FAILED': {
    retryable: true,
    maxRetries: 3,
    retryDelay: 1500,
    userMessage: 'Unable to estimate gas fees. Please try again.',
    technicalDetails: 'Gas estimation failed for the transaction',
    severity: 'medium',
    category: 'network',
    suggestedActions: ['Try again', 'Set manual gas limit', 'Check network congestion']
  },
  'GAS_PRICE_TOO_LOW': {
    retryable: true,
    maxRetries: 2,
    retryDelay: 1000,
    userMessage: 'Gas price too low. Transaction may fail or be delayed.',
    technicalDetails: 'Gas price is below network minimum',
    severity: 'medium',
    category: 'network',
    suggestedActions: ['Increase gas price', 'Use recommended gas price', 'Wait for lower network activity']
  },
  'GAS_LIMIT_EXCEEDED': {
    retryable: false,
    maxRetries: 0,
    retryDelay: 0,
    userMessage: 'Transaction requires too much gas. Please contact support.',
    technicalDetails: 'Transaction gas limit exceeds block gas limit',
    severity: 'high',
    category: 'contract',
    suggestedActions: ['Contact support', 'Check transaction parameters', 'Try smaller transaction']
  },
  
  // System Errors
  'UNKNOWN_ERROR': {
    retryable: true,
    maxRetries: 1,
    retryDelay: 2000,
    userMessage: 'An unexpected error occurred. Please try again.',
    technicalDetails: 'Unknown error occurred',
    severity: 'medium',
    category: 'system',
    suggestedActions: ['Try again', 'Refresh page', 'Contact support if problem persists']
  },
  'RATE_LIMITED': {
    retryable: true,
    maxRetries: 3,
    retryDelay: 5000,
    userMessage: 'Too many requests. Please wait and try again.',
    technicalDetails: 'Rate limit exceeded',
    severity: 'low',
    category: 'system',
    suggestedActions: ['Wait before retrying', 'Reduce request frequency']
  }
}

// Type inference from schemas
export type ListingFormData = z.infer<typeof listingFormSchema>
export type PurchaseFormData = z.infer<typeof purchaseFormSchema>
export type BasicInfoData = z.infer<typeof basicInfoSchema>
export type DetailsMediaData = z.infer<typeof detailsMediaSchema>
export type ReviewPublishData = z.infer<typeof reviewPublishSchema>
export type PurchaseReviewData = z.infer<typeof purchaseReviewSchema>
export type PurchaseConfirmData = z.infer<typeof purchaseConfirmSchema>
export type WalletConnectionData = z.infer<typeof walletConnectionSchema>
export type TransactionData = z.infer<typeof transactionSchema>

// Validation result type
export interface ValidationResult {
  isValid: boolean
  errors: Record<string, string>
  warnings?: Record<string, string>
}

// Schema validation utilities
export const validateSchema = <T>(schema: z.ZodSchema<T>, data: unknown): ValidationResult => {
  try {
    schema.parse(data)
    return { isValid: true, errors: {} }
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errors: Record<string, string> = {}
      error.errors.forEach((err) => {
        const path = err.path.join('.')
        errors[path] = err.message
      })
      return { isValid: false, errors }
    }
    return { isValid: false, errors: { general: 'Validation failed' } }
  }
}

export const validatePartialSchema = <T>(schema: z.ZodSchema<T>, data: unknown): ValidationResult => {
  try {
    // For partial validation, we'll use safeParse and filter out required field errors
    const result = schema.safeParse(data)
    if (result.success) {
      return { isValid: true, errors: {} }
    }
    
    // Filter out "required" errors for partial validation
    const errors: Record<string, string> = {}
    result.error.errors.forEach((err) => {
      // Skip required field errors in partial validation
      if (err.code !== 'invalid_type' || err.message !== 'Required') {
        const path = err.path.join('.')
        errors[path] = err.message
      }
    })
    
    return { isValid: Object.keys(errors).length === 0, errors }
  } catch (error) {
    return { isValid: false, errors: { general: 'Validation failed' } }
  }
}

// Error message utilities
export const getErrorMessage = (errorCode: string): string => {
  const config = errorRecoveryMap[errorCode]
  return config?.userMessage || 'An error occurred'
}

export const getErrorSeverity = (errorCode: string): 'low' | 'medium' | 'high' | 'critical' => {
  const config = errorRecoveryMap[errorCode]
  return config?.severity || 'medium'
}

export const getErrorCategory = (errorCode: string): string => {
  const config = errorRecoveryMap[errorCode]
  return config?.category || 'system'
}

export const isRetryableError = (errorCode: string): boolean => {
  const config = errorRecoveryMap[errorCode]
  return config?.retryable || false
}

export const getRetryConfig = (errorCode: string): { maxRetries: number; retryDelay: number } => {
  const config = errorRecoveryMap[errorCode]
  return {
    maxRetries: config?.maxRetries || 0,
    retryDelay: config?.retryDelay || 1000
  }
}

// Form validation presets
export const validationPresets = {
  listing: {
    step1: basicInfoSchema,
    step2: detailsMediaSchema,
    step3: reviewPublishSchema,
    complete: listingFormSchema
  },
  purchase: {
    review: purchaseReviewSchema,
    confirm: purchaseConfirmSchema,
    complete: purchaseFormSchema
  },
  wallet: walletConnectionSchema,
  transaction: transactionSchema
}

// Export all schemas for easy access
export const schemas = {
  listing: listingFormSchema,
  purchase: purchaseFormSchema,
  basicInfo: basicInfoSchema,
  detailsMedia: detailsMediaSchema,
  reviewPublish: reviewPublishSchema,
  purchaseReview: purchaseReviewSchema,
  purchaseConfirm: purchaseConfirmSchema,
  walletConnection: walletConnectionSchema,
  transaction: transactionSchema,
  fieldValidation: fieldValidationSchemas
}