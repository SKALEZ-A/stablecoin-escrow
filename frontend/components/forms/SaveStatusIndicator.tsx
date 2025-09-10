import React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Save, Check, AlertCircle, Loader } from 'lucide-react'

export interface SaveStatusIndicatorProps {
  status: 'idle' | 'saving' | 'saved' | 'error'
  lastSaved?: Date | null
  hasUnsavedChanges?: boolean
  error?: string | null
  className?: string
  showText?: boolean
  compact?: boolean
}

const SaveStatusIndicator: React.FC<SaveStatusIndicatorProps> = ({
  status,
  lastSaved,
  hasUnsavedChanges = false,
  error,
  className = '',
  showText = true,
  compact = false
}) => {
  const formatLastSaved = (date: Date) => {
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / (1000 * 60))
    const diffSecs = Math.floor(diffMs / 1000)

    if (diffSecs < 10) {
      return 'just now'
    } else if (diffSecs < 60) {
      return `${diffSecs}s ago`
    } else if (diffMins < 60) {
      return `${diffMins}m ago`
    } else {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
  }

  const getStatusConfig = () => {
    switch (status) {
      case 'saving':
        return {
          icon: Loader,
          color: 'text-blue-600',
          bgColor: 'bg-blue-50',
          borderColor: 'border-blue-200',
          text: 'Saving...',
          animate: true
        }
      case 'saved':
        return {
          icon: Check,
          color: 'text-green-600',
          bgColor: 'bg-green-50',
          borderColor: 'border-green-200',
          text: lastSaved ? `Saved ${formatLastSaved(lastSaved)}` : 'Saved',
          animate: false
        }
      case 'error':
        return {
          icon: AlertCircle,
          color: 'text-red-600',
          bgColor: 'bg-red-50',
          borderColor: 'border-red-200',
          text: 'Save failed',
          animate: false
        }
      default:
        if (hasUnsavedChanges) {
          return {
            icon: Save,
            color: 'text-amber-600',
            bgColor: 'bg-amber-50',
            borderColor: 'border-amber-200',
            text: 'Unsaved changes',
            animate: false
          }
        }
        return null
    }
  }

  const config = getStatusConfig()

  if (!config) {
    return null
  }

  const { icon: Icon, color, bgColor, borderColor, text, animate } = config

  if (compact) {
    return (
      <div className={`inline-flex items-center space-x-1 ${className}`}>
        <motion.div
          animate={animate ? { rotate: 360 } : {}}
          transition={animate ? { duration: 1, repeat: Infinity, ease: "linear" } : {}}
        >
          <Icon className={`w-4 h-4 ${color}`} />
        </motion.div>
        {showText && (
          <span className={`text-xs ${color}`}>
            {text}
          </span>
        )}
      </div>
    )
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        className={`inline-flex items-center space-x-2 px-3 py-2 rounded-lg border ${bgColor} ${borderColor} ${className}`}
      >
        <motion.div
          animate={animate ? { rotate: 360 } : {}}
          transition={animate ? { duration: 1, repeat: Infinity, ease: "linear" } : {}}
        >
          <Icon className={`w-4 h-4 ${color}`} />
        </motion.div>
        
        {showText && (
          <div className="flex flex-col">
            <span className={`text-sm font-medium ${color}`}>
              {text}
            </span>
            {error && status === 'error' && (
              <span className="text-xs text-red-500 mt-0.5">
                {error}
              </span>
            )}
          </div>
        )}
      </motion.div>
    </AnimatePresence>
  )
}

export default SaveStatusIndicator