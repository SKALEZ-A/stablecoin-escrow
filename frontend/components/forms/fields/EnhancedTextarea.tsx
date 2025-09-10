import React, { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { AlertCircle, Check, Info, Type } from 'lucide-react'
import { EnhancedTextareaProps } from '../types'

const EnhancedTextarea: React.FC<EnhancedTextareaProps> = ({
  label,
  name,
  placeholder,
  value,
  onChange,
  onBlur,
  error,
  required = false,
  disabled = false,
  className = '',
  maxLength,
  rows = 4
}) => {
  const [isFocused, setIsFocused] = useState(false)
  const [hasBeenFocused, setHasBeenFocused] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const hasValue = value && value.length > 0
  const showError = error && hasBeenFocused
  const showSuccess = hasValue && !error && hasBeenFocused && !isFocused
  const characterCount = value ? value.length : 0
  const isNearLimit = maxLength && characterCount > maxLength * 0.8
  const isOverLimit = maxLength && characterCount > maxLength

  // Auto-resize functionality
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`
    }
  }, [value])

  const handleFocus = () => {
    setIsFocused(true)
    setHasBeenFocused(true)
  }

  const handleBlur = () => {
    setIsFocused(false)
    onBlur?.()
  }

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    onChange(e.target.value)
  }

  const textareaVariants = {
    idle: { scale: 1 },
    focused: { scale: 1.01 },
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

  const getCharacterCountColor = () => {
    if (isOverLimit) return 'text-red-500'
    if (isNearLimit) return 'text-amber-500'
    return 'text-gray-500'
  }

  return (
    <motion.div 
      className={`relative mb-6 ${className}`}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      {/* Textarea Container */}
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

        {/* Textarea Field */}
        <motion.textarea
          ref={textareaRef}
          id={name}
          name={name}
          placeholder={isFocused ? placeholder : ''}
          value={value}
          onChange={handleChange}
          onFocus={handleFocus}
          onBlur={handleBlur}
          disabled={disabled}
          rows={rows}
          maxLength={maxLength}
          variants={textareaVariants}
          animate={showError ? 'error' : isFocused ? 'focused' : 'idle'}
          className={`
            w-full px-3 pt-6 pb-2 border-2 rounded-lg transition-all duration-200 resize-none
            focus:outline-none disabled:bg-gray-50 disabled:text-gray-500
            ${showError 
              ? 'border-red-500 focus:border-red-500 focus:ring-4 focus:ring-red-100' 
              : showSuccess
                ? 'border-green-500 focus:border-green-500 focus:ring-4 focus:ring-green-100'
                : isFocused
                  ? 'border-blue-500 focus:border-blue-500 focus:ring-4 focus:ring-blue-100'
                  : 'border-gray-300 hover:border-gray-400'
            }
          `}
          style={{ minHeight: `${rows * 1.5}rem` }}
        />

        {/* Status Icons */}
        <div className="absolute right-3 top-6">
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
                key="typing"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                transition={{ duration: 0.2 }}
              >
                <Type className="w-5 h-5 text-blue-500" />
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

      {/* Footer with Error/Character Count */}
      <div className="mt-2 flex justify-between items-start">
        {/* Error Message */}
        <AnimatePresence>
          {showError && (
            <motion.div
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              transition={{ duration: 0.2 }}
              className="flex items-start flex-1 mr-4"
            >
              <AlertCircle className="w-4 h-4 text-red-500 mt-0.5 mr-2 flex-shrink-0" />
              <p className="text-sm text-red-600">{error}</p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Character Count */}
        {maxLength && (
          <motion.div
            className="flex items-center"
            animate={{ 
              scale: isNearLimit ? [1, 1.1, 1] : 1,
              transition: { duration: 0.3 }
            }}
          >
            <span className={`text-sm font-medium ${getCharacterCountColor()}`}>
              {characterCount}/{maxLength}
            </span>
            {isOverLimit && (
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                className="ml-1"
              >
                <AlertCircle className="w-4 h-4 text-red-500" />
              </motion.div>
            )}
          </motion.div>
        )}
      </div>

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

export default EnhancedTextarea