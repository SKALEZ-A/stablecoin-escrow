import React, { useState } from 'react'
import { motion } from 'framer-motion'
import ListItemWizard from './ListItemWizard'
import { ListItemFormData } from './types'

// Demo component to showcase the ListItemWizard Step 1 implementation
const ListItemWizardDemo: React.FC = () => {
  const [showWizard, setShowWizard] = useState(false)
  const [completedData, setCompletedData] = useState<ListItemFormData | null>(null)

  const handleComplete = (data: ListItemFormData) => {
    console.log('Listing completed:', data)
    setCompletedData(data)
    setShowWizard(false)
  }

  const handleCancel = () => {
    console.log('Listing cancelled')
    setShowWizard(false)
  }

  const handleStartNew = () => {
    setCompletedData(null)
    setShowWizard(true)
  }

  const handleStartWithData = () => {
    setShowWizard(true)
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <h1 className="text-3xl font-bold text-center mb-2">List Item Wizard Demo</h1>
          <p className="text-gray-600 text-center mb-8">
            Showcase of the multi-step listing form with Step 1: Basic Information implemented
          </p>

          {!showWizard ? (
            <div className="max-w-2xl mx-auto">
              {/* Demo Controls */}
              <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
                <h2 className="text-xl font-semibold mb-4">Demo Controls</h2>
                <div className="space-y-4">
                  <button
                    onClick={handleStartNew}
                    className="w-full py-3 px-6 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Start New Listing
                  </button>
                  
                  <button
                    onClick={handleStartWithData}
                    className="w-full py-3 px-6 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 transition-colors"
                  >
                    Start with Sample Data
                  </button>
                </div>
              </div>

              {/* Completed Data Display */}
              {completedData && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-white rounded-lg shadow-lg p-6"
                >
                  <h2 className="text-xl font-semibold mb-4 text-green-800">✅ Listing Completed!</h2>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h3 className="font-medium mb-2">Form Data:</h3>
                    <pre className="text-sm text-gray-700 overflow-x-auto">
                      {JSON.stringify(completedData, null, 2)}
                    </pre>
                  </div>
                  <button
                    onClick={handleStartNew}
                    className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Create Another Listing
                  </button>
                </motion.div>
              )}

              {/* Feature Highlights */}
              <div className="mt-8 bg-white rounded-lg shadow-lg p-6">
                <h2 className="text-xl font-semibold mb-4">✨ Step 1 Features Implemented</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-3">
                    <div className="flex items-start">
                      <div className="w-2 h-2 bg-green-500 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                      <div>
                        <h4 className="font-medium">Enhanced Form Fields</h4>
                        <p className="text-sm text-gray-600">Floating labels, validation states, animations</p>
                      </div>
                    </div>
                    <div className="flex items-start">
                      <div className="w-2 h-2 bg-green-500 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                      <div>
                        <h4 className="font-medium">Real-time Validation</h4>
                        <p className="text-sm text-gray-600">Instant feedback with Zod schema validation</p>
                      </div>
                    </div>
                    <div className="flex items-start">
                      <div className="w-2 h-2 bg-green-500 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                      <div>
                        <h4 className="font-medium">Progress Tracking</h4>
                        <p className="text-sm text-gray-600">Visual progress indicator with step status</p>
                      </div>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <div className="flex items-start">
                      <div className="w-2 h-2 bg-green-500 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                      <div>
                        <h4 className="font-medium">Form Persistence</h4>
                        <p className="text-sm text-gray-600">Auto-save with localStorage integration</p>
                      </div>
                    </div>
                    <div className="flex items-start">
                      <div className="w-2 h-2 bg-green-500 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                      <div>
                        <h4 className="font-medium">Step Management</h4>
                        <p className="text-sm text-gray-600">Controlled navigation with validation gates</p>
                      </div>
                    </div>
                    <div className="flex items-start">
                      <div className="w-2 h-2 bg-green-500 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                      <div>
                        <h4 className="font-medium">Responsive Design</h4>
                        <p className="text-sm text-gray-600">Mobile-first layout with smooth animations</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Next Steps */}
              <div className="mt-8 bg-amber-50 border border-amber-200 rounded-lg p-6">
                <h2 className="text-xl font-semibold mb-4 text-amber-800">🚧 Coming Next</h2>
                <div className="space-y-2 text-amber-700">
                  <div>• <strong>Task 4.2:</strong> Step 2 - Details & Media (Image upload, tags, additional details)</div>
                  <div>• <strong>Task 4.3:</strong> Step 3 - Review & Publish (Preview, wallet integration, contract interaction)</div>
                  <div>• <strong>Task 5:</strong> Enhanced Purchase Checkout Flow</div>
                </div>
              </div>
            </div>
          ) : (
            <ListItemWizard
              onComplete={handleComplete}
              onCancel={handleCancel}
              initialData={showWizard && completedData ? {
                title: 'Sample Digital Product',
                description: 'This is a sample product description with pre-filled data to demonstrate the form persistence and validation features.',
                price: '29.99',
                category: 'digital'
              } : undefined}
            />
          )}
        </motion.div>
      </div>
    </div>
  )
}

export default ListItemWizardDemo