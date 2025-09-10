import React, { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Wallet, AlertCircle, Check, Copy, ExternalLink, Info } from 'lucide-react'
import { AddressInputProps } from '../types'

const AddressInput: React.FC<AddressInputProps> = ({
  label,
  name,
  value,
  onChange,
  onBlur,
  error,
  required = false,
  disabled = false,
  className = '',
  placeholder = '0x...'
}) => {
  const [isFocused, setIsFocused] = useState(false)
  const [hasBeenFocused, setHasBeenFocused] = useState(false)
  const [copied, setCopied] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const hasValue = value && value.length > 0
  const showError = error && hasBeenFocused
  const isValidAddress = hasValue && /^0x[a-fA-F0-9]{40}$/.test(value)
  const showSuccess = isValidAddress && !error && hasBeenFocused && !isFocused

  // Format address for display (show first 6 and last 4 characters)
  const formatAddress = (address: string) => {
    if (!address || address.length < 10) return address
    if (isFocused || address.length !== 42) return address
    return `${address.slice(0, 6)}...${address.slice(-4)}`
  }

  const handleFocus = () => {
    setIsFocused(true)
    setHasBeenFocused(true)
  }

  const handleBlur = () => {
    setIsFocused(false)
    onBlur?.()
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value.trim()
    onChange(newValue)
  }

  const handleCopy = async () => {
    if (value && navigator.clipboard) {
      try {
        await navigator.clipboard.writeText(value)
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
      } catch (err) {
        console.error('Failed to copy address:', err)
      }
    }
  }

  const handlePaste = async () => {
    if (navigator.clipboard) {
      try {
        const text = await navigator.clipboard.readText()
        if (text.startsWith('0x') && text.length === 42) {
          onChange(text)
        }
      } catch (err) {
        console.error('Failed to paste from clipboard:', err)
      }
    }
  }

  const openEtherscan = () => {
    if (isValidAddress) {
      window.open(`https://etherscan.io/address/${value}`, '_blank')
    }
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
            absolute left-12 top-3 pointer-events-none font-medium text-sm origin-left z-10
            ${showError ? 'text-red-500' : ''}
          `}
        >
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </motion.label>

        {/* Wallet Icon */}
        <div className="absolute left-3 top-1/2 transform -translate-y-1/2 z-10">
          <Wallet className={`h-5 w-5 ${
            showError ? 'text-red-500' : 
            isFocused ? 'text-blue-500' : 
            isValidAddress ? 'text-green-500' :
            'text-gray-400'
          }`} />
        </div>

        {/* Input Field */}
        <motion.input
          ref={inputRef}
          id={name}
          name={name}
          type="text"
          placeholder={isFocused ? placeholder : ''}
          value={isFocused ? value : formatAddress(value)}
          onChange={handleChange}
          onFocus={handleFocus}
          onBlur={handleBlur}
          disabled={disabled}
          variants={inputVariants}
          animate={showError ? 'error' : isFocused ? 'focused' : 'idle'}
          className={`
            w-full pl-12 pr-24 pt-6 pb-2 border-2 rounded-lg transition-all duration-200
            focus:outline-none disabled:bg-gray-50 disabled:text-gray-500 font-mono text-sm
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

        {/* Action Buttons */}
        <div className="absolute right-3 top-1/2 transform -translate-y-1/2 flex items-center space-x-1">
          {/* Paste Button */}
          {!hasValue && isFocused && (
            <motion.button
              type="button"
              onClick={handlePaste}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              className="p-1 text-gray-400 hover:text-blue-500 transition-colors"
              title="Paste from clipboard"
            >
              <Copy className="w-4 h-4" />
            </motion.button>
          )}

          {/* Copy Button */}
          {isValidAddress && !isFocused && (
            <motion.button
              type="button"
              onClick={handleCopy}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              className="p-1 text-gray-400 hover:text-blue-500 transition-colors"
              title={copied ? "Copied!" : "Copy address"}
            >
              <Copy className={`w-4 h-4 ${copied ? 'text-green-500' : ''}`} />
            </motion.button>
          )}

          {/* Etherscan Link */}
          {isValidAddress && !isFocused && (
            <motion.button
              type="button"
              onClick={openEtherscan}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              className="p-1 text-gray-400 hover:text-blue-500 transition-colors"
              title="View on Etherscan"
            >
              <ExternalLink className="w-4 h-4" />
            </motion.button>
          )}

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

      {/* Address Information */}
      {isValidAddress && !showError && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          className="mt-3 p-3 bg-green-50 rounded-lg border border-green-200"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <Check className="w-4 h-4 text-green-600 mr-2" />
              <span className="text-sm font-medium text-green-800">Valid Ethereum Address</span>
            </div>
            <div className="text-xs text-green-600">
              Checksum: {value === value.toLowerCase() ? 'No' : 'Yes'}
            </div>
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
            Enter a valid Ethereum address (42 characters starting with 0x)
          </p>
        </motion.div>
      )}
    </motion.div>
  )
}

export default AddressInput