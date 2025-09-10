// TypeScript interfaces for form data models

export interface ListItemFormData {
  // Step 1: Basic Information
  title: string
  description: string
  price: string
  category: 'digital' | 'physical' | 'service' | 'subscription' | 'course' | 'software' | 'ebook' | 'template' | 'other'
  
  // Step 2: Details & Media
  images?: File[]
  tags: string[]
  additionalDetails?: string
  externalUrl?: string
  contactEmail?: string
  deliveryTime?: 'instant' | '1-day' | '3-days' | '1-week' | '2-weeks' | '1-month' | 'custom'
  refundPolicy?: 'no-refund' | '7-days' | '14-days' | '30-days' | 'custom'
  
  // Step 3: Review
  creatorAddress: string
  agreedToTerms: boolean
}

export interface PurchaseFormData {
  itemId: string
  confirmPurchase: boolean
}

export interface FormStepProps {
  title: string
  description?: string
  children: React.ReactNode
  isActive: boolean
  isCompleted: boolean
  onNext?: () => void
  onPrevious?: () => void
  canProceed: boolean
  isLoading?: boolean
  stepNumber?: number
  totalSteps?: number
  validationErrors?: string[]
  onValidationError?: () => void
}

export interface ListItemWizardProps {
  onComplete: (data: ListItemFormData) => void
  onCancel: () => void
  initialData?: Partial<ListItemFormData>
}

export interface PurchaseCheckoutProps {
  itemId: string
  itemData: {
    title: string
    price: bigint
    creator: string
    active: boolean
  }
  feeData: {
    platformFee: bigint
    creatorPayout: bigint
  }
  onComplete: (transactionHash: string) => void
  onCancel: () => void
}

export interface CheckoutState {
  step: 'review' | 'approve' | 'purchase' | 'confirming' | 'complete'
  approvalHash?: string
  purchaseHash?: string
  error?: string
}

export interface TransactionState {
  status: 'idle' | 'pending' | 'confirming' | 'success' | 'error'
  hash?: string
  error?: {
    code: string
    message: string
    details?: any
  }
  confirmations?: number
  gasUsed?: bigint
}

export interface ErrorRecoveryConfig {
  retryable: boolean
  maxRetries: number
  retryDelay: number
  fallbackAction?: () => void
  userMessage: string
  technicalDetails?: string
}

export interface FormFieldProps {
  label: string
  name: string
  error?: string
  required?: boolean
  disabled?: boolean
  className?: string
}

export interface EnhancedInputProps extends FormFieldProps {
  type?: 'text' | 'email' | 'password' | 'number'
  placeholder?: string
  value: string
  onChange: (value: string) => void
  onBlur?: () => void
}

export interface EnhancedTextareaProps extends FormFieldProps {
  placeholder?: string
  value: string
  onChange: (value: string) => void
  maxLength?: number
  rows?: number
  onBlur?: () => void
}

export interface EnhancedSelectProps extends FormFieldProps {
  options: Array<{ value: string; label: string }>
  value: string
  onChange: (value: string) => void
  placeholder?: string
  onBlur?: () => void
}

export interface PriceInputProps extends FormFieldProps {
  value: string
  onChange: (value: string) => void
  currency?: string
  min?: number
  max?: number
  onBlur?: () => void
}

export interface AddressInputProps extends FormFieldProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  onBlur?: () => void
}

export interface ImageUploadProps extends FormFieldProps {
  files: File[]
  onChange: (files: File[]) => void
  maxFiles?: number
  maxSize?: number
  acceptedTypes?: string[]
}

export interface ProgressIndicatorProps {
  currentStep: number
  totalSteps: number
  stepLabels?: string[]
  className?: string
}

export interface FormWizardState {
  currentStep: number
  totalSteps: number
  formData: Record<string, any>
  isValid: boolean
  isLoading: boolean
}

export interface ExtendedFormWizardState extends FormWizardState {
  completedSteps: Set<number>
  visitedSteps: Set<number>
  stepErrors: Record<number, string[]>
  isDirty: boolean
  lastSavedData: Record<string, any>
}

export type StepStatus = 'current' | 'completed' | 'visited' | 'unvisited'

export interface FormValidationState {
  errors: Record<string, string>
  isValid: boolean
  isDirty: boolean
  touchedFields: Set<string>
}

export interface ExtendedFormValidationState extends FormValidationState {
  warnings: Record<string, string>
  isValidating: boolean
  validationCount: number
  lastValidated: Date | null
  fieldValidationStatus: Record<string, 'idle' | 'validating' | 'valid' | 'invalid'>
}

export interface ValidationResult {
  isValid: boolean
  errors: Record<string, string>
  warnings?: Record<string, string>
}