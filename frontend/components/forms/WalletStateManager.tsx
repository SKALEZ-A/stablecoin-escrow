import React, { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { useAccount, useConnect, useDisconnect, useBalance, useChainId, useSwitchChain } from 'wagmi'
import { motion, AnimatePresence } from 'framer-motion'
import { Wallet, AlertTriangle, CheckCircle, RefreshCw, ExternalLink } from 'lucide-react'
import { USDC_CONTRACT } from '../../lib/contracts'

interface WalletState {
  isConnected: boolean
  address?: string
  balance?: {
    eth: string
    usdc: string
  }
  chainId?: number
  isCorrectNetwork: boolean
  isLoading: boolean
  error?: string
}

interface WalletContextType {
  walletState: WalletState
  connectWallet: () => Promise<void>
  disconnectWallet: () => void
  switchToCorrectNetwork: () => Promise<void>
  refreshBalance: () => Promise<void>
  isWalletReady: boolean
  requiredChainId: number
}

const WalletContext = createContext<WalletContextType | undefined>(undefined)

interface WalletProviderProps {
  children: React.ReactNode
  requiredChainId?: number
}

export const WalletProvider: React.FC<WalletProviderProps> = ({
  children,
  requiredChainId = 8453 // Base mainnet
}) => {
  const { address, isConnected } = useAccount()
  const { connect, connectors, isPending: isConnecting } = useConnect()
  const { disconnect } = useDisconnect()
  const chainId = useChainId()
  const { switchChain } = useSwitchChain()

  // ETH balance
  const { data: ethBalance, refetch: refetchEthBalance } = useBalance({
    address: address,
  })

  // USDC balance
  const { data: usdcBalance, refetch: refetchUsdcBalance } = useBalance({
    address: address,
    token: USDC_CONTRACT.address,
  })

  const [walletState, setWalletState] = useState<WalletState>({
    isConnected: false,
    isCorrectNetwork: false,
    isLoading: false
  })

  // Update wallet state when account changes
  useEffect(() => {
    setWalletState(prev => ({
      ...prev,
      isConnected,
      address,
      chainId,
      isCorrectNetwork: chainId === requiredChainId,
      balance: {
        eth: ethBalance ? parseFloat(ethBalance.formatted).toFixed(4) : '0',
        usdc: usdcBalance ? parseFloat(usdcBalance.formatted).toFixed(2) : '0'
      }
    }))
  }, [isConnected, address, chainId, requiredChainId, ethBalance, usdcBalance])

  // Connect wallet
  const connectWallet = useCallback(async () => {
    try {
      setWalletState(prev => ({ ...prev, isLoading: true, error: undefined }))
      
      const connector = connectors[0] // Use first available connector (usually MetaMask)
      if (connector) {
        await connect({ connector })
      } else {
        throw new Error('No wallet connector available')
      }
    } catch (error) {
      setWalletState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Failed to connect wallet'
      }))
    } finally {
      setWalletState(prev => ({ ...prev, isLoading: false }))
    }
  }, [connect, connectors])

  // Disconnect wallet
  const disconnectWallet = useCallback(() => {
    disconnect()
    setWalletState({
      isConnected: false,
      isCorrectNetwork: false,
      isLoading: false
    })
  }, [disconnect])

  // Switch to correct network
  const switchToCorrectNetwork = useCallback(async () => {
    try {
      setWalletState(prev => ({ ...prev, isLoading: true, error: undefined }))
      await switchChain({ chainId: requiredChainId })
    } catch (error) {
      setWalletState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Failed to switch network'
      }))
    } finally {
      setWalletState(prev => ({ ...prev, isLoading: false }))
    }
  }, [switchChain, requiredChainId])

  // Refresh balances
  const refreshBalance = useCallback(async () => {
    try {
      setWalletState(prev => ({ ...prev, isLoading: true }))
      await Promise.all([refetchEthBalance(), refetchUsdcBalance()])
    } catch (error) {
      console.error('Failed to refresh balance:', error)
    } finally {
      setWalletState(prev => ({ ...prev, isLoading: false }))
    }
  }, [refetchEthBalance, refetchUsdcBalance])

  const isWalletReady = isConnected && walletState.isCorrectNetwork

  const contextValue: WalletContextType = {
    walletState,
    connectWallet,
    disconnectWallet,
    switchToCorrectNetwork,
    refreshBalance,
    isWalletReady,
    requiredChainId
  }

  return (
    <WalletContext.Provider value={contextValue}>
      {children}
    </WalletContext.Provider>
  )
}

