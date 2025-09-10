import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { formatUnits } from 'viem'
import { useAccount, useWriteContract, useWaitForTransactionReceipt } from 'wagmi'
import { X, ShoppingCart, Info, CreditCard, Shield, Clock, RefreshCw, CheckCircle, AlertCircle, Loader } from 'lucide-react'
import { PurchaseCheckoutProps, CheckoutState } from './types'
import { ESCROW_CONTRACT, USDC_CONTRACT } from '../../lib/contracts'
import { 
  ResponsiveContainer, 
  ResponsiveGrid, 
  ResponsiveStack, 
  ResponsiveShow, 
  TouchFriendly,
  useResponsive 
} from './ResponsiveLayout'

const PurchaseCheckout: React.FC<PurchaseCheckoutProps> = ({
  itemId,
  itemData,
  feeData,
  onComplete,
  onCancel
}) => {
  const { address } = useAccount()
  const { writeContract, data: hash, isPending, error: contractError } = useWriteContract()
  const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({
    hash,
  })

  const [checkoutState, setCheckoutState] = useState<CheckoutState>({
    step: 'review'
  })

  const [transactionState, setTransactionState] = useState<{
    approvalHash?: string
    purchaseHash?: string
    currentOperation: 'idle' | 'approving' | 'purchasing'
    error?: string
  }>({
    currentOperation: 'idle'
  })

  // Handle transaction state changes
  useEffect(() => {
    if (isPending) {
      // Transaction is pending in wallet
      if (transactionState.currentOperation === 'approving') {
        setCheckoutState({ step: 'approve', approvalHash: undefined })
      } else if (transactionState.currentOperation === 'purchasing') {
        setCheckoutState({ step: 'purchase', approvalHash: transactionState.approvalHash })
      }
    } else if (hash && isConfirming) {
      // Transaction is confirming on blockchain
      if (transactionState.currentOperation === 'approving') {
        setCheckoutState({ step: 'approve', approvalHash: hash })
        setTransactionState(prev => ({ ...prev, approvalHash: hash }))
      } else if (transactionState.currentOperation === 'purchasing') {
        setCheckoutState({ step: 'confirming', approvalHash: transactionState.approvalHash, purchaseHash: hash })
        setTransactionState(prev => ({ ...prev, purchaseHash: hash }))
      }
    } else if (hash && isConfirmed) {
      // Transaction confirmed
      if (transactionState.currentOperation === 'approving') {
        // Approval completed, ready for purchase
        setCheckoutState({ step: 'purchase', approvalHash: hash })
        setTransactionState(prev => ({ ...prev, currentOperation: 'idle', approvalHash: hash }))
      } else if (transactionState.currentOperation === 'purchasing') {
        // Purchase completed
        setCheckoutState({ step: 'complete', approvalHash: transactionState.approvalHash, purchaseHash: hash })
        setTransactionState(prev => ({ ...prev, currentOperation: 'idle', purchaseHash: hash }))
        onComplete(hash)
      }
    } else if (contractError) {
      // Transaction failed
      setCheckoutState(prev => ({ ...prev, error: contractError.message }))
      setTransactionState(prev => ({ ...prev, currentOperation: 'idle', error: contractError.message }))
    }
  }, [isPending, hash, isConfirming, isConfirmed, contractError, transactionState.currentOperation, transactionState.approvalHash, onComplete])

  // Handle USDC approval
  const handleApproval = async () => {
    if (!address) {
      setTransactionState(prev => ({ ...prev, error: 'Please connect your wallet' }))
      return
    }

    try {
      setTransactionState(prev => ({ ...prev, currentOperation: 'approving', error: undefined }))
      setCheckoutState({ step: 'approve' })
      
      writeContract({
        ...USDC_CONTRACT,
        functionName: 'approve',
        args: [ESCROW_CONTRACT.address, itemData.price],
      })
    } catch (error) {
      console.error('Error approving USDC:', error)
      setTransactionState(prev => ({ 
        ...prev, 
        currentOperation: 'idle',
        error: error instanceof Error ? error.message : 'Failed to approve USDC'
      }))
    }
  }

  // Handle item purchase
  const handlePurchase = async () => {
    if (!address || !transactionState.approvalHash) {
      setTransactionState(prev => ({ ...prev, error: 'Approval required first' }))
      return
    }

    try {
      setTransactionState(prev => ({ ...prev, currentOperation: 'purchasing', error: undefined }))
      
      writeContract({
        ...ESCROW_CONTRACT,
        functionName: 'buyItem',
        args: [BigInt(itemId)],
      })
    } catch (error) {
      console.error('Error purchasing item:', error)
      setTransactionState(prev => ({ 
        ...prev, 
        currentOperation: 'idle',
        error: error instanceof Error ? error.message : 'Failed to purchase item'
      }))
    }
  }

  // Reset transaction state
  const resetTransaction = () => {
    setTransactionState({
      currentOperation: 'idle'
    })
    setCheckoutState({ step: 'review' })
  }

  // Format price values for display
  const formatPrice = (price: bigint) => {
    return parseFloat(formatUnits(price, 6)).toFixed(2)
  }

  const totalPrice = itemData.price
  const platformFee = feeData.platformFee
  const creatorPayout = feeData.creatorPayout

  return (
    <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-lg overflow-hidden">
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <ShoppingCart className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Purchase Checkout</h2>
              <p className="text-sm text-gray-600">Item ID: #{itemId}</p>
            </div>
          </div>
          <button
            onClick={onCancel}
            className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="p-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Item Details */}
          <div className="lg:col-span-2 space-y-6">
            {/* Item Information Card */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-6"
            >
              <div className="flex items-start space-x-4">
                {/* Item Image Placeholder */}
                <div className="flex-shrink-0">
                  <div className="w-24 h-24 bg-gradient-to-br from-blue-100 to-indigo-200 rounded-lg flex items-center justify-center">
                    <div className="text-blue-600 text-2xl font-bold">
                      {itemData.title.charAt(0).toUpperCase()}
                    </div>
                  </div>
                </div>
                
                {/* Item Details */}
                <div className="flex-1 min-w-0">
                  <h3 className="text-xl font-bold text-gray-900 mb-2">{itemData.title}</h3>
                  
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <span className="text-sm text-gray-600">Created by:</span>
                      <span className="text-sm font-mono bg-gray-100 px-2 py-1 rounded">
                        {`${itemData.creator.slice(0, 6)}...${itemData.creator.slice(-4)}`}
                      </span>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <span className="text-sm text-gray-600">Status:</span>
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                        itemData.active 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {itemData.active ? 'Available' : 'Sold Out'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Purchase Information */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.1 }}
              className="bg-white border border-gray-200 rounded-lg p-6"
            >
              <div className="flex items-center space-x-2 mb-4">
                <Info className="w-5 h-5 text-blue-600" />
                <h4 className="text-lg font-semibold text-gray-900">Purchase Information</h4>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Delivery Information */}
                <div className="space-y-3">
                  <h5 className="font-medium text-gray-900 flex items-center">
                    <Clock className="w-4 h-4 mr-2 text-green-600" />
                    Delivery Details
                  </h5>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Delivery Method:</span>
                      <span className="font-medium text-gray-900">Instant Access</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Access Type:</span>
                      <span className="font-medium text-gray-900">Digital Download</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Availability:</span>
                      <span className="font-medium text-green-600">Immediate</span>
                    </div>
                  </div>
                </div>

                {/* Security Information */}
                <div className="space-y-3">
                  <h5 className="font-medium text-gray-900 flex items-center">
                    <Shield className="w-4 h-4 mr-2 text-blue-600" />
                    Security & Trust
                  </h5>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Payment Method:</span>
                      <span className="font-medium text-gray-900">USDC (Crypto)</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Escrow Protection:</span>
                      <span className="font-medium text-green-600">Enabled</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Blockchain:</span>
                      <span className="font-medium text-gray-900">Base Network</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Purchase Terms */}
              <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                <h5 className="font-medium text-yellow-900 mb-2">Important Purchase Terms</h5>
                <ul className="text-sm text-yellow-800 space-y-1">
                  <li>• All sales are final - no refunds after purchase completion</li>
                  <li>• You will receive instant access upon successful payment</li>
                  <li>• Payments are processed through smart contracts on Base network</li>
                  <li>• A small platform fee is included in the total price</li>
                </ul>
              </div>
            </motion.div>

            {/* Creator Information */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.2 }}
              className="bg-white border border-gray-200 rounded-lg p-6"
            >
              <h4 className="text-lg font-semibold text-gray-900 mb-4">About the Creator</h4>
              
              <div className="flex items-start space-x-4">
                <div className="w-12 h-12 bg-gradient-to-br from-purple-100 to-pink-200 rounded-full flex items-center justify-center">
                  <span className="text-purple-600 font-bold">
                    {itemData.creator.slice(2, 4).toUpperCase()}
                  </span>
                </div>
                
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-2">
                    <span className="font-medium text-gray-900">Creator Address:</span>
                    <span className="font-mono text-sm bg-gray-100 px-2 py-1 rounded">
                      {itemData.creator}
                    </span>
                  </div>
                  
                  <p className="text-sm text-gray-600 mb-3">
                    This creator has been verified on the blockchain. All payments go directly to their wallet address.
                  </p>
                  
                  <div className="flex items-center space-x-4 text-sm">
                    <div className="flex items-center space-x-1">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <span className="text-gray-600">Verified Creator</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <Shield className="w-3 h-3 text-blue-600" />
                      <span className="text-gray-600">Blockchain Verified</span>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>

          {/* Right Column - Pricing Summary */}
          <div className="lg:col-span-1">
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3, delay: 0.1 }}
              className="sticky top-6"
            >
              {/* Purchase Progress */}
              {checkoutState.step !== 'review' && (
                <div className="bg-white border border-gray-200 rounded-lg p-4 mb-6">
                  <h4 className="text-sm font-semibold text-gray-900 mb-3">Purchase Progress</h4>
                  <div className="space-y-3">
                    {/* Step 1: Approval */}
                    <div className="flex items-center space-x-3">
                      <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                        checkoutState.approvalHash 
                          ? 'bg-green-100 text-green-800' 
                          : checkoutState.step === 'approve'
                          ? 'bg-blue-100 text-blue-800'
                          : 'bg-gray-100 text-gray-600'
                      }`}>
                        {checkoutState.approvalHash ? '✓' : '1'}
                      </div>
                      <span className={`text-sm ${
                        checkoutState.approvalHash ? 'text-green-800 font-medium' : 'text-gray-600'
                      }`}>
                        USDC Approval
                      </span>
                    </div>

                    {/* Step 2: Purchase */}
                    <div className="flex items-center space-x-3">
                      <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                        checkoutState.step === 'complete'
                          ? 'bg-green-100 text-green-800'
                          : checkoutState.step === 'purchase' || checkoutState.step === 'confirming'
                          ? 'bg-blue-100 text-blue-800'
                          : 'bg-gray-100 text-gray-600'
                      }`}>
                        {checkoutState.step === 'complete' ? '✓' : '2'}
                      </div>
                      <span className={`text-sm ${
                        checkoutState.step === 'complete' ? 'text-green-800 font-medium' : 'text-gray-600'
                      }`}>
                        Complete Purchase
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* Pricing Card */}
              <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
                <div className="flex items-center space-x-2 mb-6">
                  <CreditCard className="w-5 h-5 text-green-600" />
                  <h4 className="text-lg font-semibold text-gray-900">Price Breakdown</h4>
                </div>

                <div className="space-y-4">
                  {/* Item Price */}
                  <div className="flex justify-between items-center py-3 border-b border-gray-100">
                    <span className="text-gray-600">Item Price</span>
                    <span className="text-lg font-semibold text-gray-900">
                      {formatPrice(totalPrice)} USDC
                    </span>
                  </div>

                  {/* Platform Fee */}
                  <div className="flex justify-between items-center py-2">
                    <div className="flex items-center space-x-1">
                      <span className="text-gray-600">Platform Fee</span>
                      <div className="group relative">
                        <Info className="w-3 h-3 text-gray-400 cursor-help" />
                        <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                          2.5% platform fee
                        </div>
                      </div>
                    </div>
                    <span className="text-sm font-medium text-gray-700">
                      {formatPrice(platformFee)} USDC
                    </span>
                  </div>

                  {/* Creator Payout */}
                  <div className="flex justify-between items-center py-2 text-sm">
                    <span className="text-gray-500">Creator Receives</span>
                    <span className="font-medium text-green-600">
                      {formatPrice(creatorPayout)} USDC
                    </span>
                  </div>

                  {/* Total */}
                  <div className="flex justify-between items-center py-4 border-t border-gray-200">
                    <span className="text-lg font-semibold text-gray-900">Total</span>
                    <span className="text-2xl font-bold text-green-600">
                      {formatPrice(totalPrice)} USDC
                    </span>
                  </div>

                  {/* Gas Fee Estimate */}
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-blue-800">Estimated Gas Fee</span>
                      <span className="font-medium text-blue-900">~$2-5 USD</span>
                    </div>
                    <p className="text-xs text-blue-700 mt-1">
                      Gas fees are paid separately in ETH
                    </p>
                  </div>
                </div>

                {/* Purchase Steps */}
                <div className="mt-6 space-y-4">
                  <AnimatePresence mode="wait">
                    {/* Step 1: Review - Initial State */}
                    {checkoutState.step === 'review' && (
                      <motion.div
                        key="review"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="space-y-3"
                      >
                        <button
                          onClick={handleApproval}
                          disabled={!itemData.active || !address}
                          className={`w-full py-3 px-4 rounded-lg font-semibold transition-colors ${
                            itemData.active && address
                              ? 'bg-blue-600 text-white hover:bg-blue-700'
                              : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                          }`}
                        >
                          {!address ? 'Connect Wallet First' : 
                           !itemData.active ? 'Item Not Available' : 
                           'Start Purchase Process'}
                        </button>
                      </motion.div>
                    )}

                    {/* Step 2: USDC Approval */}
                    {checkoutState.step === 'approve' && (
                      <motion.div
                        key="approve"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="space-y-3"
                      >
                        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                          <div className="flex items-center space-x-2">
                            <div className="flex-shrink-0">
                              {isPending ? (
                                <Loader className="w-5 h-5 text-yellow-600 animate-spin" />
                              ) : checkoutState.approvalHash ? (
                                <CheckCircle className="w-5 h-5 text-green-600" />
                              ) : (
                                <CreditCard className="w-5 h-5 text-yellow-600" />
                              )}
                            </div>
                            <div className="flex-1">
                              <h5 className="font-medium text-yellow-900">
                                {isPending ? 'Approving USDC...' :
                                 checkoutState.approvalHash ? 'USDC Approved!' :
                                 'Step 1: Approve USDC Spending'}
                              </h5>
                              <p className="text-sm text-yellow-800">
                                {isPending ? 'Please confirm the transaction in your wallet' :
                                 checkoutState.approvalHash ? 'Ready to proceed with purchase' :
                                 'Allow the contract to spend your USDC tokens'}
                              </p>
                            </div>
                          </div>
                        </div>

                        {checkoutState.approvalHash ? (
                          <button
                            onClick={handlePurchase}
                            className="w-full py-3 px-4 bg-green-600 text-white rounded-lg hover:bg-green-700 font-semibold transition-colors"
                          >
                            Proceed to Purchase
                          </button>
                        ) : (
                          <button
                            onClick={handleApproval}
                            disabled={isPending}
                            className={`w-full py-3 px-4 rounded-lg font-semibold transition-colors ${
                              isPending
                                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                                : 'bg-yellow-600 text-white hover:bg-yellow-700'
                            }`}
                          >
                            {isPending ? 'Waiting for Approval...' : 'Approve USDC'}
                          </button>
                        )}
                      </motion.div>
                    )}

                    {/* Step 3: Purchase Execution */}
                    {checkoutState.step === 'purchase' && (
                      <motion.div
                        key="purchase"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="space-y-3"
                      >
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                          <div className="flex items-center space-x-2">
                            <div className="flex-shrink-0">
                              {isPending ? (
                                <Loader className="w-5 h-5 text-blue-600 animate-spin" />
                              ) : (
                                <ShoppingCart className="w-5 h-5 text-blue-600" />
                              )}
                            </div>
                            <div className="flex-1">
                              <h5 className="font-medium text-blue-900">
                                {isPending ? 'Processing Purchase...' : 'Step 2: Complete Purchase'}
                              </h5>
                              <p className="text-sm text-blue-800">
                                {isPending ? 'Please confirm the purchase transaction' : 'Execute the final purchase transaction'}
                              </p>
                            </div>
                          </div>
                        </div>

                        <button
                          onClick={handlePurchase}
                          disabled={isPending}
                          className={`w-full py-3 px-4 rounded-lg font-semibold transition-colors ${
                            isPending
                              ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                              : 'bg-green-600 text-white hover:bg-green-700'
                          }`}
                        >
                          {isPending ? 'Purchasing...' : 'Complete Purchase'}
                        </button>
                      </motion.div>
                    )}

                    {/* Step 4: Confirming Transaction */}
                    {checkoutState.step === 'confirming' && (
                      <motion.div
                        key="confirming"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="space-y-3"
                      >
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                          <div className="flex items-center space-x-3">
                            <Loader className="w-6 h-6 text-blue-600 animate-spin" />
                            <div className="flex-1">
                              <h5 className="font-medium text-blue-900">Confirming Purchase...</h5>
                              <p className="text-sm text-blue-800">
                                Your transaction is being confirmed on the blockchain. This may take a few moments.
                              </p>
                              {checkoutState.purchaseHash && (
                                <a
                                  href={`https://basescan.org/tx/${checkoutState.purchaseHash}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-sm text-blue-600 hover:text-blue-800 underline mt-1 inline-block"
                                >
                                  View Transaction
                                </a>
                              )}
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    )}

                    {/* Step 5: Purchase Complete */}
                    {checkoutState.step === 'complete' && (
                      <motion.div
                        key="complete"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="space-y-3"
                      >
                        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                          <div className="flex items-center space-x-3">
                            <CheckCircle className="w-6 h-6 text-green-600" />
                            <div className="flex-1">
                              <h5 className="font-medium text-green-900">Purchase Successful!</h5>
                              <p className="text-sm text-green-800">
                                Congratulations! You have successfully purchased "{itemData.title}".
                              </p>
                              {checkoutState.purchaseHash && (
                                <a
                                  href={`https://basescan.org/tx/${checkoutState.purchaseHash}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-sm text-green-600 hover:text-green-800 underline mt-1 inline-block"
                                >
                                  View Transaction Receipt
                                </a>
                              )}
                            </div>
                          </div>
                        </div>

                        <button
                          onClick={() => onComplete(checkoutState.purchaseHash || '')}
                          className="w-full py-3 px-4 bg-green-600 text-white rounded-lg hover:bg-green-700 font-semibold transition-colors"
                        >
                          Continue to Dashboard
                        </button>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Error Display */}
                  {(checkoutState.error || transactionState.error) && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="bg-red-50 border border-red-200 rounded-lg p-3"
                    >
                      <div className="flex items-start space-x-2">
                        <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                        <div className="flex-1">
                          <h5 className="font-medium text-red-900">Transaction Failed</h5>
                          <p className="text-sm text-red-800 mt-1">
                            {checkoutState.error || transactionState.error}
                          </p>
                          <button
                            onClick={resetTransaction}
                            className="text-sm text-red-600 hover:text-red-800 font-medium mt-2"
                          >
                            Try Again
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  )}

                  {/* Cancel Button */}
                  {checkoutState.step !== 'complete' && (
                    <button
                      onClick={onCancel}
                      disabled={isPending || isConfirming}
                      className="w-full py-2 px-4 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Cancel Purchase
                    </button>
                  )}
                </div>

                {/* Security Notice */}
                <div className="mt-4 p-3 bg-gray-50 border border-gray-200 rounded-lg">
                  <div className="flex items-start space-x-2">
                    <Shield className="w-4 h-4 text-gray-600 mt-0.5 flex-shrink-0" />
                    <div className="text-xs text-gray-600">
                      <p className="font-medium mb-1">Secure Payment</p>
                      <p>Your payment is protected by blockchain technology and smart contracts.</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Additional Information */}
              <div className="mt-6 bg-white border border-gray-200 rounded-lg p-4">
                <h5 className="font-medium text-gray-900 mb-3">Need Help?</h5>
                <div className="space-y-2 text-sm text-gray-600">
                  <p>• Check our FAQ for common questions</p>
                  <p>• Contact support for assistance</p>
                  <p>• View transaction on block explorer</p>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default PurchaseCheckout