import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { useFormValidation } from './hooks/useFormValidation'
import { listingFormSchema, basicInfoSchema } from './schemas'
import { 
  EnhancedInput, 
  EnhancedTextarea, 
  EnhancedSelect, 
  PriceInput, 
  AddressInput 
} from './fields'

// Demo component to showcase the enhanced useFormValidation hook
const FormValidationDemo: React.FC = () => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    price: '',
    category: '',
    creatorAddress: '',
    tags: [] as string[],
    additionalDetails: ''
  })

  const [validationMode, setValidationMode] = useState<'basic' | 'full'>('basic')

  // Enhanced form validation with custom validators
  const validation = useFormValidation(
    validationMode === 'basic' ? basicInfoSchema : listingFormSchema,
    {
      validateOnChange: true,
      validateOnBlur: true,
      debounceMs: 300,
      showErrorsOnlyAfterTouch: true,
      customValidators: {
        title: async (value: string) => {
          // Simulate async validation (e.g., checking if title is unique)
          await new Promise(resolve => setTimeout(resolve, 500))
          if (value && value.toLowerCase().includes('test')) {
            return 'Title cannot contain the word "test"'
          }
          return null
        },
        creatorAddress: async (value: string) => {
          // Simulate checking if address is valid on blockchain
          await new Promise(resolve => setTimeout(resolve, 300))
          if (value && value.toLowerCase() === '0x0000000000000000000000000000000000000000') {
            return 'Cannot use zero address'
          }
          return null
        }
      }
    }
  )

  const categoryOptions = [
    { value: 'digital', label: 'Digital Product' },
    { value: 'physical', label: 'Physical Product' },
    { value: 'service', label: 'Service' },
    { value: 'subscription', label: 'Subscription' },
    { value: 'course', label: 'Online Course' },
    { value: 'software', label: 'Software' },
    { value: 'other', label: 'Other' }
  ]

  const updateField = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    validation.handleFieldChange(field, value, formData)
  }

  const handleBlur = (field: string) => {
    validation.handleFieldBlur(field, formData[field as keyof typeof formData], formData)
  }

  const handleValidateForm = async () => {
    const result = await validation.validateForm(formData)
    console.log('Form validation result:', result)
  }

  const handleReset = () => {
    setFormData({
      title: '',
      description: '',
      price: '',
      category: '',
      creatorAddress: '',
      tags: [],
      additionalDetails: ''
    })
    validation.reset()
  }

  const validationSummary = validation.getValidationSummary()

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white rounded-lg shadow-lg">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <h1 className="text-3xl font-bold text-center mb-2">Form Validation Demo</h1>
        <p className="text-gray-600 text-center mb-8">
          Showcase of the enhanced useFormValidation hook with real-time validation
        </p>

        {/* Validation Mode Toggle */}
        <div className="mb-6 flex justify-center">
          <div className="bg-gray-100 p-1 rounded-lg">
            <button
              onClick={() => setValidationMode('basic')}
              className={`px-4 py-2 rounded-md transition-colors ${
                validationMode === 'basic' 
                  ? 'bg-blue-600 text-white' 
                  : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              Basic Validation
            </button>
            <button
              onClick={() => setValidationMode('full')}
              className={`px-4 py-2 rounded-md transition-colors ${
                validationMode === 'full' 
                  ? 'bg-blue-600 text-white' 
                  : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              Full Validation
            </button>
          </div>
        </div>

        {/* Validation Status */}
        <div className="mb-6 p-4 bg-gray-50 rounded-lg">
          <h3 className="text-lg font-semibold mb-3">Validation Status</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <span className="font-medium text-gray-700">Errors:</span>
              <span className={`ml-2 ${validationSummary.errorCount > 0 ? 'text-red-600' : 'text-green-600'}`}>
                {validationSummary.errorCount}
              </span>
            </div>
            <div>
              <span className="font-medium text-gray-700">Warnings:</span>
              <span className={`ml-2 ${validationSummary.warningCount > 0 ? 'text-amber-600' : 'text-gray-600'}`}>
                {validationSummary.warningCount}
              </span>
            </div>
            <div>
              <span className="font-medium text-gray-700">Touched:</span>
              <span className="ml-2 text-blue-600">{validationSummary.touchedCount}</span>
            </div>
            <div>
              <span className="font-medium text-gray-700">Valid:</span>
              <span className={`ml-2 ${validationSummary.isValid ? 'text-green-600' : 'text-red-600'}`}>
                {validationSummary.isValid ? 'Yes' : 'No'}
              </span>
            </div>
          </div>
          <div className="mt-2 text-xs text-gray-500">
            Validations: {validationSummary.validationCount} | 
            Last: {validationSummary.lastValidated?.toLocaleTimeString() || 'Never'} |
            Validating: {validation.isValidating ? 'Yes' : 'No'}
          </div>
        </div>

        {/* Form Fields */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left Column */}
          <div className="space-y-6">
            <EnhancedInput
              label="Product Title"
              name="title"
              value={formData.title}
              onChange={(value) => updateField('title', value)}
              onBlur={() => handleBlur('title')}
              placeholder="Enter a unique product title"
              error={validation.getFieldError('title')}
              required
            />

            <EnhancedTextarea
              label="Product Description"
              name="description"
              value={formData.description}
              onChange={(value) => updateField('description', value)}
              onBlur={() => handleBlur('description')}
              placeholder="Describe your product in detail..."
              maxLength={1000}
              rows={4}
              error={validation.getFieldError('description')}
              required
            />

            <PriceInput
              label="Product Price"
              name="price"
              value={formData.price}
              onChange={(value) => updateField('price', value)}
              onBlur={() => handleBlur('price')}
              currency="USDC"
              min={0.01}
              max={1000000}
              error={validation.getFieldError('price')}
              required
            />
          </div>

          {/* Right Column */}
          <div className="space-y-6">
            <EnhancedSelect
              label="Product Category"
              name="category"
              options={categoryOptions}
              value={formData.category}
              onChange={(value) => updateField('category', value)}
              onBlur={() => handleBlur('category')}
              placeholder="Choose a category"
              error={validation.getFieldError('category')}
              required
            />

            {validationMode === 'full' && (
              <>
                <AddressInput
                  label="Creator Address"
                  name="creatorAddress"
                  value={formData.creatorAddress}
                  onChange={(value) => updateField('creatorAddress', value)}
                  onBlur={() => handleBlur('creatorAddress')}
                  placeholder="0x..."
                  error={validation.getFieldError('creatorAddress')}
                  required
                />

                <EnhancedTextarea
                  label="Additional Details"
                  name="additionalDetails"
                  value={formData.additionalDetails}
                  onChange={(value) => updateField('additionalDetails', value)}
                  onBlur={() => handleBlur('additionalDetails')}
                  placeholder="Any additional information..."
                  maxLength={500}
                  rows={3}
                  error={validation.getFieldError('additionalDetails')}
                />
              </>
            )}
          </div>
        </div>

        {/* Field Status Display */}
        <div className="mt-8 p-4 bg-gray-50 rounded-lg">
          <h3 className="text-lg font-semibold mb-3">Field Validation Status</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
            {Object.keys(formData).map(fieldName => {
              const status = validation.fieldValidationStatus[fieldName] || 'idle'
              const isTouched = validation.isFieldTouched(fieldName)
              const isValid = validation.isFieldValid(fieldName)
              
              return (
                <div key={fieldName} className="flex items-center justify-between p-2 bg-white rounded border">
                  <span className="font-medium">{fieldName}:</span>
                  <div className="flex items-center space-x-2">
                    <span className={`px-2 py-1 rounded text-xs ${
                      status === 'valid' ? 'bg-green-100 text-green-800' :
                      status === 'invalid' ? 'bg-red-100 text-red-800' :
                      status === 'validating' ? 'bg-blue-100 text-blue-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {status}
                    </span>
                    {isTouched && (
                      <span className="w-2 h-2 bg-blue-500 rounded-full" title="Touched" />
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="mt-8 flex flex-col sm:flex-row gap-4">
          <button
            onClick={handleValidateForm}
            disabled={validation.isValidating}
            className="flex-1 py-3 px-6 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {validation.isValidating ? 'Validating...' : 'Validate Form'}
          </button>
          <button
            onClick={handleReset}
            className="flex-1 py-3 px-6 bg-gray-600 text-white font-semibold rounded-lg hover:bg-gray-700 transition-colors"
          >
            Reset Form
          </button>
          <button
            onClick={() => validation.clearErrors()}
            className="flex-1 py-3 px-6 bg-amber-600 text-white font-semibold rounded-lg hover:bg-amber-700 transition-colors"
          >
            Clear Errors
          </button>
        </div>

        {/* Current Errors Display */}
        {Object.keys(validation.errors).length > 0 && (
          <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <h3 className="text-lg font-semibold text-red-800 mb-3">Current Errors</h3>
            <ul className="space-y-1">
              {Object.entries(validation.errors).map(([field, error]) => (
                error && (
                  <li key={field} className="text-sm text-red-700">
                    <strong>{field}:</strong> {error}
                  </li>
                )
              ))}
            </ul>
          </div>
        )}

        {/* Current Warnings Display */}
        {Object.keys(validation.warnings).length > 0 && (
          <div className="mt-4 p-4 bg-amber-50 border border-amber-200 rounded-lg">
            <h3 className="text-lg font-semibold text-amber-800 mb-3">Current Warnings</h3>
            <ul className="space-y-1">
              {Object.entries(validation.warnings).map(([field, warning]) => (
                warning && (
                  <li key={field} className="text-sm text-amber-700">
                    <strong>{field}:</strong> {warning}
                  </li>
                )
              ))}
            </ul>
          </div>
        )}

        {/* Form Data Display */}
        <div className="mt-6 p-4 bg-gray-50 rounded-lg">
          <h3 className="text-lg font-semibold mb-3">Current Form Data</h3>
          <pre className="text-sm text-gray-700 overflow-x-auto">
            {JSON.stringify(formData, null, 2)}
          </pre>
        </div>
      </motion.div>
    </div>
  )
}

export default FormValidationDemo