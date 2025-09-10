import React, { useState, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Upload, X, Image as ImageIcon, AlertCircle, Check, FileImage, Loader2 } from 'lucide-react'
import { ImageUploadProps } from '../types'

const ImageUpload: React.FC<ImageUploadProps> = ({
  label,
  name,
  files,
  onChange,
  error,
  required = false,
  disabled = false,
  className = '',
  maxFiles = 5,
  maxSize = 5 * 1024 * 1024, // 5MB
  acceptedTypes = ['image/jpeg', 'image/png', 'image/webp']
}) => {
  const [isDragOver, setIsDragOver] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [uploadErrors, setUploadErrors] = useState<string[]>([])
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Format file size
  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  // Validate file
  const validateFile = (file: File): string | null => {
    if (!acceptedTypes.includes(file.type)) {
      return `File type ${file.type} is not supported. Please use ${acceptedTypes.join(', ')}`
    }
    if (file.size > maxSize) {
      return `File size ${formatFileSize(file.size)} exceeds maximum size of ${formatFileSize(maxSize)}`
    }
    return null
  }

  // Process files
  const processFiles = useCallback(async (fileList: FileList | File[]) => {
    setIsUploading(true)
    setUploadErrors([])

    const newFiles: File[] = []
    const errors: string[] = []

    const filesToProcess = Array.from(fileList)

    // Check total file count
    if (files.length + filesToProcess.length > maxFiles) {
      errors.push(`Cannot upload more than ${maxFiles} files. Currently have ${files.length} files.`)
      setUploadErrors(errors)
      setIsUploading(false)
      return
    }

    // Validate each file
    for (const file of filesToProcess) {
      const error = validateFile(file)
      if (error) {
        errors.push(`${file.name}: ${error}`)
      } else {
        // Check for duplicates
        const isDuplicate = files.some(existingFile => 
          existingFile.name === file.name && existingFile.size === file.size
        )
        if (isDuplicate) {
          errors.push(`${file.name}: File already uploaded`)
        } else {
          newFiles.push(file)
        }
      }
    }

    // Simulate upload delay for better UX
    await new Promise(resolve => setTimeout(resolve, 500))

    if (newFiles.length > 0) {
      onChange([...files, ...newFiles])
    }

    if (errors.length > 0) {
      setUploadErrors(errors)
    }

    setIsUploading(false)
  }, [files, onChange, maxFiles, maxSize, acceptedTypes])

  // Handle file input change
  const handleFileChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const fileList = event.target.files
    if (fileList && fileList.length > 0) {
      processFiles(fileList)
    }
    // Reset input value to allow re-uploading the same file
    event.target.value = ''
  }, [processFiles])

  // Handle drag events
  const handleDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault()
    event.stopPropagation()
    if (!disabled) {
      setIsDragOver(true)
    }
  }, [disabled])

  const handleDragLeave = useCallback((event: React.DragEvent) => {
    event.preventDefault()
    event.stopPropagation()
    setIsDragOver(false)
  }, [])

  const handleDrop = useCallback((event: React.DragEvent) => {
    event.preventDefault()
    event.stopPropagation()
    setIsDragOver(false)

    if (disabled) return

    const droppedFiles = event.dataTransfer.files
    if (droppedFiles.length > 0) {
      processFiles(droppedFiles)
    }
  }, [disabled, processFiles])

  // Handle click to open file dialog
  const handleClick = useCallback(() => {
    if (!disabled && fileInputRef.current) {
      fileInputRef.current.click()
    }
  }, [disabled])

  // Remove file
  const removeFile = useCallback((index: number) => {
    const newFiles = files.filter((_, i) => i !== index)
    onChange(newFiles)
    setUploadErrors([]) // Clear errors when removing files
  }, [files, onChange])

  // Clear all files
  const clearAllFiles = useCallback(() => {
    onChange([])
    setUploadErrors([])
  }, [onChange])

  return (
    <motion.div 
      className={`mb-6 ${className}`}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <div className="flex items-center justify-between mb-2">
        <label className="block text-sm font-medium text-gray-700">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
        {files.length > 0 && (
          <button
            type="button"
            onClick={clearAllFiles}
            className="text-xs text-gray-500 hover:text-red-600 transition-colors"
          >
            Clear all
          </button>
        )}
      </div>

      {/* Upload Area */}
      <motion.div
        className={`
          relative border-2 border-dashed rounded-lg p-6 text-center transition-all duration-200
          ${isDragOver 
            ? 'border-blue-400 bg-blue-50' 
            : error 
              ? 'border-red-300 bg-red-50' 
              : 'border-gray-300 bg-white hover:border-gray-400 hover:bg-gray-50'
          }
          ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
        `}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={handleClick}
        whileHover={!disabled ? { scale: 1.01 } : {}}
        whileTap={!disabled ? { scale: 0.99 } : {}}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept={acceptedTypes.join(',')}
          onChange={handleFileChange}
          className="hidden"
          disabled={disabled}
        />

        <AnimatePresence mode="wait">
          {isUploading ? (
            <motion.div
              key="uploading"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              className="flex flex-col items-center"
            >
              <Loader2 className="w-12 h-12 text-blue-500 animate-spin mb-3" />
              <p className="text-sm text-blue-600 font-medium">Processing files...</p>
            </motion.div>
          ) : isDragOver ? (
            <motion.div
              key="dragover"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              className="flex flex-col items-center"
            >
              <Upload className="w-12 h-12 text-blue-500 mb-3" />
              <p className="text-sm text-blue-600 font-medium">Drop files here</p>
            </motion.div>
          ) : (
            <motion.div
              key="default"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              className="flex flex-col items-center"
            >
              <FileImage className="w-12 h-12 text-gray-400 mb-3" />
              <p className="text-sm text-gray-600 mb-1">
                Click to upload or drag and drop
              </p>
              <p className="text-xs text-gray-500">
                {acceptedTypes.map(type => type.split('/')[1].toUpperCase()).join(', ')} up to {formatFileSize(maxSize)}
              </p>
              <p className="text-xs text-gray-400 mt-1">
                Maximum {maxFiles} files
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* File Preview Grid */}
      <AnimatePresence>
        {files.length > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
            className="mt-4"
          >
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-sm font-medium text-gray-700">
                Uploaded Files ({files.length}/{maxFiles})
              </h4>
              <div className="text-xs text-gray-500">
                Total: {formatFileSize(files.reduce((sum, file) => sum + file.size, 0))}
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
              {files.map((file, index) => (
                <motion.div
                  key={`${file.name}-${index}`}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  transition={{ duration: 0.2, delay: index * 0.05 }}
                  className="relative group"
                >
                  <div className="aspect-square bg-gray-100 rounded-lg overflow-hidden border-2 border-transparent group-hover:border-blue-200 transition-colors">
                    <img
                      src={URL.createObjectURL(file)}
                      alt={file.name}
                      className="w-full h-full object-cover"
                      onLoad={() => URL.revokeObjectURL(URL.createObjectURL(file))}
                    />
                    
                    {/* Overlay */}
                    <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all duration-200 flex items-center justify-center">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation()
                          removeFile(index)
                        }}
                        className="opacity-0 group-hover:opacity-100 bg-red-500 text-white rounded-full p-2 hover:bg-red-600 transition-all duration-200 transform scale-90 hover:scale-100"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                  
                  {/* File Info */}
                  <div className="mt-2 px-1">
                    <p className="text-xs font-medium text-gray-700 truncate" title={file.name}>
                      {file.name}
                    </p>
                    <p className="text-xs text-gray-500">
                      {formatFileSize(file.size)}
                    </p>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Upload Errors */}
      <AnimatePresence>
        {uploadErrors.length > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg"
          >
            <div className="flex items-start">
              <AlertCircle className="w-4 h-4 text-red-500 mt-0.5 mr-2 flex-shrink-0" />
              <div>
                <h4 className="text-sm font-medium text-red-800 mb-1">Upload Errors</h4>
                <ul className="text-sm text-red-700 space-y-1">
                  {uploadErrors.map((error, index) => (
                    <li key={index} className="flex items-start">
                      <span className="w-1 h-1 bg-red-500 rounded-full mt-2 mr-2 flex-shrink-0" />
                      {error}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* General Error */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="mt-2 flex items-start"
          >
            <AlertCircle className="w-4 h-4 text-red-500 mt-0.5 mr-2 flex-shrink-0" />
            <p className="text-sm text-red-600">{error}</p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Success State */}
      {files.length > 0 && !error && uploadErrors.length === 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="mt-2 flex items-center text-green-600"
        >
          <Check className="w-4 h-4 mr-2" />
          <p className="text-sm">
            {files.length} file{files.length !== 1 ? 's' : ''} uploaded successfully
          </p>
        </motion.div>
      )}
    </motion.div>
  )
}

export default ImageUpload