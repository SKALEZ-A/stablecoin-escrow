import React from 'react'
import { useFormWizard } from './hooks/useFormWizard'
import FormStep from './FormStep'
import ProgressIndicator from './ProgressIndicator'
import { EnhancedInput, EnhancedTextarea, EnhancedSelect, PriceInput } from './fields'

// Demo component to test the enhanced useFormWizard hook
const FormWizardDemo: React.FC = () => {
  const stepLabels = ['Basic Info', 'Product Details', 'Pricing', 'Review']

  // Enhanced form wizard with validation and persistence
  const wizard = useFormWizard(
    4, // totalSteps
    { // initialData
      title: '',
      description: '',
      category: '',
      price: '',
      email: ''
    },
    { // options
      persistKey: 'demo-form',
      autoSave: true,
      autoSaveDelay: 500,
      allowSkipSteps: false,
      validateStep: async (step: number, data: Record<string, any>) => {
        const errors: string[] = []
        
        switch (step) {
          case 1:
            if (!data.title?.trim()) errors.push('Title is required')
            if (!data.email?.trim()) errors.push('Email is required')
            else if (!/\S+@\S+\.\S+/.test(data.email)) errors.push('Email format is invalid')
            break
          case 2:
            if (!data.description?.trim()) errors.push('Description is required')
            else if (data.description.length < 10) errors.push('Description must be at least 10 characters')
            if (!data.category?.trim()) errors.push('Category is required')
            break
          case 3:
            if (!data.price?.trim()) errors.push('Price is required')
            else if (isNaN(parseFloat(data.price)) || parseFloat(data.price) <= 0) {
              errors.push('Price must be a valid positive number')
            }
            break
          case 4:
            // Review step - all validations should pass
            break
        }
        
        // Simulate async validation
        await new Promise(resolve => setTimeout(resolve, 300))
        
        return { isValid: errors.length === 0, errors }
      },
      onStepChange: (step, direction) => {
        console.log(`Step changed to ${step} (${direction})`)
      },
      onComplete: async (data) => {
        console.log('Form completed with data:', data)
        alert('Form submitted successfully!')
      }
    }
  )

  const categoryOptions = [
    { value: 'digital', label: 'Digital Product' },
    { value: 'physical', label: 'Physical Product' },
    { value: 'service', label: 'Service' },
    { value: 'other', label: 'Other' }
  ]

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white rounded-lg shadow-lg">
      <h1 className="text-3xl font-bold text-center mb-8">Enhanced Form Wizard Demo</h1>
      
      {/* Progress Indicator */}
      <div className="mb-8">
        <ProgressIndicator
          currentStep={wizard.currentStep}
          totalSteps={wizard.totalSteps}
          stepLabels={stepLabels}
        />
      </div>

      {/* Form Status */}
      <div className="mb-6 p-4 bg-gray-50 rounded-lg">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div>
            <span className="font-medium text-gray-700">Progress:</span>
            <span className="ml-2 text-blue-600">{Math.round(wizard.progress)}%</span>
          </div>
          <div>
            <span className="font-medium text-gray-700">Completed Steps:</span>
            <span className="ml-2 text-green-600">{wizard.completedSteps.size}</span>
          </div>
          <div>
            <span className="font-medium text-gray-700">Form Status:</span>
            <span className={`ml-2 ${wizard.isDirty ? 'text-amber-600' : 'text-green-600'}`}>
              {wizard.isDirty ? 'Unsaved' : 'Saved'}
            </span>
          </div>
          <div>
            <span className="font-medium text-gray-700">Current Valid:</span>
            <span className={`ml-2 ${wizard.isValid ? 'text-green-600' : 'text-red-600'}`}>
              {wizard.isValid ? 'Yes' : 'No'}
            </span>
          </div>
        </div>
      </div>

      {/* Step 1: Basic Information */}
      <FormStep
        title="Basic Information"
        description="Let's start with some basic details"
        isActive={wizard.currentStep === 1}
        isCompleted={wizard.completedSteps.has(1)}
        onNext={wizard.nextStep}
        canProceed={wizard.isValid}
        isLoading={wizard.isLoading}
        stepNumber={1}
        totalSteps={wizard.totalSteps}
        validationErrors={wizard.stepErrors[1] || []}
      >
        <div className="space-y-4">
          <EnhancedInput
            label="Product Title"
            name="title"
            value={wizard.formData.title || ''}
            onChange={(value) => wizard.updateField('title', value)}
            placeholder="Enter product title"
            required
          />
          <EnhancedInput
            label="Contact Email"
            name="email"
            type="email"
            value={wizard.formData.email || ''}
            onChange={(value) => wizard.updateField('email', value)}
            placeholder="Enter your email"
            required
          />
        </div>
      </FormStep>

      {/* Step 2: Product Details */}
      <FormStep
        title="Product Details"
        description="Tell us more about your product"
        isActive={wizard.currentStep === 2}
        isCompleted={wizard.completedSteps.has(2)}
        onNext={wizard.nextStep}
        onPrevious={wizard.previousStep}
        canProceed={wizard.isValid}
        isLoading={wizard.isLoading}
        stepNumber={2}
        totalSteps={wizard.totalSteps}
        validationErrors={wizard.stepErrors[2] || []}
      >
        <div className="space-y-4">
          <EnhancedTextarea
            label="Product Description"
            name="description"
            value={wizard.formData.description || ''}
            onChange={(value) => wizard.updateField('description', value)}
            placeholder="Describe your product..."
            required
            maxLength={500}
            rows={6}
          />
          <EnhancedSelect
            label="Category"
            name="category"
            options={categoryOptions}
            value={wizard.formData.category || ''}
            onChange={(value) => wizard.updateField('category', value)}
            required
          />
        </div>
      </FormStep>

      {/* Step 3: Pricing */}
      <FormStep
        title="Pricing Information"
        description="Set your product price"
        isActive={wizard.currentStep === 3}
        isCompleted={wizard.completedSteps.has(3)}
        onNext={wizard.nextStep}
        onPrevious={wizard.previousStep}
        canProceed={wizard.isValid}
        isLoading={wizard.isLoading}
        stepNumber={3}
        totalSteps={wizard.totalSteps}
        validationErrors={wizard.stepErrors[3] || []}
      >
        <div className="space-y-4">
          <PriceInput
            label="Product Price"
            name="price"
            value={wizard.formData.price || ''}
            onChange={(value) => wizard.updateField('price', value)}
            currency="USDC"
            min={0.01}
            max={10000}
            required
          />
          <div className="p-4 bg-blue-50 rounded-lg">
            <h4 className="font-medium text-blue-900 mb-2">Pricing Information</h4>
            <p className="text-sm text-blue-700">
              Set a competitive price for your product. Consider market rates and your costs.
            </p>
          </div>
        </div>
      </FormStep>

      {/* Step 4: Review */}
      <FormStep
        title="Review & Submit"
        description="Please review your information before submitting"
        isActive={wizard.currentStep === 4}
        isCompleted={false}
        onPrevious={wizard.previousStep}
        canProceed={true}
        isLoading={wizard.isLoading}
        stepNumber={4}
        totalSteps={wizard.totalSteps}
        validationErrors={[]}
      >
        <div className="space-y-6">
          <div className="bg-gray-50 p-6 rounded-lg">
            <h3 className="text-lg font-semibold mb-4">Review Your Product</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <span className="font-medium text-gray-700">Title:</span>
                <p className="text-gray-900">{wizard.formData.title}</p>
              </div>
              <div>
                <span className="font-medium text-gray-700">Email:</span>
                <p className="text-gray-900">{wizard.formData.email}</p>
              </div>
              <div>
                <span className="font-medium text-gray-700">Category:</span>
                <p className="text-gray-900">
                  {categoryOptions.find(opt => opt.value === wizard.formData.category)?.label || 'Not selected'}
                </p>
              </div>
              <div>
                <span className="font-medium text-gray-700">Price:</span>
                <p className="text-gray-900">{wizard.formData.price} USDC</p>
              </div>
              <div className="md:col-span-2">
                <span className="font-medium text-gray-700">Description:</span>
                <p className="text-gray-900 mt-1">{wizard.formData.description}</p>
              </div>
            </div>
          </div>
          
          <div className="flex space-x-4">
            <button
              onClick={wizard.complete}
              disabled={wizard.isLoading}
              className="flex-1 py-3 px-6 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {wizard.isLoading ? 'Submitting...' : 'Submit Product'}
            </button>
            <button
              onClick={wizard.reset}
              disabled={wizard.isLoading}
              className="px-6 py-3 bg-gray-600 text-white font-semibold rounded-lg hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Reset Form
            </button>
          </div>
        </div>
      </FormStep>

      {/* Debug Information */}
      <div className="mt-8 p-4 bg-gray-100 rounded-lg">
        <h4 className="font-medium text-gray-800 mb-2">Debug Information</h4>
        <div className="text-xs text-gray-600 space-y-1">
          <div>Current Step: {wizard.currentStep}</div>
          <div>Completed Steps: [{Array.from(wizard.completedSteps).join(', ')}]</div>
          <div>Visited Steps: [{Array.from(wizard.visitedSteps).join(', ')}]</div>
          <div>Is Valid: {wizard.isValid.toString()}</div>
          <div>Is Dirty: {wizard.isDirty.toString()}</div>
          <div>Is Loading: {wizard.isLoading.toString()}</div>
        </div>
      </div>
    </div>
  )
}

export default FormWizardDemo