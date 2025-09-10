import React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Save, Clock, AlertCircle, X, RefreshCw } from 'lucide-react'

export interface FormDraftRecoveryProps {
  isVisible: boolean
  savedDate?: Date | null
  onRestore: () => void
  onDiscard: () => void
  onDismiss: () => void
  title?: string
  description?: string
}

const FormDraftRecovery: React.FC<FormDraftRecoveryProps> = ({
  isVisible,
  savedDate,
  onRestore,
  onDiscard,
  onDismiss,
  title = "Draft Found",
  description = "We found a saved draft of your form. Would you like to restore it?"
}) => {
  const formatSavedDate = (date: Date) => {
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / (1000 * 60))
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

    if (diffMins < 1) {
      return 'just now'
    } else if (diffMins < 60) {
      return `${diffMins} minute${diffMins === 1 ? '' : 's'} ago`
    } else if (diffHours < 24) {
      return `${diffHours} hour${diffHours === 1 ? '' : 's'} ago`
    } else if (diffDays < 7) {
      return `${diffDays} day${diffDays === 1 ? '' : 's'} ago`
    } else {
      return date.toLocaleDateString()
    }
  }

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="bg-white rounded-lg shadow-xl max-w-md w-full p-6"
          >
            {/* Header */}
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Save className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
                  {savedDate && (
                    <div className="flex items-center space-x-1 text-sm text-gray-500">
                      <Clock className="w-4 h-4" />
                      <span>Saved {formatSavedDate(savedDate)}</span>
                    </div>
                  )}
                </div>
              </div>
              <button
                onClick={onDismiss}
                className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content */}
            <div className="mb-6">
              <p className="text-gray-600 mb-4">{description}</p>
              
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
                <div className="flex items-start space-x-2">
                  <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                  <div className="text-sm text-amber-800">
                    <p className="font-medium mb-1">What happens next?</p>
                    <ul className="space-y-1">
                      <li>• <strong>Restore:</strong> Continue where you left off</li>
                      <li>• <strong>Start Fresh:</strong> Begin with a clean form</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex space-x-3">
              <button
                onClick={onRestore}
                className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition-colors flex items-center justify-center space-x-2"
              >
                <RefreshCw className="w-4 h-4" />
                <span>Restore Draft</span>
              </button>
              <button
                onClick={onDiscard}
                className="flex-1 bg-gray-100 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-200 transition-colors"
              >
                Start Fresh
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

export default FormDraftRecovery