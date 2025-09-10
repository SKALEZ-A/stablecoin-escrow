import React, { useState, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronDown, AlertCircle, Check, Search, Info } from 'lucide-react'
import { EnhancedSelectProps } from '../types'

const EnhancedSelect: React.FC<EnhancedSelectProps> = ({
  label,
  name,
  options,
  value,
  onChange,
  onBlur,
  error,
  required = false,
  disabled = false,
  className = '',
  placeholder = 'Select an option...'
}) => {
  const [isFocused, setIsFocused] = useState(false)
  const [hasBeenFocused, setHasBeenFocused] = useState(false)
  const [isOpen, setIsOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const selectRef = useRef<HTMLDivElement>(null)

  const hasValue = value && value.length > 0
  const showError = error && hasBeenFocused
  const showSuccess = hasValue && !error && hasBeenFocused && !isFocused
  const selectedOption = options.find(opt => opt.value === value)

  // Filter options based on search term
  const filteredOptions = options.filter(option =>
    option.label.toLowerCase().includes(searchTerm.toLowerCase()) ||
    option.value.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const handleFocus = () => {
    setIsFocused(true)
    setHasBeenFocused(true)
  }

  const handleBlur = () => {
    setIsFocused(false)
    // Delay closing to allow for option selection
    setTimeout(() => setIsOpen(false), 150)
    onBlur?.()
  }

  const handleToggle = () => {
    if (!disabled) {
      setIsOpen(!isOpen)
      if (!isOpen) {
        handleFocus()
      }
    }
  }

  const handleOptionSelect = (optionValue: string) => {
    onChange(optionValue)
    setIsOpen(false)
    setSearchTerm('')
    setIsFocused(false)
  }

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value)
  }

  const selectVariants = {
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

  const dropdownVariants = {
    hidden: { 
      opacity: 0, 
      y: -10, 
      scale: 0.95,
      transition: { duration: 0.2 }
    },
    visible: { 
      opacity: 1, 
      y: 0, 
      scale: 1,
      transition: { duration: 0.2 }
    }
  }

  const optionVariants = {
    hidden: { opacity: 0, x: -10 },
    visible: (i: number) => ({
      opacity: 1,
      x: 0,
      transition: { delay: i * 0.05, duration: 0.2 }
    })
  }

  const getLabelState = () => {
    if (isFocused || isOpen) return 'focused'
    if (hasValue) return 'filled'
    return 'idle'
  }

  return (
    <motion.div 
      className={`relative mb-6 ${className}`}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      ref={selectRef}
    >
      {/* Select Container */}
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

        {/* Select Button */}
        <motion.div
          variants={selectVariants}
          animate={showError ? 'error' : isFocused || isOpen ? 'focused' : 'idle'}
          onClick={handleToggle}
          onFocus={handleFocus}
          onBlur={handleBlur}
          tabIndex={disabled ? -1 : 0}
          className={`
            w-full px-3 pt-6 pb-2 border-2 rounded-lg transition-all duration-200 cursor-pointer
            focus:outline-none disabled:bg-gray-50 disabled:text-gray-500 disabled:cursor-not-allowed
            ${showError 
              ? 'border-red-500 focus:border-red-500 focus:ring-4 focus:ring-red-100' 
              : showSuccess
                ? 'border-green-500 focus:border-green-500 focus:ring-4 focus:ring-green-100'
                : isFocused || isOpen
                  ? 'border-blue-500 focus:border-blue-500 focus:ring-4 focus:ring-blue-100'
                  : 'border-gray-300 hover:border-gray-400'
            }
            ${disabled ? 'bg-gray-50 cursor-not-allowed' : 'bg-white'}
          `}
        >
          <div className="flex items-center justify-between">
            <span className={`text-sm ${hasValue ? 'text-gray-900' : 'text-gray-500'}`}>
              {selectedOption ? selectedOption.label : placeholder}
            </span>
            
            <div className="flex items-center space-x-2">
              {/* Status Icons */}
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

              {/* Chevron */}
              <motion.div
                animate={{ rotate: isOpen ? 180 : 0 }}
                transition={{ duration: 0.2 }}
              >
                <ChevronDown className={`w-5 h-5 ${
                  showError ? 'text-red-500' : 
                  isFocused || isOpen ? 'text-blue-500' : 
                  'text-gray-400'
                }`} />
              </motion.div>
            </div>
          </div>
        </motion.div>

        {/* Focus Ring Animation */}
        <motion.div
          className="absolute inset-0 rounded-lg pointer-events-none"
          initial={false}
          animate={{
            boxShadow: isFocused || isOpen
              ? showError
                ? '0 0 0 4px rgba(239, 68, 68, 0.1)'
                : '0 0 0 4px rgba(59, 130, 246, 0.1)'
              : '0 0 0 0px transparent'
          }}
          transition={{ duration: 0.2 }}
        />
      </div>

      {/* Dropdown */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            variants={dropdownVariants}
            initial="hidden"
            animate="visible"
            exit="hidden"
            className="absolute top-full left-0 right-0 z-50 mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-hidden"
          >
            {/* Search Input */}
            {options.length > 5 && (
              <div className="p-3 border-b border-gray-200">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search options..."
                    value={searchTerm}
                    onChange={handleSearchChange}
                    className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>
            )}

            {/* Options List */}
            <div className="max-h-48 overflow-y-auto">
              {filteredOptions.length > 0 ? (
                filteredOptions.map((option, index) => (
                  <motion.div
                    key={option.value}
                    custom={index}
                    variants={optionVariants}
                    initial="hidden"
                    animate="visible"
                    onClick={() => handleOptionSelect(option.value)}
                    className={`
                      px-3 py-2 cursor-pointer transition-colors text-sm
                      ${option.value === value 
                        ? 'bg-blue-50 text-blue-700 font-medium' 
                        : 'text-gray-900 hover:bg-gray-50'
                      }
                    `}
                  >
                    <div className="flex items-center justify-between">
                      <span>{option.label}</span>
                      {option.value === value && (
                        <Check className="w-4 h-4 text-blue-600" />
                      )}
                    </div>
                  </motion.div>
                ))
              ) : (
                <div className="px-3 py-4 text-sm text-gray-500 text-center">
                  No options found
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

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
      {!showError && (isFocused || isOpen) && options.length > 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="mt-2 flex items-start"
        >
          <Info className="w-4 h-4 text-gray-400 mt-0.5 mr-2 flex-shrink-0" />
          <p className="text-sm text-gray-500">
            Choose from {options.length} available option{options.length !== 1 ? 's' : ''}
          </p>
        </motion.div>
      )}
    </motion.div>
  )
}

export default EnhancedSelect