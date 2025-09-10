import React, { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { DollarSign, AlertCircle, Check, TrendingUp, Info } from 'lucide-react'
import { PriceInputProps } from '../types'

const PriceInput: React.FC<PriceInputProps> = ({
  label,
  name,
  value,
  onChange,
  onBlur,
  error,
  required = false,
  disabled = false,
  className = '',
  currency = 'USDC',
  min = 0,
  max = 1000000
}) => {
  const [isFocused, setIsFocused] = useState(false)
  const [hasBeenFocused, setHasBeenFocused] = useState(false)
  const [displayValue, setDisplayValue] = useState(value)
  const inputRef = useRef<HTMLInputElement>(null)

  const hasValue = value && value.length > 0
  const showError = error && hasBeenFocused
  const showSuccess = hasValue && !error && hasBeenFocused && !isFocused
  const numericValue = parseFloat(value) || 0

  // Format number with commas for display
  const formatDisplayValue = (val: string) => {
    if (!val) return ''
    const num = parseFloat(val)
    if (isNaN(num)) return val
    return num.toLocaleString('en-US', { 
      minimumFractionDigits: 0, 
      maximumFractionDigits: 6 
    })
  }

  // Remove formatting for actual value
  const parseInputValue = (val: string) => {
    return val.replace(/,/g, '')
  }

  useEffect(() => {
    if (!isFocused) {
      setDisplayValue(formatDisplayValue(value))
    }
  }, [value, isFocused])

  const handleFocus = () => {
    setIsFocused(true)
    setHasBeenFocused(true)
    setDisplayValue(value) // Show raw value when focused
  }

  const handleBlur = () => {
    setIsFocused(false)
    setDisplayValue(formatDisplayValue(value)) // Format when not focused
    onBlur?.()
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawValue = parseInputValue(e.target.value)
    setDisplayValue(e.target.value)
    onChange(rawValue)
  }

  const inputVariants = {
    idle: { scale: 1 },
    focused: { scale: 1.02 },
    error: { 
      scale: 1,
      x: [-2, 2, -2, 2, 0],
      transition: { duration: 0.4 }
    }
  }

  const labelVariants = {
    idle: { 
      y: 0, 
      scale: 1, 
      color: '#6B7280' 
    },
    focused: { 
      y: -20, 
      scale: 0.85, 
      color: '#3B82F6',
      transition: { duration: 0.2 }
    },
    filled: { 
      y: -20, 
      scale: 0.85, 
      color: '#6B7280',
      transition: { duration: 0.2 }
    }
  }

  const getLabelState = () => {
    if (isFocused) return 'focused'
    if (hasValue) return 'filled'
    return 'idle'
  }

  const getPriceCategory = () => {
    if (numericValue === 0) return null
    if (numericValue < 1) return 'Low'
    if (numericValue < 100) return 'Medium'
    if (numericValue < 1000) return 'High'
    return 'Premium'
  }

  const getPriceCategoryColor = () => {
    const category = getPriceCategory()
    switch (category) {
      case 'Low': return 'text-green-600 bg-green-50'
      case 'Medium': return 'text-blue-600 bg-blue-50'
      case 'High': return 'text-amber-600 bg-amber-50'
      case 'Premium': return 'text-purple-600 bg-purple-50'
      default: return 'text-gray-600 bg-gray-50'
    }
  }

  return (
    <motion.div 
      className={`relative mb-6 ${className}`}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      {/* Input Container */}
      <div className="relative">
        {/* Floating Label */}
        <motion.label
          htmlFor={name}
          variants={labelVariants}
          animate={getLabelState()}
          className={`
            absolute left-12 top-3 pointer-events-none font-medium text-sm origin-left z-10
            ${showError ? 'text-red-500' : ''}
          `}
        >
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </motion.label>

        {/* Currency Icon */}
        <div className="absolute left-3 top-1/2 transform -translate-y-1/2 z-10">
          <DollarSign className={`h-5 w-5 ${
            showError ? 'text-red-500' : 
            isFocused ? 'text-blue-500' : 
            'text-gray-400'
          }`} />
        </div>

        {/* Input Field */}
        <motion.input
          ref={inputRef}
          id={name}
          name={name}
          type="text"
          inputMode="decimal"
          placeholder={isFocused ? '0.00' : ''}
          value={displayValue}
          onChange={handleChange}
          onFocus={handleFocus}
          onBlur={handleBlur}
          disabled={disabled}
          variants={inputVariants}
          animate={showError ? 'error' : isFocused ? 'focused' : 'idle'}
          className={`
            w-full pl-12 pr-20 pt-6 pb-2 border-2 rounded-lg transition-all duration-200
            focus:outline-none disabled:bg-gray-50 disabled:text-gray-500 text-right font-mono
            ${showError 
              ? 'border-red-500 focus:border-red-500 focus:ring-4 focus:ring-red-100' 
              : showSuccess
                ? 'border-green-500 focus:border-green-500 focus:ring-4 focus:ring-green-100'
                : isFocused
                  ? 'border-blue-500 focus:border-blue-500 focus:ring-4 focus:ring-blue-100'
                  : 'border-gray-300 hover:border-gray-400'
            }
          `}
        />

        {/* Currency Label */}
        <div className="absolute right-3 top-1/2 transform -translate-y-1/2 flex items-center">
          <span className={`text-sm font-medium ${
            showError ? 'text-red-500' : 
            isFocused ? 'text-blue-500' : 
            'text-gray-500'
          }`}>
            {currency}
          </span>
        </div>

        {/* Status Icons */}
        <div className="absolute right-16 top-6">
          <AnimatePresence mode="wait">
            {showError && (
              <motion.div
                key="error"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                transition={{ duration: 0.2 }}
              >
                <AlertCircle className="w-5 h-5 text-red-500" />
              </motion.div>
            )}
            {showSuccess && (
              <motion.div
                key="success"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                transition={{ duration: 0.2 }}
              >
                <Check className="w-5 h-5 text-green-500" />
              </motion.div>
            )}
            {isFocused && !showError && !showSuccess && (
              <motion.div
                key="trending"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                transition={{ duration: 0.2 }}
              >
                <TrendingUp className="w-5 h-5 text-blue-500" />
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Focus Ring Animation */}
        <motion.div
          className="absolute inset-0 rounded-lg pointer-events-none"
          initial={false}
          animate={{
            boxShadow: isFocused 
              ? showError
                ? '0 0 0 4px rgba(239, 68, 68, 0.1)'
                : '0 0 0 4px rgba(59, 130, 246, 0.1)'
              : '0 0 0 0px transparent'
          }}
          transition={{ duration: 0.2 }}
        />
      </div>

      {/* Price Information */}
      {hasValue && !showError && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          className="mt-3 flex items-center justify-between"
        >
          {/* Price Category */}
          {getPriceCategory() && (
            <div className={`px-2 py-1 rounded-full text-xs font-medium ${getPriceCategoryColor()}`}>
              {getPriceCategory()} Price
            </div>
          )}

          {/* Price Range Indicator */}
          <div className="text-xs text-gray-500">
            Range: {min} - {max.toLocaleString()} {currency}
          </div>
        </motion.div>
      )}

      {/* Error Message */}
      <AnimatePresence>
        {showError && (
          <motion.div
            initial={{ opacity: 0, height: 0, y: -10 }}
            animate={{ opacity: 1, height: 'auto', y: 0 }}
            exit={{ opacity: 0, height: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="mt-2 flex items-start"
          >
            <AlertCircle className="w-4 h-4 text-red-500 mt-0.5 mr-2 flex-shrink-0" />
            <p className="text-sm text-red-600">{error}</p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Helper Text */}
      {!showError && isFocused && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="mt-2 flex items-start"
        >
          <Info className="w-4 h-4 text-gray-400 mt-0.5 mr-2 flex-shrink-0" />
          <p className="text-sm text-gray-500">
            Enter the price in {currency}. Use decimal points for precise pricing.
          </p>
        </motion.div>
      )}
    </motion.div>
  )
}

export default PriceInput