// Hook to use wallet context
export const useWalletState = () => {
  const context = useContext(WalletContext)
  if (context === undefined) {
    throw new Error('useWalletState must be used within a WalletProvider')
  }
  return context
}

// Wallet connection guard component
interface WalletGuardProps {
  children: React.ReactNode
  fallback?: React.ReactNode
  requireNetwork?: boolean
  requireBalance?: {
    eth?: string
    usdc?: string
  }
}

export const WalletGuard: React.FC<WalletGuardProps> = ({
  children,
  fallback,
  requireNetwork = true,
  requireBalance
}) => {
  const { walletState, isWalletReady } = useWalletState()

  // Check balance requirements
  const hasRequiredBalance = useCallback(() => {
    if (!requireBalance) return true
    
    const ethBalance = parseFloat(walletState.balance?.eth || '0')
    const usdcBalance = parseFloat(walletState.balance?.usdc || '0')
    
    if (requireBalance.eth && ethBalance < parseFloat(requireBalance.eth)) {
      return false
    }
    
    if (requireBalance.usdc && usdcBalance < parseFloat(requireBalance.usdc)) {
      return false
    }
    
    return true
  }, [walletState.balance, requireBalance])

  const shouldShowChildren = walletState.isConnected && 
    (!requireNetwork || walletState.isCorrectNetwork) && 
    hasRequiredBalance()

  if (shouldShowChildren) {
    return <>{children}</>
  }

  if (fallback) {
    return <>{fallback}</>
  }

  return <WalletConnectionPrompt requireBalance={requireBalance} />
}

// Wallet connection prompt component
interface WalletConnectionPromptProps {
  requireBalance?: {
    eth?: string
    usdc?: string
  }
  className?: string
}

