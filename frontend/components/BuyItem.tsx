import { useState } from 'react'
import { useWriteContract, useWaitForTransactionReceipt, useReadContract } from 'wagmi'
import { parseUnits, formatUnits } from 'viem'
import { ESCROW_CONTRACT, USDC_CONTRACT } from '../lib/contracts'

export default function BuyItem() {
  const [itemId, setItemId] = useState('')
  
  const { writeContract, data: hash, isPending } = useWriteContract()
  const { isLoading: isConfirming } = useWaitForTransactionReceipt({
    hash,
  })

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

  const handleApproveAndBuy = async () => {
    if (!itemId || !itemData) {
      alert('Please enter a valid item ID')
      return
    }

    try {
      const price = itemData[1] as bigint
      
      // First approve USDC spending
      writeContract({
        ...USDC_CONTRACT,
        functionName: 'approve',
        args: [ESCROW_CONTRACT.address, price],
      })
      
      // Note: In a real app, you'd wait for approval then call buyItem
      // For simplicity, we're showing the approve step here
    } catch (error) {
      console.error('Error:', error)
      alert('Error processing transaction. Please try again.')
    }
  }

  const handleBuyItem = async () => {
    if (!itemId) {
      alert('Please enter a valid item ID')
      return
    }

    try {
      writeContract({
        ...ESCROW_CONTRACT,
        functionName: 'buyItem',
        args: [BigInt(itemId)],
      })
    } catch (error) {
      console.error('Error buying item:', error)
      alert('Error buying item. Please try again.')
    }
  }

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
              </div>
            )}
          </div>
        )}

        <div className="space-y-2">
          <button
            onClick={handleApproveAndBuy}
            disabled={!itemData || isPending || isConfirming}
            className="w-full bg-yellow-500 text-white py-2 px-4 rounded-md hover:bg-yellow-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            1. Approve USDC Spending
          </button>
          
          <button
            onClick={handleBuyItem}
            disabled={!itemData || isPending || isConfirming}
            className="w-full bg-base-blue text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            2. Buy Item
          </button>
        </div>
      </div>

      {hash && (
        <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-md">
          <p className="text-green-800 text-sm">
            ✅ Transaction submitted! 
            <a 
              href={`https://basescan.org/tx/${hash}`}
              target="_blank"
              rel="noopener noreferrer"
              className="ml-1 underline"
            >
              View transaction
            </a>
          </p>
        </div>
      )}
    </div>
  )
}