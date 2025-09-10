import React, { useState, useCallback, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useWaitForTransactionReceipt, usePublicClient } from 'wagmi'
import { CheckCircle, AlertCircle, ExternalLink, RefreshCw, Clock, Zap } from 'lucide-react'
import { useWalletState } from './WalletStateManager'
import { useContractInteraction } from './hooks/useContractInteraction'
import { LoadingSpinner } from './LoadingStates'

interface TransactionStep {
  id: string
  title: string
  description: string
  status: 'pending' | 'active' | 'completed' | 'failed'
  hash?: string
  gasUsed?: bigint
  error?: string
}

interface Web3TransactionHandlerProps {
  steps: Omit<TransactionStep, 'status' | 'hash' | 'gasUsed' | 'error'>[]
  onComplete: (results: { hash: string; gasUsed?: bigint }[]) => void
  onError: (error: any, stepIndex: number) => void
  className?: string
}

export const Web3TransactionHandler: React.FC<Web3TransactionHandlerProps> = ({
  steps: initialSteps,
  onComplete,
  onError,
  className = ''
}) => {
  const { walletState, isWalletReady } = useWalletState()
  const { executeTransaction, transactionState, reset } = useContractInteraction()
  
  const [steps, setSteps] = useState<TransactionStep[]>(
    initialSteps.map(step => ({ ...step, status: 'pending' }))
  )
  const [currentStepIndex, setCurrentStepIndex] = useState(0)
  const [completedTransactions, setCompletedTransactions] = useState<{ hash: string; gasUsed?: bigint }[]>([])

  // Update step status based on transaction state
  useEffect(() => {
    if (currentStepIndex >= steps.length) return

    setSteps(prev => prev.map((step, index) => {
      if (index === currentStepIndex) {
        switch (transactionState.status) {
          case 'pending':
            return { ...step, status: 'active' }
          case 'confirming':
            return { ...step, status: 'active', hash: transactionState.hash }
          case 'success':
            return { 
              ...step, 
              status: 'completed', 
              hash: transactionState.hash,
              gasUsed: transactionState.gasUsed 
            }
          case 'error':
            return { 
              ...step, 
              status: 'failed', 
              error: transactionState.error?.message 
            }
          default:
            return step
        }
      }
      return step
    }))
  }, [transactionState, currentStepIndex, steps.length])

  // Handle transaction completion
  useEffect(() => {
    if (transactionState.status === 'success' && transactionState.hash) {
      const newTransaction = {
        hash: transactionState.hash,
        gasUsed: transactionState.gasUsed
      }
      
      setCompletedTransactions(prev => [...prev, newTransaction])
      
      // Move to next step or complete
      if (currentStepIndex < steps.length - 1) {
        setCurrentStepIndex(prev => prev + 1)
        reset()
      } else {
        onComplete([...completedTransactions, newTransaction])
      }
    }
  }, [transactionState.status, transactionState.hash, transactionState.gasUsed, currentStepIndex, steps.length, completedTransactions, onComplete, reset])

  // Handle transaction error
  useEffect(() => {
    if (transactionState.status === 'error') {
      onError(transactionState.error, currentStepIndex)
    }
  }, [transactionState.status, transactionState.error, currentStepIndex, onError])

  const executeStep = useCallback(async (stepIndex: number, contractConfig: any) => {
    if (!isWalletReady) {
      throw new Error('Wallet not ready')
    }

    setCurrentStepIndex(stepIndex)
    await executeTransaction(contractConfig)
  }, [isWalletReady, executeTransaction])

  const retryCurrentStep = useCallback(() => {
    reset()
    setSteps(prev => prev.map((step, index) => 
      index === currentStepIndex 
        ? { ...step, status: 'pending', error: undefined }
        : step
    ))
  }, [currentStepIndex, reset])

  const getStepIcon = (step: TransactionStep) => {
    switch (step.status) {
      case 'completed':
        return <CheckCircle className="w-5 h-5 text-green-600" />
      case 'failed':
        return <AlertCircle className="w-5 h-5 text-red-600" />
      case 'active':
        return <LoadingSpinner size="sm" color="blue" />
      default:
        return <Clock className="w-5 h-5 text-gray-400" />
    }
  }

  const getStepColor = (step: TransactionStep) => {
    switch (step.status) {
      case 'completed':
        return 'border-green-200 bg-green-50'
      case 'failed':
        return 'border-red-200 bg-red-50'
      case 'active':
        return 'border-blue-200 bg-blue-50'
      default:
        return 'border-gray-200 bg-gray-50'
    }
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Transaction Steps */}
      <div className="space-y-3">
        {steps.map((step, index) => (
          <motion.div
            key={step.id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.1 }}
            className={`p-4 border rounded-lg transition-all duration-200 ${getStepColor(step)}`}
          >
            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0 mt-0.5">
                {getStepIcon(step)}
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <h4 className="font-medium text-gray-900">{step.title}</h4>
                  <span className="text-xs text-gray-500">
                    Step {index + 1} of {steps.length}
                  </span>
                </div>
                
                <p className="text-sm text-gray-600 mt-1">{step.description}</p>
                
                {/* Transaction Hash */}
                {step.hash && (
                  <div className="mt-2 flex items-center space-x-2">
                    <ExternalLink className="w-3 h-3 text-gray-400" />
                    <a
                      href={`https://basescan.org/tx/${step.hash}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-blue-600 hover:text-blue-800 underline"
                    >
                      View Transaction
                    </a>
                  </div>
                )}
                
                {/* Gas Used */}
                {step.gasUsed && (
                  <div className="mt-1 flex items-center space-x-2">
                    <Zap className="w-3 h-3 text-gray-400" />
                    <span className="text-xs text-gray-500">
                      Gas Used: {step.gasUsed.toString()}
                    </span>
                  </div>
                )}
                
                {/* Error Message */}
                {step.error && (
                  <div className="mt-2 p-2 bg-red-100 border border-red-200 rounded text-xs text-red-800">
                    {step.error}
                  </div>
                )}
                
                {/* Retry Button */}
                {step.status === 'failed' && index === currentStepIndex && (
                  <button
                    onClick={retryCurrentStep}
                    className="mt-2 inline-flex items-center px-3 py-1 text-xs font-medium text-red-800 bg-red-100 hover:bg-red-200 rounded-md transition-colors"
                  >
                    <RefreshCw className="w-3 h-3 mr-1" />
                    Retry
                  </button>
                )}
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Overall Progress */}
      <div className="mt-6">
        <div className="flex justify-between text-sm text-gray-600 mb-2">
          <span>Transaction Progress</span>
          <span>{completedTransactions.length} of {steps.length} completed</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <motion.div
            className="bg-blue-600 h-2 rounded-full"
            initial={{ width: 0 }}
            animate={{ 
              width: `${(completedTransactions.length / steps.length) * 100}%` 
            }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
          />
        </div>
      </div>

      {/* Wallet Status */}
      {!isWalletReady && (
        <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
          <div className="flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 text-yellow-600" />
            <span className="text-sm text-yellow-800">
              Wallet not ready. Please connect your wallet and switch to the correct network.
            </span>
          </div>
        </div>
      )}
    </div>
  )
}

// Transaction confirmation modal
interface TransactionConfirmationModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
  transaction: {
    title: string
    description: string
    estimatedGas?: string
    estimatedCost?: string
    recipient?: string
    amount?: string
  }
  isLoading?: boolean
}

export const TransactionConfirmationModal: React.FC<TransactionConfirmationModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  transaction,
  isLoading = false
}) => {
  const { walletState } = useWalletState()

  if (!isOpen) return null

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="bg-white rounded-lg shadow-xl max-w-md w-full p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Confirm Transaction</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
            disabled={isLoading}
          >
            ×
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <h4 className="font-medium text-gray-900">{transaction.title}</h4>
            <p className="text-sm text-gray-600 mt-1">{transaction.description}</p>
          </div>

          {/* Transaction Details */}
          <div className="bg-gray-50 rounded-lg p-4 space-y-3">
            {transaction.recipient && (
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">To:</span>
                <span className="font-mono text-gray-900">
                  {transaction.recipient.slice(0, 6)}...{transaction.recipient.slice(-4)}
                </span>
              </div>
            )}
            
            {transaction.amount && (
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Amount:</span>
                <span className="font-medium text-gray-900">{transaction.amount}</span>
              </div>
            )}
            
            {transaction.estimatedGas && (
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Estimated Gas:</span>
                <span className="text-gray-900">{transaction.estimatedGas}</span>
              </div>
            )}
            
            {transaction.estimatedCost && (
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Estimated Cost:</span>
                <span className="text-gray-900">{transaction.estimatedCost}</span>
              </div>
            )}
          </div>

          {/* Wallet Info */}
          <div className="bg-blue-50 rounded-lg p-3">
            <div className="text-sm text-blue-800">
              <div>From: {walletState.address?.slice(0, 6)}...{walletState.address?.slice(-4)}</div>
              <div>ETH Balance: {walletState.balance?.eth}</div>
              <div>USDC Balance: {walletState.balance?.usdc}</div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex space-x-3 pt-4">
            <button
              onClick={onClose}
              disabled={isLoading}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={onConfirm}
              disabled={isLoading}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isLoading ? (
                <>
                  <LoadingSpinner size="sm" color="blue" className="mr-2" />
                  Confirming...
                </>
              ) : (
                'Confirm'
              )}
            </button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  )
}

// Hook for managing multi-step transactions
export const useMultiStepTransaction = () => {
  const [isExecuting, setIsExecuting] = useState(false)
  const [currentStep, setCurrentStep] = useState(0)
  const [completedSteps, setCompletedSteps] = useState<string[]>([])
  const [error, setError] = useState<string | null>(null)

  const executeSteps = useCallback(async (
    steps: Array<{
      id: string
      execute: () => Promise<{ hash: string; gasUsed?: bigint }>
    }>,
    onProgress?: (stepIndex: number, result: { hash: string; gasUsed?: bigint }) => void,
    onComplete?: (results: { hash: string; gasUsed?: bigint }[]) => void
  ) => {
    setIsExecuting(true)
    setError(null)
    setCurrentStep(0)
    setCompletedSteps([])

    const results: { hash: string; gasUsed?: bigint }[] = []

    try {
      for (let i = 0; i < steps.length; i++) {
        setCurrentStep(i)
        const result = await steps[i].execute()
        results.push(result)
        setCompletedSteps(prev => [...prev, steps[i].id])
        onProgress?.(i, result)
      }

      onComplete?.(results)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Transaction failed')
      throw err
    } finally {
      setIsExecuting(false)
    }
  }, [])

  const reset = useCallback(() => {
    setIsExecuting(false)
    setCurrentStep(0)
    setCompletedSteps([])
    setError(null)
  }, [])

  return {
    isExecuting,
    currentStep,
    completedSteps,
    error,
    executeSteps,
    reset
  }
}

export default {
  Web3TransactionHandler,
  TransactionConfirmationModal,
  useMultiStepTransaction
}