export const WalletConnectionPrompt: React.FC<WalletConnectionPromptProps> = ({
  requireBalance,
  className = ''
}) => {
  const { 
    walletState, 
    connectWallet, 
    switchToCorrectNetwork, 
    refreshBalance,
    requiredChainId 
  } = useWalletState()

  const getNetworkName = (chainId: number) => {
    switch (chainId) {
      case 1: return 'Ethereum Mainnet'
      case 8453: return 'Base'
      case 84531: return 'Base Goerli'
      default: return `Chain ${chainId}`
    }
  }

  const getPromptContent = () => {
    if (!walletState.isConnected) {
      return {
        icon: <Wallet className="w-8 h-8 text-blue-600" />,
        title: 'Connect Your Wallet',
        message: 'Please connect your wallet to continue with this transaction.',
        action: (
          <button
            onClick={connectWallet}
            disabled={walletState.isLoading}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
          >
            {walletState.isLoading ? (
              <>
                <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                Connecting...
              </>
            ) : (
              <>
                <Wallet className="w-4 h-4 mr-2" />
                Connect Wallet
              </>
            )}
          </button>
        )
      }
    }

    if (!walletState.isCorrectNetwork) {
      return {
        icon: <AlertTriangle className="w-8 h-8 text-yellow-600" />,
        title: 'Wrong Network',
        message: `Please switch to ${getNetworkName(requiredChainId)} to continue.`,
        action: (
          <button
            onClick={switchToCorrectNetwork}
            disabled={walletState.isLoading}
            className="px-6 py-3 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
          >
            {walletState.isLoading ? (
              <>
                <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                Switching...
              </>
            ) : (
              `Switch to ${getNetworkName(requiredChainId)}`
            )}
          </button>
        )
      }
    }

    // Check balance requirements
    if (requireBalance) {
      const ethBalance = parseFloat(walletState.balance?.eth || '0')
      const usdcBalance = parseFloat(walletState.balance?.usdc || '0')
      
      if (requireBalance.eth && ethBalance < parseFloat(requireBalance.eth)) {
        return {
          icon: <AlertTriangle className="w-8 h-8 text-red-600" />,
          title: 'Insufficient ETH Balance',
          message: `You need at least ${requireBalance.eth} ETH for gas fees. Current balance: ${walletState.balance?.eth} ETH`,
          action: (
            <div className="space-y-3">
              <button
                onClick={refreshBalance}
                disabled={walletState.isLoading}
                className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Refresh Balance
              </button>
              <p className="text-sm text-gray-600">
                Add ETH to your wallet and refresh to continue.
              </p>
            </div>
          )
        }
      }
      
      if (requireBalance.usdc && usdcBalance < parseFloat(requireBalance.usdc)) {
        return {
          icon: <AlertTriangle className="w-8 h-8 text-red-600" />,
          title: 'Insufficient USDC Balance',
          message: `You need at least ${requireBalance.usdc} USDC for this transaction. Current balance: ${walletState.balance?.usdc} USDC`,
          action: (
            <div className="space-y-3">
              <button
                onClick={refreshBalance}
                disabled={walletState.isLoading}
                className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Refresh Balance
              </button>
              <a
                href="/mint-usdc"
                className="inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                <ExternalLink className="w-4 h-4 mr-2" />
                Get USDC
              </a>
            </div>
          )
        }
      }
    }

    return {
      icon: <CheckCircle className="w-8 h-8 text-green-600" />,
      title: 'Wallet Connected',
      message: 'Your wallet is connected and ready.',
      action: null
    }
  }

  const content = getPromptContent()

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`bg-white border border-gray-200 rounded-lg p-8 text-center ${className}`}
    >
      <div className="flex flex-col items-center space-y-4">
        {content.icon}
        <h3 className="text-xl font-semibold text-gray-900">{content.title}</h3>
        <p className="text-gray-600 max-w-md">{content.message}</p>
        
        {content.action && (
          <div className="mt-6">
            {content.action}
          </div>
        )}

        {walletState.error && (
          <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-800">{walletState.error}</p>
          </div>
        )}

        {walletState.isConnected && (
          <div className="mt-6 p-4 bg-gray-50 rounded-lg">
            <div className="text-sm text-gray-600 space-y-1">
              <div>Address: {walletState.address?.slice(0, 6)}...{walletState.address?.slice(-4)}</div>
              <div>Network: {getNetworkName(walletState.chainId || 0)}</div>
              {walletState.balance && (
                <>
                  <div>ETH Balance: {walletState.balance.eth}</div>
                  <div>USDC Balance: {walletState.balance.usdc}</div>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </motion.div>
  )
}

// Wallet status indicator component
export const WalletStatusIndicator: React.FC<{ className?: string }> = ({ className = '' }) => {
  const { walletState, isWalletReady } = useWalletState()

  if (!walletState.isConnected) {
    return (
      <div className={`flex items-center space-x-2 text-gray-500 ${className}`}>
        <div className="w-2 h-2 bg-gray-400 rounded-full" />
        <span className="text-sm">Not Connected</span>
      </div>
    )
  }

  if (!walletState.isCorrectNetwork) {
    return (
      <div className={`flex items-center space-x-2 text-yellow-600 ${className}`}>
        <div className="w-2 h-2 bg-yellow-500 rounded-full animate-pulse" />
        <span className="text-sm">Wrong Network</span>
      </div>
    )
  }

  return (
    <div className={`flex items-center space-x-2 text-green-600 ${className}`}>
      <div className="w-2 h-2 bg-green-500 rounded-full" />
      <span className="text-sm">Connected</span>
    </div>
  )
}

// Hook for wallet-dependent form validation
export const useWalletValidation = () => {
  const { walletState, isWalletReady } = useWalletState()

  const validateWalletRequirements = useCallback((requirements?: {
    eth?: string
    usdc?: string
  }) => {
    const errors: string[] = []

    if (!walletState.isConnected) {
      errors.push('Wallet must be connected')
    }

    if (!walletState.isCorrectNetwork) {
      errors.push('Please switch to the correct network')
    }

    if (requirements && walletState.balance) {
      const ethBalance = parseFloat(walletState.balance.eth)
      const usdcBalance = parseFloat(walletState.balance.usdc)

      if (requirements.eth && ethBalance < parseFloat(requirements.eth)) {
        errors.push(`Insufficient ETH balance (need ${requirements.eth}, have ${walletState.balance.eth})`)
      }

      if (requirements.usdc && usdcBalance < parseFloat(requirements.usdc)) {
        errors.push(`Insufficient USDC balance (need ${requirements.usdc}, have ${walletState.balance.usdc})`)
      }
    }

    return {
      isValid: errors.length === 0,
      errors
    }
  }, [walletState])

  return {
    validateWalletRequirements,
    isWalletReady,
    walletState
  }
}

export default {
  WalletProvider,
  WalletGuard,
  WalletConnectionPrompt,
  WalletStatusIndicator,
  useWalletState,
  useWalletValidation
}