import React, { useState, useCallback, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X } from 'lucide-react'
import { useAccount, useWriteContract, useWaitForTransactionReceipt } from 'wagmi'
import { parseUnits } from 'viem'
import { ListItemWizardProps, ListItemFormData } from './types'
import { useFormWizard } from './hooks/useFormWizard'
import { useFormValidation } from './hooks/useFormValidation'
import { useFormPersistence } from './hooks/useFormPersistence'
import { listingFormSchema, basicInfoSchema, detailsMediaSchema, reviewPublishSchema } from './schemas'
import FormStep from './FormStep'
import ProgressIndicator from './ProgressIndicator'
import FormDraftRecovery from './FormDraftRecovery'
import SaveStatusIndicator from './SaveStatusIndicator'
import { ESCROW_CONTRACT } from '../../lib/contracts'
import { 
  ResponsiveContainer, 
  ResponsiveFormLayout, 
  ResponsiveStack, 
  ResponsiveShow, 
  TouchFriendly,
  useResponsive 
} from './ResponsiveLayout'
import { 
  EnhancedInput, 
  EnhancedTextarea, 
  EnhancedSelect, 
  PriceInput,
  ImageUpload,
  TagsInput,
  AddressInput
} from './fields'

const ListItemWizard: React.FC<ListItemWizardProps> = ({
  onComplete,
  onCancel,
  initialData = {}
}) => {
  const { address } = useAccount()
  const { writeContract, data: hash, isPending, error: contractError } = useWriteContract()
  const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({
    hash,
  })

  const [formData, setFormData] = useState<Partial<ListItemFormData>>({
    title: '',
    description: '',
    price: '',
    category: 'digital',
    tags: [],
    additionalDetails: '',
    creatorAddress: address || '',
    agreedToTerms: false,
    ...initialData
  })

  const [transactionState, setTransactionState] = useState<{
    status: 'idle' | 'pending' | 'confirming' | 'success' | 'error'
    error?: string
  }>({ status: 'idle' })

  const [showDraftRecovery, setShowDraftRecovery] = useState(false)

  // Form persistence
  const persistence = useFormPersistence('list-item-wizard', formData, {
    autoSave: true,
    autoSaveDelay: 1000,
    maxAge: 24 * 60 * 60 * 1000, // 24 hours
    onRestore: (data) => {
      setFormData(data)
    },
    onSave: (data) => {
      console.log('Form data saved to localStorage')
    },
    onError: (error) => {
      console.error('Persistence error:', error)
    }
  })

  // Check for saved draft on mount
  useEffect(() => {
    if (persistence.isLoaded && persistence.hasSavedData && !initialData.title) {
      setShowDraftRecovery(true)
    }
  }, [persistence.isLoaded, persistence.hasSavedData, initialData.title])

  // Handle transaction state changes
  React.useEffect(() => {
    if (isPending) {
      setTransactionState({ status: 'pending' })
    } else if (hash && isConfirming) {
      setTransactionState({ status: 'confirming' })
    } else if (hash && isConfirmed) {
      setTransactionState({ status: 'success' })
      // Clear saved data on successful completion
      persistence.clearData()
      // Complete the wizard and call onComplete
      wizard.complete().then(() => {
        onComplete({
          ...formData,
          transactionHash: hash
        } as ListItemFormData & { transactionHash: string })
      })
    } else if (contractError) {
      setTransactionState({ 
        status: 'error', 
        error: contractError.message || 'Transaction failed'
      })
    }
  }, [isPending, hash, isConfirming, isConfirmed, contractError, wizard, onComplete, formData])

  // Update creator address when wallet connects
  React.useEffect(() => {
    if (address && !formData.creatorAddress) {
      updateField('creatorAddress', address)
    }
  }, [address, formData.creatorAddress])

  const stepLabels = ['Basic Info', 'Details & Media', 'Review & Publish']

  // Form wizard management
  const wizard = useFormWizard(
    3, // totalSteps
    formData,
    {
      persistKey: 'list-item-wizard',
      autoSave: true,
      autoSaveDelay: 1000,
      allowSkipSteps: false,
      validateStep: async (step: number, data: Record<string, any>) => {
        let schema
        switch (step) {
          case 1:
            schema = basicInfoSchema
            break
          case 2:
            schema = detailsMediaSchema
            break
          case 3:
            schema = reviewPublishSchema
            break
          default:
            return { isValid: true, errors: [] }
        }

        const validation = useFormValidation(schema)
        const result = await validation.validateForm(data)
        return {
          isValid: result.isValid,
          errors: Object.values(result.errors).filter(Boolean)
        }
      },
      onStepChange: (step, direction) => {
        console.log(`Step changed to ${step} (${direction})`)
      },
      onComplete: async (data) => {
        console.log('Form completed with data:', data)
        onComplete(data as ListItemFormData)
      }
    }
  )

  // Form validation for current step
  const getCurrentSchema = () => {
    switch (wizard.currentStep) {
      case 1: return basicInfoSchema
      case 2: return detailsMediaSchema
      case 3: return reviewPublishSchema
      default: return basicInfoSchema
    }
  }

  const validation = useFormValidation(getCurrentSchema(), {
    validateOnChange: true,
    validateOnBlur: true,
    debounceMs: 300,
    showErrorsOnlyAfterTouch: true
  })

  // Category options
  const categoryOptions = [
    { value: 'digital', label: 'Digital Product' },
    { value: 'physical', label: 'Physical Product' },
    { value: 'service', label: 'Service' },
    { value: 'subscription', label: 'Subscription' },
    { value: 'course', label: 'Online Course' },
    { value: 'software', label: 'Software' },
    { value: 'ebook', label: 'E-book' },
    { value: 'template', label: 'Template' },
    { value: 'other', label: 'Other' }
  ]

  // Update form data and wizard state
  const updateField = useCallback((field: string, value: any) => {
    const newFormData = { ...formData, [field]: value }
    setFormData(newFormData)
    wizard.updateFormData(newFormData)
    validation.handleFieldChange(field, value, newFormData)
    // Save to persistence
    persistence.updateField(field, value)
  }, [formData, wizard, validation, persistence])

  // Draft recovery handlers
  const handleRestoreDraft = useCallback(() => {
    if (persistence.data) {
      setFormData(persistence.data)
      wizard.updateFormData(persistence.data)
    }
    setShowDraftRecovery(false)
  }, [persistence.data, wizard])

  const handleDiscardDraft = useCallback(() => {
    persistence.clearData()
    setShowDraftRecovery(false)
  }, [persistence])

  const handleDismissDraftRecovery = useCallback(() => {
    setShowDraftRecovery(false)
  }, [])

  // Handle field blur
  const handleFieldBlur = useCallback((field: string) => {
    validation.handleFieldBlur(field, formData[field as keyof typeof formData], formData)
  }, [formData, validation])

  // Handle next step
  const handleNext = useCallback(async () => {
    const result = await validation.validateForm(formData)
    if (result.isValid) {
      const success = await wizard.nextStep()
      if (!success) {
        console.error('Failed to proceed to next step')
      }
    }
  }, [validation, formData, wizard])

  // Handle previous step
  const handlePrevious = useCallback(() => {
    wizard.previousStep()
  }, [wizard])

  // Handle form completion
  const handleComplete = useCallback(async () => {
    const result = await validation.validateForm(formData)
    if (!result.isValid) {
      return
    }

    try {
      setTransactionState({ status: 'pending' })
      
      // Validate required fields
      if (!formData.title || !formData.price || !formData.creatorAddress) {
        throw new Error('Missing required fields')
      }

      // Convert price to USDC units (6 decimals)
      const priceInUsdc = parseUnits(formData.price, 6)
      
      // Submit to contract
      writeContract({
        ...ESCROW_CONTRACT,
        functionName: 'listItem',
        args: [formData.creatorAddress as `0x${string}`, priceInUsdc, formData.title],
      })
      
    } catch (error) {
      console.error('Error submitting listing:', error)
      setTransactionState({ 
        status: 'error', 
        error: error instanceof Error ? error.message : 'Failed to submit listing'
      })
    }
  }, [validation, formData, writeContract])

  // Handle cancel
  const handleCancel = useCallback(() => {
    wizard.reset()
    onCancel()
  }, [wizard, onCancel])

  const { isMobile, isTablet } = useResponsive()

  return (
    <ResponsiveContainer maxWidth="2xl" className="bg-white rounded-lg shadow-lg overflow-hidden">
      <div className={`${isMobile ? 'min-h-screen' : ''}`}>
        {/* Header */}
        <div className={`${isMobile ? 'px-4 py-3' : isTablet ? 'px-5 py-4' : 'px-6 py-4'} border-b border-gray-200 bg-gray-50`}>
          <ResponsiveStack 
            direction={{ xs: 'row', sm: 'row' }} 
            justify="between" 
            align="center"
            className="w-full"
          >
            <h2 className={`font-bold text-gray-900 ${isMobile ? 'text-xl' : 'text-2xl'}`}>
              List New Item
            </h2>
            <TouchFriendly>
              <button
                onClick={handleCancel}
                className={`${isMobile ? 'p-3' : 'p-2'} text-gray-400 hover:text-gray-600 transition-colors`}
              >
                <X className={`${isMobile ? 'w-7 h-7' : 'w-6 h-6'}`} />
              </button>
            </TouchFriendly>
          </ResponsiveStack>
          
          {/* Progress Indicator */}
          <div className={`${isMobile ? 'mt-4' : 'mt-6'}`}>
            <ResponsiveShow above="sm">
              <ProgressIndicator
                currentStep={wizard.currentStep}
                totalSteps={wizard.totalSteps}
                stepLabels={stepLabels}
              />
            </ResponsiveShow>
            <ResponsiveShow below="sm">
              <div className="flex justify-center">
                <span className="text-sm text-gray-600">
                  Step {wizard.currentStep} of {wizard.totalSteps}
                </span>
              </div>
            </ResponsiveShow>
          </div>

          {/* Save Status Indicator */}
          <div className="mt-3 flex justify-center">
            <SaveStatusIndicator
              status={persistence.saveStatus}
              lastSaved={persistence.lastSaved}
              hasUnsavedChanges={persistence.hasUnsavedChanges}
              error={persistence.error}
              compact={isMobile}
            />
          </div>
        </div>

        {/* Draft Recovery Modal */}
        <FormDraftRecovery
          isVisible={showDraftRecovery}
          savedDate={persistence.lastSaved}
          onRestore={handleRestoreDraft}
          onDiscard={handleDiscardDraft}
          onDismiss={handleDismissDraftRecovery}
          title="Listing Draft Found"
          description="We found a saved draft of your listing. Would you like to continue where you left off?"
        />

        {/* Form Content */}
        <div className={`${isMobile ? 'p-4' : isTablet ? 'p-5' : 'p-6'}`}>
          <AnimatePresence mode="wait">
          </div>
      </div>

        {/* Form Content */}
        <div className={`${isMobile ? 'p-4' : isTablet ? 'p-5' : 'p-6'}`}>
          <AnimatePresence mode="wait">
          {/* Step 1: Basic Information */}
          <FormStep
            key="step-1"
            title="Basic Information"
            description="Tell us about your product"
            isActive={wizard.currentStep === 1}
            isCompleted={wizard.completedSteps.has(1)}
            onNext={handleNext}
            canProceed={validation.isValid && !validation.isValidating}
            isLoading={wizard.isLoading || validation.isValidating}
            stepNumber={1}
            totalSteps={wizard.totalSteps}
            validationErrors={Object.values(validation.errors).filter(Boolean)}
          >
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, staggerChildren: 0.1 }}
              className="space-y-6"
            >
              {/* Title Field */}
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 }}
              >
                <EnhancedInput
                  label="Product Title"
                  name="title"
                  value={formData.title || ''}
                  onChange={(value) => updateField('title', value)}
                  onBlur={() => handleFieldBlur('title')}
                  placeholder="Enter a compelling product title"
                  error={validation.getFieldError('title')}
                  required
                />
              </motion.div>

              {/* Description Field */}
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 }}
              >
                <EnhancedTextarea
                  label="Product Description"
                  name="description"
                  value={formData.description || ''}
                  onChange={(value) => updateField('description', value)}
                  onBlur={() => handleFieldBlur('description')}
                  placeholder="Describe your product in detail. What makes it special? What problems does it solve?"
                  maxLength={1000}
                  rows={6}
                  error={validation.getFieldError('description')}
                  required
                />
              </motion.div>

              {/* Price and Category Row */}
              <ResponsiveFormLayout variant="two-column">
                {/* Price Field */}
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.3 }}
                >
                  <PriceInput
                    label="Price"
                    name="price"
                    value={formData.price || ''}
                    onChange={(value) => updateField('price', value)}
                    onBlur={() => handleFieldBlur('price')}
                    currency="USDC"
                    min={0.01}
                    max={1000000}
                    error={validation.getFieldError('price')}
                    required
                  />
                </motion.div>

                {/* Category Field */}
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.4 }}
                >
                  <EnhancedSelect
                    label="Category"
                    name="category"
                    options={categoryOptions}
                    value={formData.category || ''}
                    onChange={(value) => updateField('category', value)}
                    onBlur={() => handleFieldBlur('category')}
                    placeholder="Select a category"
                    error={validation.getFieldError('category')}
                    required
                  />
                </motion.div>
              </ResponsiveFormLayout>

              {/* Form Tips */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="p-4 bg-blue-50 border border-blue-200 rounded-lg"
              >
                <h4 className="font-medium text-blue-900 mb-2">💡 Tips for a great listing</h4>
                <ul className="text-sm text-blue-800 space-y-1">
                  <li>• Use a clear, descriptive title that highlights your product's main benefit</li>
                  <li>• Write a detailed description that answers potential buyers' questions</li>
                  <li>• Price competitively by researching similar products</li>
                  <li>• Choose the most accurate category to help buyers find your product</li>
                </ul>
              </motion.div>
            </motion.div>
          </FormStep>

          {/* Step 2: Details & Media */}
          <FormStep
            key="step-2"
            title="Details & Media"
            description="Add images and additional details to make your listing stand out"
            isActive={wizard.currentStep === 2}
            isCompleted={wizard.completedSteps.has(2)}
            onNext={handleNext}
            onPrevious={handlePrevious}
            canProceed={validation.isValid && !validation.isValidating}
            isLoading={wizard.isLoading || validation.isValidating}
            stepNumber={2}
            totalSteps={wizard.totalSteps}
            validationErrors={Object.values(validation.errors).filter(Boolean)}
          >
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, staggerChildren: 0.1 }}
              className="space-y-6"
            >
              {/* Image Upload */}
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 }}
              >
                <ImageUpload
                  label="Product Images"
                  name="images"
                  files={formData.images || []}
                  onChange={(files) => updateField('images', files)}
                  maxFiles={5}
                  maxSize={5 * 1024 * 1024} // 5MB
                  acceptedTypes={['image/jpeg', 'image/png', 'image/webp']}
                  error={validation.getFieldError('images')}
                />
              </motion.div>

              {/* Tags Input */}
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 }}
              >
                <TagsInput
                  label="Tags"
                  name="tags"
                  tags={formData.tags || []}
                  onChange={(tags) => updateField('tags', tags)}
                  onBlur={() => handleFieldBlur('tags')}
                  maxTags={10}
                  maxTagLength={30}
                  placeholder="Add tags to help buyers find your product"
                  suggestions={[
                    'digital-download',
                    'instant-access',
                    'premium',
                    'beginner-friendly',
                    'advanced',
                    'tutorial',
                    'template',
                    'guide',
                    'course',
                    'ebook',
                    'software',
                    'design',
                    'business',
                    'marketing',
                    'productivity',
                    'creative',
                    'educational',
                    'professional'
                  ]}
                  error={validation.getFieldError('tags')}
                />
              </motion.div>

              {/* Additional Details */}
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 }}
              >
                <EnhancedTextarea
                  label="Additional Details"
                  name="additionalDetails"
                  value={formData.additionalDetails || ''}
                  onChange={(value) => updateField('additionalDetails', value)}
                  onBlur={() => handleFieldBlur('additionalDetails')}
                  placeholder="Add any additional information about your product, such as system requirements, included files, or special instructions..."
                  maxLength={500}
                  rows={4}
                  error={validation.getFieldError('additionalDetails')}
                />
              </motion.div>

              {/* Optional Fields Row */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* External URL */}
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.4 }}
                >
                  <EnhancedInput
                    label="External URL (Optional)"
                    name="externalUrl"
                    value={formData.externalUrl || ''}
                    onChange={(value) => updateField('externalUrl', value)}
                    onBlur={() => handleFieldBlur('externalUrl')}
                    placeholder="https://your-website.com"
                    error={validation.getFieldError('externalUrl')}
                  />
                </motion.div>

                {/* Contact Email */}
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.5 }}
                >
                  <EnhancedInput
                    label="Contact Email (Optional)"
                    name="contactEmail"
                    type="email"
                    value={formData.contactEmail || ''}
                    onChange={(value) => updateField('contactEmail', value)}
                    onBlur={() => handleFieldBlur('contactEmail')}
                    placeholder="contact@example.com"
                    error={validation.getFieldError('contactEmail')}
                  />
                </motion.div>
              </div>

              {/* Delivery and Refund Policy Row */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Delivery Time */}
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.6 }}
                >
                  <EnhancedSelect
                    label="Delivery Time"
                    name="deliveryTime"
                    options={[
                      { value: 'instant', label: 'Instant Access' },
                      { value: '1-day', label: 'Within 1 Day' },
                      { value: '3-days', label: 'Within 3 Days' },
                      { value: '1-week', label: 'Within 1 Week' },
                      { value: '2-weeks', label: 'Within 2 Weeks' },
                      { value: '1-month', label: 'Within 1 Month' },
                      { value: 'custom', label: 'Custom Timeline' }
                    ]}
                    value={formData.deliveryTime || 'instant'}
                    onChange={(value) => updateField('deliveryTime', value)}
                    onBlur={() => handleFieldBlur('deliveryTime')}
                    error={validation.getFieldError('deliveryTime')}
                  />
                </motion.div>

                {/* Refund Policy */}
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.7 }}
                >
                  <EnhancedSelect
                    label="Refund Policy"
                    name="refundPolicy"
                    options={[
                      { value: 'no-refund', label: 'No Refunds' },
                      { value: '7-days', label: '7 Days' },
                      { value: '14-days', label: '14 Days' },
                      { value: '30-days', label: '30 Days' },
                      { value: 'custom', label: 'Custom Policy' }
                    ]}
                    value={formData.refundPolicy || 'no-refund'}
                    onChange={(value) => updateField('refundPolicy', value)}
                    onBlur={() => handleFieldBlur('refundPolicy')}
                    error={validation.getFieldError('refundPolicy')}
                  />
                </motion.div>
              </div>

              {/* Step 2 Tips */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.8 }}
                className="p-4 bg-green-50 border border-green-200 rounded-lg"
              >
                <h4 className="font-medium text-green-900 mb-2">📸 Make your listing shine</h4>
                <ul className="text-sm text-green-800 space-y-1">
                  <li>• Add high-quality images that showcase your product's key features</li>
                  <li>• Use relevant tags to help buyers discover your product</li>
                  <li>• Provide clear delivery expectations and refund policies</li>
                  <li>• Include contact information for customer support</li>
                </ul>
              </motion.div>
            </motion.div>
          </FormStep>

          {/* Step 3: Review & Publish */}
          <FormStep
            key="step-3"
            title="Review & Publish"
            description="Review your listing details and publish to the marketplace"
            isActive={wizard.currentStep === 3}
            isCompleted={wizard.completedSteps.has(3)}
            onPrevious={handlePrevious}
            canProceed={validation.isValid && !validation.isValidating && formData.agreedToTerms}
            isLoading={wizard.isLoading || validation.isValidating}
            stepNumber={3}
            totalSteps={wizard.totalSteps}
            validationErrors={Object.values(validation.errors).filter(Boolean)}
          >
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, staggerChildren: 0.1 }}
              className="space-y-8"
            >
              {/* Listing Preview */}
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 }}
                className="bg-gray-50 border border-gray-200 rounded-lg p-6"
              >
                <h3 className="text-lg font-semibold text-gray-900 mb-4">📋 Listing Preview</h3>
                
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Left Column - Basic Info */}
                  <div className="space-y-4">
                    <div>
                      <h4 className="font-medium text-gray-900 text-xl mb-2">{formData.title || 'Untitled Product'}</h4>
                      <p className="text-gray-600 text-sm leading-relaxed">
                        {formData.description || 'No description provided'}
                      </p>
                    </div>
                    
                    <div className="flex items-center justify-between py-3 border-t border-gray-200">
                      <span className="text-gray-600">Price:</span>
                      <span className="text-2xl font-bold text-green-600">
                        {formData.price ? `${formData.price} USDC` : 'Not set'}
                      </span>
                    </div>
                    
                    <div className="flex items-center justify-between py-2">
                      <span className="text-gray-600">Category:</span>
                      <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
                        {formData.category ? formData.category.charAt(0).toUpperCase() + formData.category.slice(1) : 'Not set'}
                      </span>
                    </div>
                    
                    {formData.tags && formData.tags.length > 0 && (
                      <div>
                        <span className="text-gray-600 text-sm">Tags:</span>
                        <div className="flex flex-wrap gap-2 mt-2">
                          {formData.tags.map((tag, index) => (
                            <span
                              key={index}
                              className="px-2 py-1 bg-gray-200 text-gray-700 rounded text-xs"
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                  
                  {/* Right Column - Additional Details */}
                  <div className="space-y-4">
                    {formData.images && formData.images.length > 0 && (
                      <div>
                        <span className="text-gray-600 text-sm">Images:</span>
                        <div className="grid grid-cols-2 gap-2 mt-2">
                          {formData.images.slice(0, 4).map((file, index) => (
                            <div key={index} className="aspect-square bg-gray-200 rounded-lg flex items-center justify-center">
                              <span className="text-gray-500 text-xs">Image {index + 1}</span>
                            </div>
                          ))}
                          {formData.images.length > 4 && (
                            <div className="aspect-square bg-gray-100 rounded-lg flex items-center justify-center">
                              <span className="text-gray-400 text-xs">+{formData.images.length - 4} more</span>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                    
                    {formData.additionalDetails && (
                      <div>
                        <span className="text-gray-600 text-sm">Additional Details:</span>
                        <p className="text-gray-700 text-sm mt-1 leading-relaxed">
                          {formData.additionalDetails}
                        </p>
                      </div>
                    )}
                    
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      {formData.deliveryTime && (
                        <div>
                          <span className="text-gray-600">Delivery:</span>
                          <p className="text-gray-700 font-medium">
                            {formData.deliveryTime === 'instant' ? 'Instant Access' : 
                             formData.deliveryTime === '1-day' ? 'Within 1 Day' :
                             formData.deliveryTime === '3-days' ? 'Within 3 Days' :
                             formData.deliveryTime === '1-week' ? 'Within 1 Week' :
                             formData.deliveryTime === '2-weeks' ? 'Within 2 Weeks' :
                             formData.deliveryTime === '1-month' ? 'Within 1 Month' :
                             'Custom Timeline'}
                          </p>
                        </div>
                      )}
                      
                      {formData.refundPolicy && (
                        <div>
                          <span className="text-gray-600">Refunds:</span>
                          <p className="text-gray-700 font-medium">
                            {formData.refundPolicy === 'no-refund' ? 'No Refunds' :
                             formData.refundPolicy === '7-days' ? '7 Days' :
                             formData.refundPolicy === '14-days' ? '14 Days' :
                             formData.refundPolicy === '30-days' ? '30 Days' :
                             'Custom Policy'}
                          </p>
                        </div>
                      )}
                    </div>
                    
                    {(formData.externalUrl || formData.contactEmail) && (
                      <div className="pt-2 border-t border-gray-200">
                        {formData.externalUrl && (
                          <div className="mb-2">
                            <span className="text-gray-600 text-sm">Website:</span>
                            <p className="text-blue-600 text-sm truncate">{formData.externalUrl}</p>
                          </div>
                        )}
                        {formData.contactEmail && (
                          <div>
                            <span className="text-gray-600 text-sm">Contact:</span>
                            <p className="text-gray-700 text-sm">{formData.contactEmail}</p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>

              {/* Wallet Connection Check */}
              {!address && (
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.15 }}
                  className="bg-orange-50 border border-orange-200 rounded-lg p-6"
                >
                  <div className="flex items-start space-x-3">
                    <div className="flex-shrink-0">
                      <svg className="w-6 h-6 text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
                      </svg>
                    </div>
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-orange-900 mb-2">Wallet Connection Required</h3>
                      <p className="text-orange-800 text-sm mb-4">
                        You need to connect your wallet to publish listings and receive payments. 
                        Please connect your wallet to continue.
                      </p>
                      <button
                        type="button"
                        className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors font-medium"
                        onClick={() => {
                          // This would typically trigger wallet connection
                          // The actual wallet connection is handled by the parent app
                          console.log('Connect wallet clicked')
                        }}
                      >
                        Connect Wallet
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Creator Address Field */}
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 }}
              >
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
                  <h3 className="text-lg font-semibold text-blue-900 mb-4">💰 Payment Settings</h3>
                  <p className="text-blue-800 text-sm mb-4">
                    This is the Ethereum address that will receive payments when your item is purchased. 
                    Make sure this address is correct as it cannot be changed after listing.
                  </p>
                  
                  <div className="space-y-4">
                    <AddressInput
                      label="Creator Address (Payment Recipient)"
                      name="creatorAddress"
                      value={formData.creatorAddress || ''}
                      onChange={(value) => updateField('creatorAddress', value)}
                      onBlur={() => handleFieldBlur('creatorAddress')}
                      placeholder="0x..."
                      error={validation.getFieldError('creatorAddress')}
                      required
                      className="bg-white"
                    />
                    
                    {/* Wallet Connection Helper */}
                    <div className="flex items-center justify-between p-3 bg-white border border-blue-200 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <div className={`w-3 h-3 rounded-full ${address ? 'bg-green-500' : 'bg-gray-400'}`}></div>
                        <span className="text-sm text-gray-700">
                          {address ? (
                            <>Connected Wallet: {`${address.slice(0, 6)}...${address.slice(-4)}`}</>
                          ) : (
                            'No wallet connected'
                          )}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          if (address) {
                            updateField('creatorAddress', address)
                          }
                        }}
                        disabled={!address}
                        className={`text-sm font-medium ${
                          address 
                            ? 'text-blue-600 hover:text-blue-800' 
                            : 'text-gray-400 cursor-not-allowed'
                        }`}
                      >
                        {address ? 'Use Connected Wallet' : 'No Wallet Connected'}
                      </button>
                    </div>
                  </div>
                </div>
              </motion.div>

              {/* Terms and Conditions */}
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 }}
              >
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
                  <h3 className="text-lg font-semibold text-yellow-900 mb-4">📋 Terms & Conditions</h3>
                  
                  <div className="space-y-4 text-sm text-yellow-800">
                    <div className="bg-white border border-yellow-200 rounded-lg p-4 max-h-48 overflow-y-auto">
                      <h4 className="font-medium mb-3">Marketplace Terms of Service</h4>
                      <div className="space-y-3 text-xs leading-relaxed">
                        <p>
                          <strong>1. Listing Agreement:</strong> By listing your item, you agree to sell it at the specified price 
                          and provide the described product or service to buyers.
                        </p>
                        <p>
                          <strong>2. Payment Processing:</strong> Payments are processed through smart contracts on the Ethereum 
                          blockchain. A platform fee may be deducted from your earnings.
                        </p>
                        <p>
                          <strong>3. Content Responsibility:</strong> You are responsible for ensuring your listing content is 
                          accurate, legal, and does not infringe on any intellectual property rights.
                        </p>
                        <p>
                          <strong>4. Delivery Obligations:</strong> You must deliver the product or service as described within 
                          the specified timeframe. Failure to deliver may result in refunds and account penalties.
                        </p>
                        <p>
                          <strong>5. Refund Policy:</strong> Refunds are handled according to the policy you specify. The platform 
                          may facilitate dispute resolution if necessary.
                        </p>
                        <p>
                          <strong>6. Platform Fees:</strong> A small platform fee is charged on each successful transaction to 
                          maintain and improve the marketplace.
                        </p>
                        <p>
                          <strong>7. Prohibited Content:</strong> Illegal, harmful, or inappropriate content is strictly prohibited. 
                          Violations may result in immediate removal and account suspension.
                        </p>
                        <p>
                          <strong>8. Blockchain Transactions:</strong> All transactions are recorded on the blockchain and are 
                          irreversible. Please verify all details before confirming.
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-start space-x-3">
                      <input
                        type="checkbox"
                        id="agreedToTerms"
                        checked={formData.agreedToTerms || false}
                        onChange={(e) => updateField('agreedToTerms', e.target.checked)}
                        className="mt-1 w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                      />
                      <label htmlFor="agreedToTerms" className="text-sm text-yellow-800 leading-relaxed">
                        I have read and agree to the <strong>Terms of Service</strong> and <strong>Privacy Policy</strong>. 
                        I confirm that my listing complies with all applicable laws and platform guidelines.
                      </label>
                    </div>
                    
                    {validation.getFieldError('agreedToTerms') && (
                      <p className="text-sm text-red-600 ml-7">
                        {validation.getFieldError('agreedToTerms')}
                      </p>
                    )}
                  </div>
                </div>
              </motion.div>

              {/* Transaction Information */}
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.4 }}
              >
                <div className="bg-green-50 border border-green-200 rounded-lg p-6">
                  <h3 className="text-lg font-semibold text-green-900 mb-4">🚀 Ready to Publish</h3>
                  
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                      <div className="flex justify-between">
                        <span className="text-green-700">Listing Fee:</span>
                        <span className="font-medium text-green-900">Free</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-green-700">Platform Fee (per sale):</span>
                        <span className="font-medium text-green-900">2.5%</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-green-700">Your Earnings (per sale):</span>
                        <span className="font-medium text-green-900">
                          {formData.price ? `${(parseFloat(formData.price) * 0.975).toFixed(2)} USDC` : '0 USDC'}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-green-700">Estimated Gas Fee:</span>
                        <span className="font-medium text-green-900">~$2-5</span>
                      </div>
                    </div>
                    
                    <div className="p-4 bg-white border border-green-200 rounded-lg">
                      <h4 className="font-medium text-green-900 mb-2">What happens next?</h4>
                      <ul className="text-sm text-green-800 space-y-1">
                        <li>• Your listing will be published to the blockchain</li>
                        <li>• Buyers can immediately discover and purchase your item</li>
                        <li>• You'll receive payments directly to your specified address</li>
                        <li>• You can manage your listings from your dashboard</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </motion.div>

              {/* Transaction Error Display */}
              {transactionState.status === 'error' && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-4 bg-red-50 border border-red-200 rounded-lg"
                >
                  <div className="flex items-start space-x-3">
                    <div className="flex-shrink-0">
                      <svg className="w-5 h-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div className="flex-1">
                      <h3 className="text-sm font-medium text-red-800">Transaction Failed</h3>
                      <p className="text-sm text-red-700 mt-1">
                        {transactionState.error || 'An error occurred while publishing your listing.'}
                      </p>
                      <button
                        type="button"
                        onClick={() => setTransactionState({ status: 'idle' })}
                        className="mt-2 text-sm text-red-600 hover:text-red-800 font-medium"
                      >
                        Try Again
                      </button>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* Transaction Success Display */}
              {transactionState.status === 'success' && hash && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-4 bg-green-50 border border-green-200 rounded-lg"
                >
                  <div className="flex items-start space-x-3">
                    <div className="flex-shrink-0">
                      <svg className="w-5 h-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div className="flex-1">
                      <h3 className="text-sm font-medium text-green-800">Listing Published Successfully!</h3>
                      <p className="text-sm text-green-700 mt-1">
                        Your item has been published to the marketplace and is now available for purchase.
                      </p>
                      <a
                        href={`https://basescan.org/tx/${hash}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mt-2 inline-flex items-center text-sm text-green-600 hover:text-green-800 font-medium"
                      >
                        View Transaction
                        <svg className="ml-1 w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                        </svg>
                      </a>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* Action Buttons */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="flex flex-col sm:flex-row gap-4 pt-6 border-t border-gray-200"
              >
                <button
                  type="button"
                  onClick={handlePrevious}
                  className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
                >
                  ← Back to Details
                </button>
                
                <button
                  type="button"
                  onClick={handleComplete}
                  disabled={
                    !validation.isValid || 
                    !formData.agreedToTerms || 
                    !address ||
                    transactionState.status === 'pending' || 
                    transactionState.status === 'confirming'
                  }
                  className={`flex-1 px-6 py-3 rounded-lg font-medium transition-colors ${
                    validation.isValid && 
                    formData.agreedToTerms && 
                    address &&
                    transactionState.status !== 'pending' && 
                    transactionState.status !== 'confirming'
                      ? 'bg-green-600 text-white hover:bg-green-700'
                      : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  }`}
                >
                  {transactionState.status === 'pending' ? (
                    <span className="flex items-center justify-center">
                      <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Waiting for Wallet...
                    </span>
                  ) : transactionState.status === 'confirming' ? (
                    <span className="flex items-center justify-center">
                      <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Confirming Transaction...
                    </span>
                  ) : transactionState.status === 'success' ? (
                    '✅ Published Successfully!'
                  ) : (
                    '🚀 Publish Listing'
                  )}
                </button>
              </motion.div>
            </motion.div>
          </FormStep>
        </AnimatePresence>
      </div>

      {/* Debug Information (Development Only) */}
      {process.env.NODE_ENV === 'development' && (
        <div className="px-6 py-4 bg-gray-100 border-t border-gray-200">
          <details className="text-xs text-gray-600">
            <summary className="cursor-pointer font-medium">Debug Info</summary>
            <div className="mt-2 space-y-1">
              <div>Current Step: {wizard.currentStep}</div>
              <div>Completed Steps: [{Array.from(wizard.completedSteps).join(', ')}]</div>
              <div>Form Valid: {validation.isValid.toString()}</div>
              <div>Form Dirty: {wizard.isDirty.toString()}</div>
              <div>Validation Errors: {Object.keys(validation.errors).length}</div>
            </div>
          </details>
        </div>
      )}
      </div>
    </ResponsiveContainer>
  )
}

export default ListItemWizard