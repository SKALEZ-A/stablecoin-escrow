// Enhanced Form System - Main exports (optimized for tree shaking)

// Core form components (always needed)
export { default as FormStep } from './FormStep'
export { default as ProgressIndicator } from './ProgressIndicator'

// Heavy components (lazy-loaded by default)
export { default as ListItemWizard } from './ListItemWizard'
export { default as PurchaseCheckout } from './PurchaseCheckout'

// Utility components
export { default as FormDraftRecovery } from './FormDraftRecovery'
export { default as SaveStatusIndicator } from './SaveStatusIndicator'
export { default as AutoSaveManager } from './AutoSaveManager'

// Lazy-loaded versions for performance
export * from './lazy'

// Performance optimization utilities
export { default as PerformanceMonitor } from './PerformanceMonitor'
export { default as OptimizedImage } from './OptimizedImage'
export * from './utils/performance'

// Accessibility utilities and components
export * from './accessibility'

// Form Field Components
export { default as EnhancedInput } from './fields/EnhancedInput'
export { default as EnhancedTextarea } from './fields/EnhancedTextarea'
export { default as EnhancedSelect } from './fields/EnhancedSelect'
export { default as PriceInput } from './fields/PriceInput'
export { default as AddressInput } from './fields/AddressInput'
export { default as ImageUpload } from './fields/ImageUpload'
export { default as TagsInput } from './fields/TagsInput'

// Form Hooks
export { useFormWizard } from './hooks/useFormWizard'
export { useFormValidation } from './hooks/useFormValidation'
export { useContractInteraction } from './hooks/useContractInteraction'
export { useFormPersistence } from './hooks/useFormPersistence'
export { useAutoSave } from './hooks/useAutoSave'

// Error Handling
export { 
  FormErrorBoundary, 
  ErrorDisplay, 
  TransactionErrorHandler, 
  AutoRetryErrorHandler, 
  ErrorToast, 
  useErrorToast 
} from './ErrorHandler'
export { 
  ErrorRecoveryService, 
  errorRecoveryService, 
  useErrorRecovery 
} from './ErrorRecoveryService'

// Animations
export { default as AnimationProvider, useAnimation, useAnimationVariants, useConditionalAnimation } from './AnimationProvider'
export { default as formAnimations } from './animations'
export { 
  LoadingSpinner, 
  LoadingDots, 
  LoadingPulse, 
  LoadingWave, 
  LoadingSkeleton, 
  LoadingProgress, 
  LoadingSpinnerWithText, 
  LoadingOverlay, 
  LoadingGeometric 
} from './LoadingStates'

// Responsive Layout
export { 
  ResponsiveProvider,
  ResponsiveContainer,
  ResponsiveGrid,
  ResponsiveStack,
  ResponsiveShow,
  ResponsiveText,
  TouchFriendly,
  ResponsiveFormLayout,
  ResponsiveModal,
  useResponsive,
  useBreakpoint,
  useMediaQuery,
  responsiveUtils
} from './ResponsiveLayout'

// Wallet Management
export { 
  WalletProvider,
  WalletGuard,
  WalletConnectionPrompt,
  WalletStatusIndicator,
  useWalletState,
  useWalletValidation
} from './WalletStateManager'

// Web3 Transaction Handling
export { 
  Web3TransactionHandler,
  TransactionConfirmationModal,
  useMultiStepTransaction
} from './Web3TransactionHandler'

// Success Screens
export { 
  ListingSuccessScreen,
  PurchaseSuccessScreen
} from './SuccessScreens'

// Types and Schemas
export * from './types'
export { 
  listingFormSchema, 
  purchaseFormSchema, 
  basicInfoSchema, 
  detailsMediaSchema, 
  reviewPublishSchema,
  validateEthereumAddress,
  validatePrice,
  validateRequired,
  errorRecoveryMap
} from './schemas'