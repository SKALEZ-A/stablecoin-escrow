import React from 'react'
import { motion } from 'framer-motion'
import { Check, Circle } from 'lucide-react'
import { ProgressIndicatorProps } from './types'

const ProgressIndicator: React.FC<ProgressIndicatorProps> = ({
  currentStep,
  totalSteps,
  stepLabels = [],
  className = ''
}) => {
  const steps = Array.from({ length: totalSteps }, (_, index) => index + 1)

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  }

  const stepVariants = {
    hidden: { opacity: 0, scale: 0.8 },
    visible: { opacity: 1, scale: 1 }
  }

  const lineVariants = {
    incomplete: { scaleX: 0 },
    complete: { scaleX: 1 }
  }

  return (
    <div className={`w-full ${className}`}>
      <motion.div 
        className="flex items-center justify-between"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {steps.map((step, index) => {
          const isCompleted = step < currentStep
          const isCurrent = step === currentStep
          const stepLabel = stepLabels[index] || `Step ${step}`

          return (
            <div key={step} className="flex items-center flex-1">
              {/* Step Circle */}
              <motion.div 
                className="flex flex-col items-center"
                variants={stepVariants}
              >
                <motion.div
                  className={`
                    w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium 
                    transition-all duration-300 relative overflow-hidden
                    ${isCompleted 
                      ? 'bg-green-600 text-white shadow-lg' 
                      : isCurrent 
                        ? 'bg-blue-600 text-white shadow-lg ring-4 ring-blue-100' 
                        : 'bg-gray-200 text-gray-600'
                    }
                  `}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  {/* Animated Background for Current Step */}
                  {isCurrent && (
                    <motion.div
                      className="absolute inset-0 bg-blue-700 rounded-full"
                      initial={{ scale: 0 }}
                      animate={{ scale: [0, 1.2, 1] }}
                      transition={{ duration: 0.6, repeat: Infinity, repeatDelay: 2 }}
                    />
                  )}
                  
                  <div className="relative z-10">
                    {isCompleted ? (
                      <motion.div
                        initial={{ scale: 0, rotate: -180 }}
                        animate={{ scale: 1, rotate: 0 }}
                        transition={{ duration: 0.3 }}
                      >
                        <Check className="w-5 h-5" />
                      </motion.div>
                    ) : isCurrent ? (
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                      >
                        <Circle className="w-5 h-5 fill-current" />
                      </motion.div>
                    ) : (
                      <span className="font-semibold">{step}</span>
                    )}
                  </div>
                </motion.div>
                
                {/* Step Label */}
                <motion.span
                  className={`
                    mt-3 text-xs font-medium text-center max-w-24 leading-tight
                    transition-colors duration-300
                    ${isCurrent 
                      ? 'text-blue-600 font-semibold' 
                      : isCompleted 
                        ? 'text-green-600' 
                        : 'text-gray-500'
                    }
                  `}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 + 0.2 }}
                >
                  {stepLabel}
                </motion.span>
              </motion.div>

              {/* Connector Line */}
              {index < steps.length - 1 && (
                <div className="flex-1 mx-4 relative">
                  {/* Background Line */}
                  <div className="h-0.5 bg-gray-200 rounded-full" />
                  
                  {/* Progress Line */}
                  <motion.div
                    className={`
                      absolute top-0 left-0 h-0.5 rounded-full origin-left
                      ${step < currentStep ? 'bg-green-600' : 'bg-blue-600'}
                    `}
                    variants={lineVariants}
                    initial="incomplete"
                    animate={step < currentStep ? "complete" : "incomplete"}
                    transition={{ duration: 0.5, delay: index * 0.1 }}
                  />
                  
                  {/* Animated Dots for Current Progress */}
                  {step === currentStep && (
                    <motion.div
                      className="absolute top-0 left-0 w-2 h-0.5 bg-blue-400 rounded-full"
                      animate={{ x: [0, 100, 0] }}
                      transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                    />
                  )}
                </div>
              )}
            </div>
          )
        })}
      </motion.div>

      {/* Overall Progress Bar */}
      <div className="mt-6 w-full bg-gray-200 rounded-full h-2 overflow-hidden">
        <motion.div
          className="h-full bg-gradient-to-r from-blue-500 to-green-500 rounded-full"
          initial={{ width: 0 }}
          animate={{ width: `${(currentStep / totalSteps) * 100}%` }}
          transition={{ duration: 0.5, ease: "easeOut" }}
        />
      </div>

      {/* Step Counter */}
      <div className="mt-3 text-center">
        <span className="text-sm text-gray-600">
          Step {currentStep} of {totalSteps}
        </span>
      </div>
    </div>
  )
}

export default ProgressIndicator