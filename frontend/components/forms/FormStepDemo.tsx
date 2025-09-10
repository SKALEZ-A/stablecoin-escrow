import React, { useState } from 'react'
import FormStep from './FormStep'
import ProgressIndicator from './ProgressIndicator'
import { EnhancedInput, EnhancedTextarea } from './fields'

// Demo component to test the enhanced FormStep functionality
const FormStepDemo: React.FC = () => {
  const [currentStep, setCurrentStep] = useState(1)
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    email: ''
  })
  const [isLoading, setIsLoading] = useState(false)

  const totalSteps = 3
  const stepLabels = ['Basic Info', 'Details', 'Review']

  const validateStep = (step: number): { isValid: boolean; errors: string[] } => {
    const errors: string[] = []
    
    switch (step) {
      case 1:
        if (!formData.title.trim()) errors.push('Title is required')
        if (!formData.email.trim()) errors.push('Email is required')
        else if (!/\S+@\S+\.\S+/.test(formData.email)) errors.push('Email format is invalid')
        break
      case 2:
        if (!formData.description.trim()) errors.push('Description is required')
        else if (formData.description.length < 10) errors.push('Description must be at least 10 characters')
        break
      case 3:
        // Review step - all previous validations should pass
        break
    }
    
    return { isValid: errors.length === 0, errors }
  }

  const handleNext = async () => {
    const validation = validateStep(currentStep)
    if (!validation.isValid) return

    setIsLoading(true)
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000))
    setIsLoading(false)
    
    if (currentStep < totalSteps) {
      setCurrentStep(currentStep + 1)
    }
  }

  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1)
    }
  }

  const handleSubmit = async () => {
    setIsLoading(true)
    // Simulate form submission
    await new Promise(resolve => setTimeout(resolve, 2000))
    setIsLoading(false)
    alert('Form submitted successfully!')
  }

  const currentValidation = validateStep(currentStep)

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white rounded-lg shadow-lg">
      <h1 className="text-3xl font-bold text-center mb-8">Enhanced Form Demo</h1>
      
      {/* Progress Indicator */}
      <div className="mb-8">
        <ProgressIndicator
          currentStep={currentStep}
          totalSteps={totalSteps}
          stepLabels={stepLabels}
        />
      </div>

      {/* Step 1: Basic Information */}
      <FormStep
        title="Basic Information"
        description="Let's start with some basic details about you"
        isActive={currentStep === 1}
        isCompleted={currentStep > 1}
        onNext={handleNext}
        canProceed={currentValidation.isValid}
        isLoading={isLoading}
        stepNumber={1}
        totalSteps={totalSteps}
        validationErrors={currentValidation.errors}
      >
        <div className="space-y-4">
          <EnhancedInput
            label="Title"
            name="title"
            value={formData.title}
            onChange={(value) => setFormData(prev => ({ ...prev, title: value }))}
            placeholder="Enter a title"
            required
            error={!formData.title.trim() && currentValidation.errors.includes('Title is required') ? 'Title is required' : ''}
          />
          <EnhancedInput
            label="Email"
            name="email"
            type="email"
            value={formData.email}
            onChange={(value) => setFormData(prev => ({ ...prev, email: value }))}
            placeholder="Enter your email"
            required
            error={currentValidation.errors.find(e => e.includes('Email')) || ''}
          />
        </div>
      </FormStep>

      {/* Step 2: Details */}
      <FormStep
        title="Additional Details"
        description="Tell us more about yourself"
        isActive={currentStep === 2}
        isCompleted={currentStep > 2}
        onNext={handleNext}
        onPrevious={handlePrevious}
        canProceed={currentValidation.isValid}
        isLoading={isLoading}
        stepNumber={2}
        totalSteps={totalSteps}
        validationErrors={currentValidation.errors}
      >
        <div className="space-y-4">
          <EnhancedTextarea
            label="Description"
            name="description"
            value={formData.description}
            onChange={(value) => setFormData(prev => ({ ...prev, description: value }))}
            placeholder="Tell us about yourself..."
            required
            maxLength={500}
            rows={6}
            error={currentValidation.errors.find(e => e.includes('Description')) || ''}
          />
        </div>
      </FormStep>

      {/* Step 3: Review */}
      <FormStep
        title="Review & Submit"
        description="Please review your information before submitting"
        isActive={currentStep === 3}
        isCompleted={false}
        onPrevious={handlePrevious}
        canProceed={true}
        isLoading={isLoading}
        stepNumber={3}
        totalSteps={totalSteps}
        validationErrors={[]}
      >
        <div className="space-y-6">
          <div className="bg-gray-50 p-6 rounded-lg">
            <h3 className="text-lg font-semibold mb-4">Review Your Information</h3>
            <div className="space-y-3">
              <div>
                <span className="font-medium text-gray-700">Title:</span>
                <span className="ml-2 text-gray-900">{formData.title}</span>
              </div>
              <div>
                <span className="font-medium text-gray-700">Email:</span>
                <span className="ml-2 text-gray-900">{formData.email}</span>
              </div>
              <div>
                <span className="font-medium text-gray-700">Description:</span>
                <p className="mt-1 text-gray-900">{formData.description}</p>
              </div>
            </div>
          </div>
          
          <button
            onClick={handleSubmit}
            disabled={isLoading}
            className="w-full py-3 px-6 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isLoading ? 'Submitting...' : 'Submit Form'}
          </button>
        </div>
      </FormStep>
    </div>
  )
}

export default FormStepDemo