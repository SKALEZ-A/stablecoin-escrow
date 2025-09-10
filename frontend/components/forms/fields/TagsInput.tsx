import React, { useState, useRef, useCallback, KeyboardEvent } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Plus, Tag, AlertCircle, Info } from 'lucide-react'

export interface TagsInputProps {
  label: string
  name: string
  tags: string[]
  onChange: (tags: string[]) => void
  onBlur?: () => void
  error?: string
  required?: boolean
  disabled?: boolean
  className?: string
  maxTags?: number
  maxTagLength?: number
  placeholder?: string
  suggestions?: string[]
}

const TagsInput: React.FC<TagsInputProps> = ({
  label,
  name,
  tags,
  onChange,
  onBlur,
  error,
  required = false,
  disabled = false,
  className = '',
  maxTags = 10,
  maxTagLength = 30,
  placeholder = 'Type and press Enter to add tags',
  suggestions = []
}) => {
  const [inputValue, setInputValue] = useState('')
  const [isFocused, setIsFocused] = useState(false)
  const [showSuggestions, setShowSuggestions] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  // Filter suggestions based on input and existing tags
  const filteredSuggestions = suggestions.filter(suggestion =>
    suggestion.toLowerCase().includes(inputValue.toLowerCase()) &&
    !tags.includes(suggestion) &&
    inputValue.length > 0
  ).slice(0, 5)

  // Validate tag
  const validateTag = (tag: string): string | null => {
    const trimmedTag = tag.trim()
    
    if (!trimmedTag) return 'Tag cannot be empty'
    if (trimmedTag.length > maxTagLength) return `Tag must be less than ${maxTagLength} characters`
    if (tags.includes(trimmedTag)) return 'Tag already exists'
    if (tags.length >= maxTags) return `Maximum ${maxTags} tags allowed`
    if (!/^[a-zA-Z0-9\s-_]+$/.test(trimmedTag)) return 'Tag can only contain letters, numbers, spaces, hyphens, and underscores'
    
    return null
  }

  // Add tag
  const addTag = useCallback((tag: string) => {
    const error = validateTag(tag)
    if (!error) {
      onChange([...tags, tag.trim()])
      setInputValue('')
      setShowSuggestions(false)
    }
  }, [tags, onChange, maxTags, maxTagLength])

  // Remove tag
  const removeTag = useCallback((index: number) => {
    const newTags = tags.filter((_, i) => i !== index)
    onChange(newTags)
  }, [tags, onChange])

  // Handle input change
  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setInputValue(value)
    setShowSuggestions(value.length > 0 && filteredSuggestions.length > 0)
  }, [filteredSuggestions.length])

  // Handle key press
  const handleKeyPress = useCallback((e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      if (inputValue.trim()) {
        addTag(inputValue)
      }
    } else if (e.key === 'Backspace' && !inputValue && tags.length > 0) {
      // Remove last tag when backspace is pressed on empty input
      removeTag(tags.length - 1)
    } else if (e.key === 'Escape') {
      setInputValue('')
      setShowSuggestions(false)
      inputRef.current?.blur()
    }
  }, [inputValue, tags, addTag, removeTag])

  // Handle focus
  const handleFocus = useCallback(() => {
    setIsFocused(true)
    if (inputValue.length > 0 && filteredSuggestions.length > 0) {
      setShowSuggestions(true)
    }
  }, [inputValue, filteredSuggestions.length])

  // Handle blur
  const handleBlur = useCallback(() => {
    setIsFocused(false)
    // Delay hiding suggestions to allow clicking on them
    setTimeout(() => {
      setShowSuggestions(false)
      if (inputValue.trim()) {
        addTag(inputValue)
      }
    }, 150)
    onBlur?.()
  }, [inputValue, addTag, onBlur])

  // Handle suggestion click
  const handleSuggestionClick = useCallback((suggestion: string) => {
    addTag(suggestion)
    inputRef.current?.focus()
  }, [addTag])

  const currentError = validateTag(inputValue)
  const showError = error || (inputValue && currentError)

  return (
    <motion.div 
      className={`mb-6 ${className}`}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <label className="block text-sm font-medium text-gray-700 mb-2">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
        <span className="text-gray-500 text-xs ml-2">
          ({tags.length}/{maxTags})
        </span>
      </label>

      {/* Tags Container */}
      <div className={`
        relative min-h-[2.5rem] p-2 border-2 rounded-lg transition-all duration-200
        ${showError 
          ? 'border-red-500 focus-within:border-red-500 focus-within:ring-4 focus-within:ring-red-100' 
          : isFocused
            ? 'border-blue-500 focus-within:border-blue-500 focus-within:ring-4 focus-within:ring-blue-100'
            : 'border-gray-300 hover:border-gray-400'
        }
        ${disabled ? 'bg-gray-50 cursor-not-allowed' : 'bg-white'}
      `}>
        <div className="flex flex-wrap gap-2 items-center">
          {/* Existing Tags */}
          <AnimatePresence>
            {tags.map((tag, index) => (
              <motion.div
                key={`${tag}-${index}`}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                transition={{ duration: 0.2 }}
                className="flex items-center bg-blue-100 text-blue-800 px-2 py-1 rounded-md text-sm font-medium"
              >
                <Tag className="w-3 h-3 mr-1" />
                <span>{tag}</span>
                {!disabled && (
                  <button
                    type="button"
                    onClick={() => removeTag(index)}
                    className="ml-1 p-0.5 hover:bg-blue-200 rounded-full transition-colors"
                  >
                    <X className="w-3 h-3" />
                  </button>
                )}
              </motion.div>
            ))}
          </AnimatePresence>

          {/* Input Field */}
          <div className="flex-1 min-w-[120px] relative">
            <input
              ref={inputRef}
              type="text"
              value={inputValue}
              onChange={handleInputChange}
              onKeyDown={handleKeyPress}
              onFocus={handleFocus}
              onBlur={handleBlur}
              placeholder={tags.length === 0 ? placeholder : ''}
              disabled={disabled || tags.length >= maxTags}
              className="w-full border-none outline-none bg-transparent text-sm placeholder-gray-400 disabled:cursor-not-allowed"
            />

            {/* Suggestions Dropdown */}
            <AnimatePresence>
              {showSuggestions && filteredSuggestions.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.2 }}
                  className="absolute top-full left-0 right-0 z-50 mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-40 overflow-y-auto"
                >
                  {filteredSuggestions.map((suggestion, index) => (
                    <button
                      key={suggestion}
                      type="button"
                      onClick={() => handleSuggestionClick(suggestion)}
                      className="w-full px-3 py-2 text-left text-sm hover:bg-gray-50 transition-colors first:rounded-t-lg last:rounded-b-lg"
                    >
                      <div className="flex items-center">
                        <Tag className="w-3 h-3 mr-2 text-gray-400" />
                        {suggestion}
                      </div>
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Add Button */}
          {inputValue && !currentError && (
            <motion.button
              type="button"
              onClick={() => addTag(inputValue)}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              className="p-1 text-blue-600 hover:bg-blue-50 rounded-full transition-colors"
            >
              <Plus className="w-4 h-4" />
            </motion.button>
          )}
        </div>
      </div>

      {/* Error Message */}
      <AnimatePresence>
        {showError && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="mt-2 flex items-start"
          >
            <AlertCircle className="w-4 h-4 text-red-500 mt-0.5 mr-2 flex-shrink-0" />
            <p className="text-sm text-red-600">{error || currentError}</p>
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
            Press Enter to add tags. Use letters, numbers, spaces, hyphens, and underscores only.
          </p>
        </motion.div>
      )}

      {/* Popular Tags Suggestions */}
      {!isFocused && tags.length === 0 && suggestions.length > 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="mt-3"
        >
          <p className="text-xs text-gray-500 mb-2">Popular tags:</p>
          <div className="flex flex-wrap gap-2">
            {suggestions.slice(0, 8).map((suggestion) => (
              <button
                key={suggestion}
                type="button"
                onClick={() => addTag(suggestion)}
                disabled={disabled || tags.length >= maxTags}
                className="px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {suggestion}
              </button>
            ))}
          </div>
        </motion.div>
      )}
    </motion.div>
  )
}

export default TagsInput