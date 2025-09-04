import { useState } from 'react'
import { ConnectButton } from '@rainbow-me/rainbowkit'
import { useAccount } from 'wagmi'
import ListItem from '../components/ListItem'
import BuyItem from '../components/BuyItem'
import ItemList from '../components/ItemList'

export default function Home() {
  const { isConnected } = useAccount()
  const [activeTab, setActiveTab] = useState<'buy' | 'sell'>('buy')

  return (
    <div className="min-h-screen bg-gradient-to-br from-base-light to-white">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <header className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl font-bold text-gray-900">
              Escrow Marketplace
            </h1>
            <p className="text-gray-600 mt-2">
              Secure payments on Base with USDC
            </p>
          </div>
          <ConnectButton />
        </header>

        {!isConnected ? (
          <div className="text-center py-20">
            <div className="bg-white rounded-lg shadow-lg p-8 max-w-md mx-auto">
              <h2 className="text-2xl font-semibold mb-4">Welcome!</h2>
              <p className="text-gray-600 mb-6">
                Connect your wallet to start buying and selling items securely.
              </p>
              <ConnectButton />
            </div>
          </div>
        ) : (
          <div className="space-y-8">
            {/* Tab Navigation */}
            <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg max-w-md">
              <button
                onClick={() => setActiveTab('buy')}
                className={`flex-1 py-2 px-4 rounded-md font-medium transition-colors ${
                  activeTab === 'buy'
                    ? 'bg-white text-base-blue shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Buy Items
              </button>
              <button
                onClick={() => setActiveTab('sell')}
                className={`flex-1 py-2 px-4 rounded-md font-medium transition-colors ${
                  activeTab === 'sell'
                    ? 'bg-white text-base-blue shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Sell Items
              </button>
            </div>

            {/* Content */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div>
                {activeTab === 'sell' ? (
                  <ListItem />
                ) : (
                  <BuyItem />
                )}
              </div>
              <div>
                <ItemList />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}