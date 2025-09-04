import { useState, useEffect } from 'react'
import { useReadContract } from 'wagmi'
import { formatUnits } from 'viem'
import { ESCROW_CONTRACT } from '../lib/contracts'

export default function ItemList() {
  const [items, setItems] = useState<any[]>([])
  const [currentItemId, setCurrentItemId] = useState(1)

  // Read next item ID to know how many items exist
  const { data: nextItemId } = useReadContract({
    ...ESCROW_CONTRACT,
    functionName: 'nextItemId',
  })

  // Read individual item data
  const { data: itemData } = useReadContract({
    ...ESCROW_CONTRACT,
    functionName: 'getItem',
    args: [BigInt(currentItemId)],
  })

  useEffect(() => {
    if (itemData && !items.find(item => item.id === currentItemId)) {
      const newItem = {
        id: currentItemId,
        creator: itemData[0],
        price: itemData[1],
        title: itemData[2],
        active: itemData[3]
      }
      setItems(prev => [...prev, newItem])
    }
    
    // Move to next item
    if (nextItemId && currentItemId < Number(nextItemId) - 1) {
      setCurrentItemId(prev => prev + 1)
    }
  }, [itemData, currentItemId, nextItemId, items])

  const activeItems = items.filter(item => item.active)

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <h2 className="text-2xl font-semibold mb-6">Available Items</h2>
      
      {activeItems.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          <p>No items available yet.</p>
          <p className="text-sm mt-2">Be the first to list an item!</p>
        </div>
      ) : (
        <div className="space-y-4">
          {activeItems.map((item) => (
            <div key={item.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
              <div className="flex justify-between items-start mb-2">
                <h3 className="font-semibold text-lg">{item.title}</h3>
                <span className="bg-base-blue text-white px-2 py-1 rounded text-sm">
                  ID: {item.id}
                </span>
              </div>
              
              <div className="space-y-1 text-sm text-gray-600">
                <p><strong>Price:</strong> {formatUnits(item.price, 6)} USDC</p>
                <p><strong>Creator:</strong> {item.creator.slice(0, 6)}...{item.creator.slice(-4)}</p>
              </div>
              
              <div className="mt-3 flex justify-between items-center">
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                  Available
                </span>
                <button 
                  onClick={() => {
                    // Auto-fill the item ID in buy form
                    const buySection = document.querySelector('input[placeholder="Enter item ID"]') as HTMLInputElement
                    if (buySection) {
                      buySection.value = item.id.toString()
                      buySection.dispatchEvent(new Event('input', { bubbles: true }))
                    }
                  }}
                  className="text-base-blue hover:text-blue-700 text-sm font-medium"
                >
                  Select to Buy →
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
      
      <div className="mt-6 text-center text-sm text-gray-500">
        {nextItemId && (
          <p>Total items created: {Number(nextItemId) - 1}</p>
        )}
      </div>
    </div>
  )
}