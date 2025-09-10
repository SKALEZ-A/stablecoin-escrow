import React from 'react'
import { motion } from 'framer-motion'
import { Loader2, Circle, Square, Triangle } from 'lucide-react'
import { loadingSpinner, loadingPulse, loadingDots } from './animations'

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg'
  color?: 'blue' | 'green' | 'red' | 'yellow' | 'purple' | 'gray'
  className?: string
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  size = 'md',
  color = 'blue',
  className = ''
}) => {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8'
  }

  const colorClasses = {
    blue: 'text-blue-600',
    green: 'text-green-600',
    red: 'text-red-600',
    yellow: 'text-yellow-600',
    purple: 'text-purple-600',
    gray: 'text-gray-600'
  }

  return (
    <motion.div
      variants={loadingSpinner}
      animate="animate"
      className={`${sizeClasses[size]} ${colorClasses[color]} ${className}`}
    >
      <Loader2 className="w-full h-full" />
    </motion.div>
  )
}

interface LoadingDotsProps {
  size?: 'sm' | 'md' | 'lg'
  color?: 'blue' | 'green' | 'red' | 'yellow' | 'purple' | 'gray'
  count?: number
  className?: string
}

export const LoadingDots: React.FC<LoadingDotsProps> = ({
  size = 'md',
  color = 'blue',
  count = 3,
  className = ''
}) => {
  const sizeClasses = {
    sm: 'w-1 h-1',
    md: 'w-2 h-2',
    lg: 'w-3 h-3'
  }

  const colorClasses = {
    blue: 'bg-blue-600',
    green: 'bg-green-600',
    red: 'bg-red-600',
    yellow: 'bg-yellow-600',
    purple: 'bg-purple-600',
    gray: 'bg-gray-600'
  }

  const dots = Array.from({ length: count }, (_, i) => i)

  return (
    <div className={`flex space-x-1 ${className}`}>
      {dots.map((_, index) => (
        <motion.div
          key={index}
          className={`${sizeClasses[size]} ${colorClasses[color]} rounded-full`}
          variants={loadingDots}
          animate="animate"
          transition={{
            delay: index * 0.2,
            repeat: Infinity,
            repeatType: 'reverse'
          }}
        />
      ))}
    </div>
  )
}

interface LoadingPulseProps {
  size?: 'sm' | 'md' | 'lg'
  color?: 'blue' | 'green' | 'red' | 'yellow' | 'purple' | 'gray'
  className?: string
}

export const LoadingPulse: React.FC<LoadingPulseProps> = ({
  size = 'md',
  color = 'blue',
  className = ''
}) => {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8'
  }

  const colorClasses = {
    blue: 'bg-blue-600',
    green: 'bg-green-600',
    red: 'bg-red-600',
    yellow: 'bg-yellow-600',
    purple: 'bg-purple-600',
    gray: 'bg-gray-600'
  }

  return (
    <motion.div
      className={`${sizeClasses[size]} ${colorClasses[color]} rounded-full ${className}`}
      variants={loadingPulse}
      animate="animate"
    />
  )
}

interface LoadingWaveProps {
  size?: 'sm' | 'md' | 'lg'
  color?: 'blue' | 'green' | 'red' | 'yellow' | 'purple' | 'gray'
  bars?: number
  className?: string
}

export const LoadingWave: React.FC<LoadingWaveProps> = ({
  size = 'md',
  color = 'blue',
  bars = 5,
  className = ''
}) => {
  const sizeClasses = {
    sm: { width: 'w-0.5', height: 'h-4' },
    md: { width: 'w-1', height: 'h-6' },
    lg: { width: 'w-1.5', height: 'h-8' }
  }

  const colorClasses = {
    blue: 'bg-blue-600',
    green: 'bg-green-600',
    red: 'bg-red-600',
    yellow: 'bg-yellow-600',
    purple: 'bg-purple-600',
    gray: 'bg-gray-600'
  }

  const barElements = Array.from({ length: bars }, (_, i) => i)

  return (
    <div className={`flex items-end space-x-0.5 ${className}`}>
      {barElements.map((_, index) => (
        <motion.div
          key={index}
          className={`${sizeClasses[size].width} ${sizeClasses[size].height} ${colorClasses[color]} rounded-sm`}
          animate={{
            scaleY: [1, 0.3, 1],
            transition: {
              duration: 0.8,
              repeat: Infinity,
              delay: index * 0.1
            }
          }}
        />
      ))}
    </div>
  )
}

interface LoadingSkeletonProps {
  lines?: number
  className?: string
}

