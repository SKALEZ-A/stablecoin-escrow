import React, { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Eye, EyeOff, AlertCircle, Check, Info } from 'lucide-react'
import { EnhancedInputProps } from '../types'

const EnhancedInput: React.FC<EnhancedInputProps> = ({
  label,
  name,
  type = 'text',
  placeholder,
  value,
  onChange,
  onBlur,
  error,
  required = false,
  disabled = false,
  className = ''
}) => {
  const [isFocused, setIsFocused] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [hasBeenFocused, setHasBeenFocused] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const isPassword = type === 'password'
  const hasValue = value && value.length > 0
  const showError = error && hasBeenFocused
  const showSuccess = hasValue && !error && hasBeenFocused && !isFocused

  // Auto-focus animation
  useEffect(() => {
    if (inputRef.current && inputRef.current === document.activeElement) {
      setIsFocused(true)
      setHasBeenFocused(true)
    }
  }, [])

  const handleFocus = () => {
    setIsFocused(true)
    setHasBeenFocused(true)
  }

  const handleBlur = () => {
    setIsFocused(false)
    onBlur?.()
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange(e.target.value)
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
            absolute left-3 top-3 pointer-events-none font-medium text-sm origin-left z-10
            ${showError ? 'text-red-500' : ''}
          `}
        >
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </motion.label>

        {/* Input Field */}
        <motion.input
          ref={inputRef}
          id={name}
          name={name}
          type={isPassword && showPassword ? 'text' : type}
          placeholder={isFocused ? placeholder : ''}
          value={value}
          onChange={handleChange}
          onFocus={handleFocus}
          onBlur={handleBlur}
          disabled={disabled}
          variants={inputVariants}
          animate={showError ? 'error' : isFocused ? 'focused' : 'idle'}
          className={`
            w-full px-3 pt-6 pb-2 border-2 rounded-lg transition-all duration-200
            focus:outline-none disabled:bg-gray-50 disabled:text-gray-500
            ${showError 
              ? 'border-red-500 focus:border-red-500 focus:ring-4 focus:ring-red-100' 
              : showSuccess
                ? 'border-green-500 focus:border-green-500 focus:ring-4 focus:ring-green-100'
                : isFocused
                  ? 'border-blue-500 focus:border-blue-500 focus:ring-4 focus:ring-blue-100'
                  : 'border-gray-300 hover:border-gray-400'
            }
            ${isPassword ? 'pr-12' : ''}
          `}
        />

        {/* Password Toggle */}
        {isPassword && (
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700 focus:outline-none"
            tabIndex={-1}
          >
            {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
          </button>
        )}

        {/* Status Icons */}
        <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
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
      {!showError && placeholder && isFocused && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="mt-2 flex items-start"
        >
          <Info className="w-4 h-4 text-gray-400 mt-0.5 mr-2 flex-shrink-0" />
          <p className="text-sm text-gray-500">{placeholder}</p>
        </motion.div>
      )}
    </motion.div>
  )
}

export default EnhancedInput