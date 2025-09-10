import { useState } from 'react'
import { useReadContract } from 'wagmi'
import { formatUnits } from 'viem'
import { ESCROW_CONTRACT } from '../lib/contracts'
import { PurchaseCheckout } from './forms'

export default function BuyItem() {
  const [itemId, setItemId] = useState('')
  const [showCheckout, setShowCheckout] = useState(false)
  const [completedPurchase, setCompletedPurchase] = useState<{
    itemId: string
    transactionHash: string
  } | null>(null)

  // Read item details
  const { data: itemData } = useReadContract({
    ...ESCROW_CONTRACT,
    functionName: 'getItem',
    args: itemId ? [BigInt(itemId)] : undefined,
  })

  // Read fee calculation
  const { data: feeData } = useReadContract({
    ...ESCROW_CONTRACT,
    functionName: 'calculateFees',
    args: itemData ? [itemData[1]] : undefined, // itemData[1] is price
  })

  const handleProceedToCheckout = () => {
    if (!itemData || !feeData) {
      alert('Please enter a valid item ID and wait for data to load')
      return
    }
    setShowCheckout(true)
  }

  const handlePurchaseComplete = (transactionHash: string) => {
    console.log('Purchase completed:', { itemId, transactionHash })
    setCompletedPurchase({ itemId, transactionHash })
    setShowCheckout(false)
    
    // Reset after showing success for a while
    setTimeout(() => {
      setCompletedPurchase(null)
      setItemId('')
    }, 5000)
  }

  const handlePurchaseCancel = () => {
    setShowCheckout(false)
  }

  const handleStartNewPurchase = () => {
    setCompletedPurchase(null)
    setItemId('')
  }

  // Show purchase success screen
  if (completedPurchase) {
    return (
      <div className="bg-white rounded-lg shadow-lg p-6 text-center">
        <div className="mb-6">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-2xl font-semibold text-gray-900 mb-2">Purchase Successful!</h2>
          <p className="text-gray-600 mb-4">
            You have successfully purchased item #{completedPurchase.itemId}.
          </p>
          
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
            <p className="text-green-800 text-sm mb-2">
              <strong>Transaction Hash:</strong>
            </p>
            <a 
              href={`https://basescan.org/tx/${completedPurchase.transactionHash}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-green-600 hover:text-green-800 underline text-sm break-all"
            >
              {completedPurchase.transactionHash}
            </a>
          </div>
          
          <div className="space-y-3">
            <button
              onClick={handleStartNewPurchase}
              className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition-colors"
            >
              Buy Another Item
            </button>
          </div>
        </div>
      </div>
    )
  }

  // Show enhanced checkout
  if (showCheckout && itemData && feeData) {
    return (
      <PurchaseCheckout
        itemId={itemId}
        itemData={{
          title: itemData[2] as string,
          price: itemData[1] as bigint,
          creator: itemData[0] as string,
          active: itemData[3] as boolean
        }}
        feeData={{
          platformFee: feeData[0] as bigint,
          creatorPayout: feeData[1] as bigint
        }}
        onComplete={handlePurchaseComplete}
        onCancel={handlePurchaseCancel}
      />
    )
  }

  // Show item selection form
  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <h2 className="text-2xl font-semibold mb-6">Buy Item</h2>
      
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Item ID
          </label>
          <input
            type="number"
            min="1"
            value={itemId}
            onChange={(e) => setItemId(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-base-blue"
            placeholder="Enter item ID"
          />
        </div>

        {itemData && (
          <div className="bg-gray-50 p-4 rounded-md">
            <h3 className="font-medium mb-2">Item Details:</h3>
            <p><strong>Title:</strong> {itemData[2]}</p>
            <p><strong>Price:</strong> {formatUnits(itemData[1], 6)} USDC</p>
            <p><strong>Creator:</strong> {itemData[0]}</p>
            <p><strong>Active:</strong> {itemData[3] ? 'Yes' : 'No'}</p>
            
            {feeData && (
              <div className="mt-3 pt-3 border-t">
                <p><strong>Platform Fee:</strong> {formatUnits(feeData[0], 6)} USDC</p>
                <p><strong>Creator Gets:</strong> {formatUnits(feeData[1], 6)} USDC</p>
                <p><strong>Total Cost:</strong> {formatUnits(itemData[1], 6)} USDC</p>
              </div>
            )}
          </div>
        )}

        <button
          onClick={handleProceedToCheckout}
          disabled={!itemData || !feeData || !(itemData[3] as boolean)}
          className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {!itemData ? 'Enter Item ID' : 
           !(itemData[3] as boolean) ? 'Item Not Available' : 
           'Proceed to Checkout'}
        </button>

        {itemData && !(itemData[3] as boolean) && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-md">
            <p className="text-red-800 text-sm">
              ⚠️ This item is no longer available for purchase.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}