export const LoadingSkeleton: React.FC<LoadingSkeletonProps> = ({
  lines = 3,
  className = ''
}) => {
  const lineElements = Array.from({ length: lines }, (_, i) => i)

  return (
    <div className={`space-y-3 ${className}`}>
      {lineElements.map((_, index) => (
        <motion.div
          key={index}
          className="h-4 bg-gray-200 rounded"
          style={{ width: `${100 - (index * 10)}%` }}
          animate={{
            opacity: [0.5, 1, 0.5],
            transition: {
              duration: 1.5,
              repeat: Infinity,
              delay: index * 0.2
            }
          }}
        />
      ))}
    </div>
  )
}

interface LoadingProgressProps {
  progress: number
  size?: 'sm' | 'md' | 'lg'
  color?: 'blue' | 'green' | 'red' | 'yellow' | 'purple' | 'gray'
  showPercentage?: boolean
  className?: string
}

export const LoadingProgress: React.FC<LoadingProgressProps> = ({
  progress,
  size = 'md',
  color = 'blue',
  showPercentage = true,
  className = ''
}) => {
  const sizeClasses = {
    sm: 'h-1',
    md: 'h-2',
    lg: 'h-3'
  }

  const colorClasses = {
    blue: 'bg-blue-600',
    green: 'bg-green-600',
    red: 'bg-red-600',
    yellow: 'bg-yellow-600',
    purple: 'bg-purple-600',
    gray: 'bg-gray-600'
  }

  return (
    <div className={className}>
      <div className={`w-full bg-gray-200 rounded-full ${sizeClasses[size]} overflow-hidden`}>
        <motion.div
          className={`${sizeClasses[size]} ${colorClasses[color]} rounded-full`}
          initial={{ width: 0 }}
          animate={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
        />
      </div>
      {showPercentage && (
        <motion.div
          className="text-sm text-gray-600 mt-1 text-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          {Math.round(progress)}%
        </motion.div>
      )}
    </div>
  )
}

interface LoadingSpinnerWithTextProps {
  text: string
  size?: 'sm' | 'md' | 'lg'
  color?: 'blue' | 'green' | 'red' | 'yellow' | 'purple' | 'gray'
  className?: string
}

export const LoadingSpinnerWithText: React.FC<LoadingSpinnerWithTextProps> = ({
  text,
  size = 'md',
  color = 'blue',
  className = ''
}) => {
  return (
    <div className={`flex items-center space-x-3 ${className}`}>
      <LoadingSpinner size={size} color={color} />
      <motion.span
        className="text-gray-600"
        variants={loadingPulse}
        animate="animate"
      >
        {text}
      </motion.span>
    </div>
  )
}

interface LoadingOverlayProps {
  isVisible: boolean
  text?: string
  size?: 'sm' | 'md' | 'lg'
  color?: 'blue' | 'green' | 'red' | 'yellow' | 'purple' | 'gray'
  backdrop?: boolean
  className?: string
}

export const LoadingOverlay: React.FC<LoadingOverlayProps> = ({
  isVisible,
  text = 'Loading...',
  size = 'lg',
  color = 'blue',
  backdrop = true,
  className = ''
}) => {
  if (!isVisible) return null

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className={`
        fixed inset-0 z-50 flex items-center justify-center
        ${backdrop ? 'bg-black bg-opacity-50' : ''}
        ${className}
      `}
    >
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.8, opacity: 0 }}
        className="bg-white rounded-lg p-6 shadow-xl"
      >
        <div className="flex flex-col items-center space-y-4">
          <LoadingSpinner size={size} color={color} />
          <span className="text-gray-700 font-medium">{text}</span>
        </div>
      </motion.div>
    </motion.div>
  )
}

// Geometric loading animations
export const LoadingGeometric: React.FC<{
  shape?: 'circle' | 'square' | 'triangle'
  size?: 'sm' | 'md' | 'lg'
  color?: 'blue' | 'green' | 'red' | 'yellow' | 'purple' | 'gray'
  className?: string
}> = ({
  shape = 'circle',
  size = 'md',
  color = 'blue',
  className = ''
}) => {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8'
  }

  const colorClasses = {
    blue: 'text-blue-600',
    green: 'text-green-600',
    red: 'text-red-600',
    yellow: 'text-yellow-600',
    purple: 'text-purple-600',
    gray: 'text-gray-600'
  }

  const ShapeIcon = shape === 'circle' ? Circle : shape === 'square' ? Square : Triangle

  return (
    <motion.div
      className={`${sizeClasses[size]} ${colorClasses[color]} ${className}`}
      animate={{
        rotate: 360,
        scale: [1, 1.2, 1],
      }}
      transition={{
        rotate: { duration: 2, repeat: Infinity, ease: 'linear' },
        scale: { duration: 1, repeat: Infinity, ease: 'easeInOut' }
      }}
    >
      <ShapeIcon className="w-full h-full" />
    </motion.div>
  )
}

export default {
  LoadingSpinner,
  LoadingDots,
  LoadingPulse,
  LoadingWave,
  LoadingSkeleton,
  LoadingProgress,
  LoadingSpinnerWithText,
  LoadingOverlay,
  LoadingGeometric
}