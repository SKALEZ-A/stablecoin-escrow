import { useState, useCallback, useEffect, useRef } from 'react'
import { useAccount, useWriteContract, useWaitForTransactionReceipt, useEstimateGas, useGasPrice } from 'wagmi'
import { TransactionState, ErrorRecoveryConfig } from '../types'
import { errorRecoveryMap } from '../schemas'

interface ContractCallConfig {
  address: `0x${string}`
  abi: any[]
  functionName: string
  args?: any[]
  value?: bigint
}

interface TransactionOptions {
  onSuccess?: (result: any) => void
  onError?: (error: any) => void
  onConfirmation?: (confirmations: number) => void
  maxRetries?: number
  retryDelay?: number
  gasMultiplier?: number
  enableRetry?: boolean
}

interface ExtendedTransactionState extends TransactionState {
  retryCount: number
  lastRetryAt?: Date
  gasEstimate?: bigint
  gasPrice?: bigint
  estimatedCost?: string
}

export const useContractInteraction = () => {
  const { address, isConnected } = useAccount()
  const { writeContract, data: hash, isPending, error: writeError } = useWriteContract()
  const { isLoading: isConfirming, isSuccess: isConfirmed, error: receiptError } = useWaitForTransactionReceipt({
    hash,
  })
  const { data: gasPrice } = useGasPrice()

  const [transactionState, setTransactionState] = useState<ExtendedTransactionState>({
    status: 'idle',
    retryCount: 0
  })

  const [pendingTransaction, setPendingTransaction] = useState<{
    config: ContractCallConfig
    options: TransactionOptions
  } | null>(null)

  const retryTimeoutRef = useRef<NodeJS.Timeout>()

  // Gas estimation hook
  const { data: gasEstimate, error: gasError } = useEstimateGas({
    ...pendingTransaction?.config,
    account: address,
  })

  // Update transaction state based on wagmi hooks
  useEffect(() => {
    if (isPending) {
      setTransactionState(prev => ({
        ...prev,
        status: 'pending'
      }))
    } else if (hash && isConfirming) {
      setTransactionState(prev => ({
        ...prev,
        status: 'confirming',
        hash
      }))
    } else if (hash && isConfirmed) {
      setTransactionState(prev => ({
        ...prev,
        status: 'success',
        hash,
        confirmations: 1
      }))
      
      // Call success callback
      if (pendingTransaction?.options.onSuccess) {
        pendingTransaction.options.onSuccess({ hash })
      }
      
      // Clear pending transaction
      setPendingTransaction(null)
    } else if (writeError || receiptError) {
      const error = writeError || receiptError
      const errorCode = getErrorCode(error)
      const errorConfig = errorRecoveryMap[errorCode]
      
      setTransactionState(prev => ({
        ...prev,
        status: 'error',
        error: {
          code: errorCode,
          message: errorConfig?.userMessage || error?.message || 'Transaction failed',
          details: error
        }
      }))

      // Handle automatic retry for recoverable errors
      if (errorConfig?.retryable && pendingTransaction) {
        const shouldRetry = (transactionState.retryCount < (pendingTransaction.options.maxRetries || errorConfig.maxRetries))
        
        if (shouldRetry && pendingTransaction.options.enableRetry !== false) {
          const retryDelay = pendingTransaction.options.retryDelay || errorConfig.retryDelay
          
          retryTimeoutRef.current = setTimeout(() => {
            retryTransaction()
          }, retryDelay)
        }
      }

      // Call error callback
      if (pendingTransaction?.options.onError) {
        pendingTransaction.options.onError(error)
      }
    }
  }, [isPending, hash, isConfirming, isConfirmed, writeError, receiptError, pendingTransaction, transactionState.retryCount])

  // Update gas estimates
  useEffect(() => {
    if (gasEstimate && gasPrice) {
      const estimatedCost = (gasEstimate * gasPrice).toString()
      setTransactionState(prev => ({
        ...prev,
        gasEstimate,
        gasPrice,
        estimatedCost
      }))
    }
  }, [gasEstimate, gasPrice])

  // Cleanup retry timeout on unmount
  useEffect(() => {
    return () => {
      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current)
      }
    }
  }, [])

  // Execute contract transaction
  const executeTransaction = useCallback(async (
    config: ContractCallConfig,
    options: TransactionOptions = {}
  ) => {
    if (!isConnected || !address) {
      const error = new Error('Wallet not connected')
      setTransactionState(prev => ({
        ...prev,
        status: 'error',
        error: {
          code: 'WALLET_NOT_CONNECTED',
          message: 'Please connect your wallet to continue',
          details: error
        }
      }))
      options.onError?.(error)
      throw error
    }

    try {
      // Reset state and set pending transaction
      setTransactionState(prev => ({
        ...prev,
        status: 'pending',
        error: undefined,
        retryCount: 0
      }))
      
      setPendingTransaction({ config, options })

      // Apply gas multiplier if specified
      const gasMultiplier = options.gasMultiplier || 1.1
      const gas = gasEstimate ? BigInt(Math.floor(Number(gasEstimate) * gasMultiplier)) : undefined

      // Execute the transaction
      writeContract({
        ...config,
        gas,
      })

    } catch (error) {
      const errorCode = getErrorCode(error)
      setTransactionState(prev => ({
        ...prev,
        status: 'error',
        error: {
          code: errorCode,
          message: error instanceof Error ? error.message : 'Transaction failed',
          details: error
        }
      }))
      
      options.onError?.(error)
      throw error
    }
  }, [isConnected, address, writeContract, gasEstimate])

  // Retry failed transaction
  const retryTransaction = useCallback(async () => {
    if (!pendingTransaction) {
      throw new Error('No pending transaction to retry')
    }

    setTransactionState(prev => ({
      ...prev,
      retryCount: prev.retryCount + 1,
      lastRetryAt: new Date(),
      status: 'pending',
      error: undefined
    }))

    try {
      const gasMultiplier = pendingTransaction.options.gasMultiplier || 1.2 // Increase gas on retry
      const gas = gasEstimate ? BigInt(Math.floor(Number(gasEstimate) * gasMultiplier)) : undefined

      writeContract({
        ...pendingTransaction.config,
        gas,
      })
    } catch (error) {
      const errorCode = getErrorCode(error)
      setTransactionState(prev => ({
        ...prev,
        status: 'error',
        error: {
          code: errorCode,
          message: error instanceof Error ? error.message : 'Retry failed',
          details: error
        }
      }))
      throw error
    }
  }, [pendingTransaction, writeContract, gasEstimate])

  // Manual retry function
  const retry = useCallback(async () => {
    if (retryTimeoutRef.current) {
      clearTimeout(retryTimeoutRef.current)
    }
    return retryTransaction()
  }, [retryTransaction])

  // Reset transaction state
  const reset = useCallback(() => {
    if (retryTimeoutRef.current) {
      clearTimeout(retryTimeoutRef.current)
    }
    
    setTransactionState({
      status: 'idle',
      retryCount: 0
    })
    setPendingTransaction(null)
  }, [])

  // Estimate gas for a transaction
  const estimateGas = useCallback(async (config: ContractCallConfig) => {
    if (!isConnected || !address) {
      throw new Error('Wallet not connected')
    }

    try {
      // This would use the gasEstimate from the hook
      return gasEstimate
    } catch (error) {
      console.error('Gas estimation failed:', error)
      throw error
    }
  }, [isConnected, address, gasEstimate])

  // Get transaction status helpers
  const isLoading = transactionState.status === 'pending' || transactionState.status === 'confirming'
  const isSuccess = transactionState.status === 'success'
  const isError = transactionState.status === 'error'
  const canRetry = isError && pendingTransaction && 
    (transactionState.error?.code ? errorRecoveryMap[transactionState.error.code]?.retryable : false)

  return {
    // State
    transactionState,
    isLoading,
    isSuccess,
    isError,
    canRetry,
    
    // Actions
    executeTransaction,
    retry,
    reset,
    estimateGas,
    
    // Transaction details
    hash,
    gasEstimate: transactionState.gasEstimate,
    gasPrice: transactionState.gasPrice,
    estimatedCost: transactionState.estimatedCost,
    retryCount: transactionState.retryCount,
    
    // Wagmi state passthrough
    isPending,
    isConfirming,
    isConfirmed
  }
}

