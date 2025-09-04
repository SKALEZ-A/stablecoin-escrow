import { useState } from 'react'
import { useWriteContract, useWaitForTransactionReceipt, useAccount, useReadContract } from 'wagmi'
import { parseUnits, formatUnits } from 'viem'
import { USDC_CONTRACT } from '../lib/contracts'

export default function MintUSDC() {
  const [amount, setAmount] = useState('')
  const { address } = useAccount()
  
  const { writeContract, data: hash, isPending } = useWriteContract()
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash })

  // Read current USDC balance
  const { data: balance } = useReadContract({
    ...USDC_CONTRACT,
    functionName: 'balanceOf',
    args: address ? [address] : undefined,
  })

  const handleMint = () => {
    if (!amount || !address) return
    
    writeContract({
      ...USDC_CONTRACT,
      functionName: 'mint',
      args: [address, parseUnits(amount, 6)],
    })
  }

  return (
    <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-6">
      <h3 className="text-lg font-semibold text-blue-900 mb-4">
        🪙 Mint Test USDC
      </h3>
      
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Current Balance: {balance ? formatUnits(balance, 6) : '0'} USDC
          </label>
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Amount to Mint (USDC)
          </label>
          <input
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="1000"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        
        <button
          onClick={handleMint}
          disabled={!amount || isPending || isConfirming}
          className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isPending ? 'Confirming...' : isConfirming ? 'Minting...' : 'Mint USDC'}
        </button>
        
        {isSuccess && (
          <div className="text-green-600 text-sm">
            ✅ Successfully minted {amount} USDC!
          </div>
        )}
      </div>
      
      <div className="mt-4 text-xs text-gray-600">
        <p>💡 This is test USDC for Base Sepolia testnet only.</p>
        <p>Use this to test the escrow payment system.</p>
      </div>
    </div>
  )
}