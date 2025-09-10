import React, { useEffect, useRef } from 'react'
import { motion, AnimatePresence, useAnimation } from 'framer-motion'
import { ChevronLeft, ChevronRight, Loader2, Check, AlertCircle } from 'lucide-react'
import { FormStepProps } from './types'

const FormStep: React.FC<FormStepProps> = ({
  title,
  description,
  children,
  isActive,
  isCompleted,
  onNext,
  onPrevious,
  canProceed,
  isLoading = false,
  stepNumber,
  totalSteps,
  validationErrors = [],
  onValidationError
}) => {
  const controls = useAnimation()
  const contentRef = useRef<HTMLDivElement>(null)

  // Enhanced animation variants
  const stepVariants = {
    enter: (direction: number) => ({
      x: direction > 0 ? 300 : -300,
      opacity: 0,
      scale: 0.95
    }),
    center: {
      x: 0,
      opacity: 1,
      scale: 1,
      transition: {
        duration: 0.4,
        ease: [0.25, 0.46, 0.45, 0.94] as any
      }
    },
    exit: (direction: number) => ({
      x: direction < 0 ? 300 : -300,
      opacity: 0,
      scale: 0.95,
      transition: {
        duration: 0.3,
        ease: [0.25, 0.46, 0.45, 0.94] as any
      }
    })
  }

  const contentVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.3,
        delay: 0.1,
        staggerChildren: 0.1
      }
    }
  }

  const buttonVariants = {
    idle: { scale: 1 },
    hover: { scale: 1.02 },
    tap: { scale: 0.98 },
    disabled: { scale: 1, opacity: 0.5 }
  }

  // Auto-focus first input when step becomes active
  useEffect(() => {
    if (isActive && contentRef.current) {
      const firstInput = contentRef.current.querySelector('input, textarea, select') as HTMLElement
      if (firstInput) {
        setTimeout(() => firstInput.focus(), 100)
      }
    }
  }, [isActive])

  // Initialize animation when step becomes active
  useEffect(() => {
    if (isActive) {
      controls.start("center")
    }
  }, [isActive, controls])

  // Shake animation for validation errors
  const shakeOnError = async () => {
    await controls.start({
      x: [-10, 10, -10, 10, 0],
      transition: { duration: 0.4 }
    })
  }

  // Handle next button click with validation feedback
  const handleNext = async () => {
    if (!canProceed) {
      await shakeOnError()
      onValidationError?.()
      return
    }
    onNext?.()
  }

  return (
    <AnimatePresence mode="wait" custom={1}>
      {isActive && (
        <motion.div
          key="form-step"
          custom={1}
          variants={stepVariants}
          initial="enter"
          animate={controls}
          exit="exit"
          className="w-full max-w-2xl mx-auto"
        >
          {/* Step Header with Status Indicator */}
          <motion.div 
            className="mb-8"
            variants={contentVariants}
            initial="hidden"
            animate="visible"
          >
            <div className="flex items-center mb-4">
              <div className={`
                flex items-center justify-center w-8 h-8 rounded-full mr-3 transition-colors
                ${isCompleted 
                  ? 'bg-green-100 text-green-600' 
                  : isActive 
                    ? 'bg-blue-100 text-blue-600' 
                    : 'bg-gray-100 text-gray-400'
                }
              `}>
                {isCompleted ? (
                  <Check className="w-4 h-4" />
                ) : isLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <span className="text-sm font-medium">
                    {stepNumber || '?'}
                  </span>
                )}
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-1">{title}</h2>
                {description && (
                  <p className="text-gray-600 text-sm">{description}</p>
                )}
              </div>
            </div>
          </motion.div>

          {/* Step Content with Staggered Animation */}
          <motion.div 
            ref={contentRef}
            className="mb-8"
            variants={contentVariants}
            initial="hidden"
            animate="visible"
          >
            <motion.div
              className="space-y-6"
              variants={{
                visible: {
                  transition: {
                    staggerChildren: 0.1
                  }
                }
              }}
            >
              {children}
            </motion.div>
          </motion.div>

          {/* Validation Errors Display */}
          {validationErrors.length > 0 && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg"
            >
              <div className="flex items-start">
                <AlertCircle className="w-5 h-5 text-red-500 mt-0.5 mr-3 flex-shrink-0" />
                <div>
                  <h4 className="text-sm font-medium text-red-800 mb-2">
                    Please fix the following errors:
                  </h4>
                  <ul className="text-sm text-red-700 space-y-1">
                    {validationErrors.map((error, index) => (
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

          {/* Enhanced Step Navigation */}
          <motion.div 
            className="flex justify-between items-center pt-6 border-t border-gray-200"
            variants={contentVariants}
            initial="hidden"
            animate="visible"
          >
            <div>
              {onPrevious && (
                <motion.button
                  type="button"
                  onClick={onPrevious}
                  disabled={isLoading}
                  variants={buttonVariants}
                  initial="idle"
                  whileHover={!isLoading ? "hover" : "disabled"}
                  whileTap={!isLoading ? "tap" : "disabled"}
                  className={`
                    flex items-center px-4 py-2 rounded-lg transition-all duration-200
                    ${isLoading 
                      ? 'text-gray-400 cursor-not-allowed' 
                      : 'text-gray-600 hover:text-gray-800 hover:bg-gray-50'
                    }
                  `}
                >
                  <ChevronLeft className="w-4 h-4 mr-1" />
                  Previous
                </motion.button>
              )}
            </div>

            <div className="flex items-center space-x-3">
              {/* Validation Status Indicator */}
              {!canProceed && !isLoading && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="flex items-center text-amber-600 text-sm"
                >
                  <AlertCircle className="w-4 h-4 mr-1" />
                  {validationErrors.length > 0 
                    ? `${validationErrors.length} error${validationErrors.length > 1 ? 's' : ''} found`
                    : 'Please complete all required fields'
                  }
                </motion.div>
              )}

              {onNext && (
                <motion.button
                  type="button"
                  onClick={handleNext}
                  disabled={isLoading}
                  variants={buttonVariants}
                  initial="idle"
                  whileHover={!isLoading && canProceed ? "hover" : "disabled"}
                  whileTap={!isLoading && canProceed ? "tap" : "disabled"}
                  className={`
                    flex items-center px-6 py-2 rounded-lg font-medium transition-all duration-200
                    ${isLoading
                      ? 'bg-blue-400 text-white cursor-not-allowed'
                      : canProceed
                        ? 'bg-blue-600 text-white hover:bg-blue-700 shadow-lg hover:shadow-xl'
                        : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    }
                  `}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      Next
                      <ChevronRight className="w-4 h-4 ml-1" />
                    </>
                  )}
                </motion.button>
              )}
            </div>
          </motion.div>

          {/* Progress Bar at Bottom */}
          {totalSteps && stepNumber && (
            <motion.div
              className="mt-6"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              <div className="flex justify-between text-xs text-gray-500 mb-2">
                <span>Step {stepNumber} of {totalSteps}</span>
                <span>{Math.round((stepNumber / totalSteps) * 100)}% Complete</span>
              </div>
              <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                <motion.div
                  className={`h-full rounded-full ${
                    isCompleted 
                      ? 'bg-green-600' 
                      : canProceed 
                        ? 'bg-blue-600' 
                        : 'bg-amber-500'
                  }`}
                  initial={{ width: 0 }}
                  animate={{ 
                    width: isCompleted 
                      ? '100%' 
                      : `${(stepNumber / totalSteps) * 100}%`
                  }}
                  transition={{ duration: 0.5, ease: "easeOut" }}
                />
              </div>
            </motion.div>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  )
}

export default FormStep