// Helper function to extract error codes from various error types
const getErrorCode = (error: any): string => {
  if (!error) return 'UNKNOWN_ERROR'
  
  // Check for specific error patterns
  if (error.message?.includes('User rejected')) {
    return 'USER_REJECTED'
  }
  
  if (error.message?.includes('insufficient funds')) {
    return 'INSUFFICIENT_BALANCE'
  }
  
  if (error.message?.includes('gas')) {
    if (error.message.includes('insufficient')) {
      return 'INSUFFICIENT_GAS'
    }
    if (error.message.includes('estimation')) {
      return 'GAS_ESTIMATION_FAILED'
    }
    return 'GAS_LIMIT_EXCEEDED'
  }
  
  if (error.message?.includes('network') || error.message?.includes('connection')) {
    return 'NETWORK_ERROR'
  }
  
  if (error.message?.includes('nonce')) {
    return 'NONCE_ERROR'
  }
  
  if (error.message?.includes('revert')) {
    return 'CONTRACT_ERROR'
  }
  
  if (error.code) {
    switch (error.code) {
      case 4001:
        return 'USER_REJECTED'
      case -32000:
        return 'INSUFFICIENT_GAS'
      case -32002:
        return 'TRANSACTION_PENDING'
      case -32003:
        return 'TRANSACTION_FAILED'
      default:
        return 'UNKNOWN_ERROR'
    }
  }
  
  return 'UNKNOWN_ERROR'
}

// Export error code helper for use in components
export { getErrorCode }