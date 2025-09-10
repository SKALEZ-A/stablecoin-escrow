import { useState } from 'react'
import { useRouter } from 'next/router'
import { ListItemWizard } from './forms'
import { ListItemFormData } from './forms/types'

export default function ListItem() {
  const router = useRouter()
  const [showWizard, setShowWizard] = useState(true)
  const [completedListing, setCompletedListing] = useState<{
    data: ListItemFormData & { transactionHash?: string }
  } | null>(null)

  const handleComplete = (data: ListItemFormData & { transactionHash?: string }) => {
    console.log('Listing completed:', data)
    setCompletedListing({ data })
    setShowWizard(false)
    
    // Optionally redirect or refresh the page after a delay
    setTimeout(() => {
      // You can redirect to the marketplace or refresh the page
      // router.push('/')
      // Or reset to show the wizard again
      setShowWizard(true)
      setCompletedListing(null)
    }, 5000)
  }

  const handleCancel = () => {
    setShowWizard(false)
    // Optionally redirect back to marketplace
    // router.push('/')
  }

  const handleStartNewListing = () => {
    setCompletedListing(null)
    setShowWizard(true)
  }

  if (!showWizard && completedListing) {
    return (
      <div className="bg-white rounded-lg shadow-lg p-6 text-center">
        <div className="mb-6">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-2xl font-semibold text-gray-900 mb-2">Item Listed Successfully!</h2>
          <p className="text-gray-600 mb-4">
            Your item "{completedListing.data.title}" has been listed on the marketplace.
          </p>
          
          {completedListing.data.transactionHash && (
            <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
              <p className="text-green-800 text-sm mb-2">
                <strong>Transaction Hash:</strong>
              </p>
              <a 
                href={`https://basescan.org/tx/${completedListing.data.transactionHash}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-green-600 hover:text-green-800 underline text-sm break-all"
              >
                {completedListing.data.transactionHash}
              </a>
            </div>
          )}
          
          <div className="space-y-3">
            <button
              onClick={handleStartNewListing}
              className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition-colors"
            >
              List Another Item
            </button>
            <button
              onClick={() => router.push('/')}
              className="w-full bg-gray-100 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-200 transition-colors"
            >
              Back to Marketplace
            </button>
          </div>
        </div>
      </div>
    )
  }

  if (!showWizard) {
    return (
      <div className="bg-white rounded-lg shadow-lg p-6 text-center">
        <h2 className="text-2xl font-semibold mb-4">List New Item</h2>
        <p className="text-gray-600 mb-6">Ready to list a new item on the marketplace?</p>
        <button
          onClick={handleStartNewListing}
          className="bg-blue-600 text-white py-2 px-6 rounded-md hover:bg-blue-700 transition-colors"
        >
          Start Listing
        </button>
      </div>
    )
  }

  return (
    <ListItemWizard
      onComplete={handleComplete}
      onCancel={handleCancel}
    />
  )
}