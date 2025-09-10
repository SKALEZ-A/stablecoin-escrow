import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { 
  EnhancedInput, 
  EnhancedTextarea, 
  EnhancedSelect, 
  PriceInput, 
  AddressInput,
  ImageUpload 
} from './fields'

// Demo component to showcase all enhanced form field components
const FormFieldsDemo: React.FC = () => {
  const [formData, setFormData] = useState({
    title: '',
    email: '',
    password: '',
    description: '',
    category: '',
    price: '',
    walletAddress: '',
    images: [] as File[]
  })

  const [errors, setErrors] = useState<Record<string, string>>({})

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

  const updateField = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }))
    }
  }

  const validateField = (field: string, value: any): string => {
    switch (field) {
      case 'title':
        if (!value.trim()) return 'Title is required'
        if (value.length < 3) return 'Title must be at least 3 characters'
        if (value.length > 100) return 'Title must be less than 100 characters'
        break
      case 'email':
        if (!value.trim()) return 'Email is required'
        if (!/\S+@\S+\.\S+/.test(value)) return 'Please enter a valid email address'
        break
      case 'password':
        if (!value) return 'Password is required'
        if (value.length < 8) return 'Password must be at least 8 characters'
        if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(value)) {
          return 'Password must contain uppercase, lowercase, and number'
        }
        break
      case 'description':
        if (!value.trim()) return 'Description is required'
        if (value.length < 10) return 'Description must be at least 10 characters'
        if (value.length > 1000) return 'Description must be less than 1000 characters'
        break
      case 'category':
        if (!value) return 'Please select a category'
        break
      case 'price':
        if (!value.trim()) return 'Price is required'
        const num = parseFloat(value)
        if (isNaN(num) || num <= 0) return 'Price must be a positive number'
        if (num > 1000000) return 'Price cannot exceed 1,000,000 USDC'
        break
      case 'walletAddress':
        if (!value.trim()) return 'Wallet address is required'
        if (!/^0x[a-fA-F0-9]{40}$/.test(value)) return 'Please enter a valid Ethereum address'
        break
    }
    return ''
  }

  const handleBlur = (field: string) => {
    const error = validateField(field, formData[field as keyof typeof formData])
    setErrors(prev => ({ ...prev, [field]: error }))
  }

  const handleValidateAll = () => {
    const newErrors: Record<string, string> = {}
    Object.keys(formData).forEach(field => {
      if (field !== 'images') {
        const error = validateField(field, formData[field as keyof typeof formData])
        if (error) newErrors[field] = error
      }
    })
    setErrors(newErrors)
    
    const isValid = Object.keys(newErrors).length === 0
    if (isValid) {
      alert('All fields are valid! 🎉')
    }
  }

  const handleReset = () => {
    setFormData({
      title: '',
      email: '',
      password: '',
      description: '',
      category: '',
      price: '',
      walletAddress: '',
      images: []
    })
    setErrors({})
  }

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white rounded-lg shadow-lg">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <h1 className="text-3xl font-bold text-center mb-2">Enhanced Form Fields Demo</h1>
        <p className="text-gray-600 text-center mb-8">
          Showcase of all enhanced form field components with validation and animations
        </p>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left Column */}
          <div className="space-y-6">
            <EnhancedInput
              label="Product Title"
              name="title"
              value={formData.title}
              onChange={(value) => updateField('title', value)}
              onBlur={() => handleBlur('title')}
              placeholder="Enter a catchy product title"
              error={errors.title}
              required
            />

            <EnhancedInput
              label="Email Address"
              name="email"
              type="email"
              value={formData.email}
              onChange={(value) => updateField('email', value)}
              onBlur={() => handleBlur('email')}
              placeholder="your.email@example.com"
              error={errors.email}
              required
            />

            <EnhancedInput
              label="Password"
              name="password"
              type="password"
              value={formData.password}
              onChange={(value) => updateField('password', value)}
              onBlur={() => handleBlur('password')}
              placeholder="Create a strong password"
              error={errors.password}
              required
            />

            <EnhancedSelect
              label="Product Category"
              name="category"
              options={categoryOptions}
              value={formData.category}
              onChange={(value) => updateField('category', value)}
              onBlur={() => handleBlur('category')}
              placeholder="Choose a category"
              error={errors.category}
              required
            />
          </div>

          {/* Right Column */}
          <div className="space-y-6">
            <PriceInput
              label="Product Price"
              name="price"
              value={formData.price}
              onChange={(value) => updateField('price', value)}
              onBlur={() => handleBlur('price')}
              currency="USDC"
              min={0.01}
              max={1000000}
              error={errors.price}
              required
            />

            <AddressInput
              label="Wallet Address"
              name="walletAddress"
              value={formData.walletAddress}
              onChange={(value) => updateField('walletAddress', value)}
              onBlur={() => handleBlur('walletAddress')}
              placeholder="0x..."
              error={errors.walletAddress}
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
              rows={6}
              error={errors.description}
              required
            />
          </div>
        </div>

        {/* Full Width Components */}
        <div className="mt-6">
          <ImageUpload
            label="Product Images"
            name="images"
            files={formData.images}
            onChange={(files) => updateField('images', files)}
            maxFiles={5}
            maxSize={5 * 1024 * 1024} // 5MB
            acceptedTypes={['image/jpeg', 'image/png', 'image/webp']}
          />
        </div>

        {/* Action Buttons */}
        <div className="mt-8 flex flex-col sm:flex-row gap-4">
          <button
            onClick={handleValidateAll}
            className="flex-1 py-3 px-6 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors focus:outline-none focus:ring-4 focus:ring-blue-100"
          >
            Validate All Fields
          </button>
          <button
            onClick={handleReset}
            className="flex-1 py-3 px-6 bg-gray-600 text-white font-semibold rounded-lg hover:bg-gray-700 transition-colors focus:outline-none focus:ring-4 focus:ring-gray-100"
          >
            Reset Form
          </button>
        </div>

        {/* Form Data Display */}
        <div className="mt-8 p-4 bg-gray-50 rounded-lg">
          <h3 className="text-lg font-semibold mb-3">Current Form Data:</h3>
          <pre className="text-sm text-gray-700 overflow-x-auto">
            {JSON.stringify(
              {
                ...formData,
                images: formData.images.map(file => ({
                  name: file.name,
                  size: file.size,
                  type: file.type
                }))
              }, 
              null, 
              2
            )}
          </pre>
        </div>

        {/* Validation Errors Display */}
        {Object.keys(errors).length > 0 && (
          <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
            <h3 className="text-lg font-semibold text-red-800 mb-3">Validation Errors:</h3>
            <ul className="space-y-1">
              {Object.entries(errors).map(([field, error]) => (
                error && (
                  <li key={field} className="text-sm text-red-700">
                    <strong>{field}:</strong> {error}
                  </li>
                )
              ))}
            </ul>
          </div>
        )}
      </motion.div>
    </div>
  )
}

export default FormFieldsDemo