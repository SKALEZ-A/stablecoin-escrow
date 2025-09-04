import { useState } from 'react'
import { useAccount, useWriteContract, useWaitForTransactionReceipt } from 'wagmi'
import { parseUnits } from 'viem'
import { ESCROW_CONTRACT } from '../lib/contracts'

export default function ListItem() {
  const { address } = useAccount()
  const [title, setTitle] = useState('')
  const [price, setPrice] = useState('')
  const [creatorAddress, setCreatorAddress] = useState(address || '')

  const { writeContract, data: hash, isPending } = useWriteContract()
  const { isLoading: isConfirming } = useWaitForTransactionReceipt({
    hash,
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!title || !price || !creatorAddress) {
      alert('Please fill all fields')
      return
    }

    try {
      const priceInUsdc = parseUnits(price, 6) // USDC has 6 decimals
      
      writeContract({
        ...ESCROW_CONTRACT,
        functionName: 'listItem',
        args: [creatorAddress as `0x${string}`, priceInUsdc, title],
      })
    } catch (error) {
      console.error('Error listing item:', error)
      alert('Error listing item. Please try again.')
    }
  }

  const resetForm = () => {
    setTitle('')
    setPrice('')
    setCreatorAddress(address || '')
  }

  if (hash && !isConfirming) {
    setTimeout(resetForm, 2000)
  }

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <h2 className="text-2xl font-semibold mb-6">List New Item</h2>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Item Title
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-base-blue"
            placeholder="Enter item title"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Price (USDC)
          </label>
          <input
            type="number"
            step="0.01"
            min="0"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-base-blue"
            placeholder="0.00"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Creator Address (receives payment)
          </label>
          <input
            type="text"
            value={creatorAddress}
            onChange={(e) => setCreatorAddress(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-base-blue"
            placeholder="0x..."
            required
          />
        </div>

        <button
          type="submit"
          disabled={isPending || isConfirming}
          className="w-full bg-base-blue text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {isPending || isConfirming ? 'Listing...' : 'List Item'}
        </button>
      </form>

      {hash && (
        <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-md">
          <p className="text-green-800 text-sm">
            ✅ Item listed successfully! 
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