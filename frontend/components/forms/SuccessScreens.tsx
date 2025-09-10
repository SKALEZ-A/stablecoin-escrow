import React from 'react'
import { motion } from 'framer-motion'
import { CheckCircle, ExternalLink, ArrowLeft, Share2, Copy, Download, Eye } from 'lucide-react'
import { ResponsiveContainer, ResponsiveStack, TouchFriendly, useResponsive } from './ResponsiveLayout'

interface ListingSuccessProps {
  transactionHash: string
  listingData: {
    title: string
    price: string
    category: string
    description?: string
    creatorAddress: string
  }
  onBackToMarketplace: () => void
  onCreateAnother: () => void
  className?: string
}

export const ListingSuccessScreen: React.FC<ListingSuccessProps> = ({
  transactionHash,
  listingData,
  onBackToMarketplace,
  onCreateAnother,
  className = ''
}) => {
  const { isMobile } = useResponsive()
  const [copied, setCopied] = React.useState(false)

  const copyTransactionHash = async () => {
    try {
      await navigator.clipboard.writeText(transactionHash)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error('Failed to copy transaction hash:', err)
    }
  }

  const shareUrl = `${window.location.origin}/item/${transactionHash}`

  const shareItem = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: listingData.title,
          text: `Check out my listing: ${listingData.title}`,
          url: shareUrl
        })
      } catch (err) {
        console.error('Error sharing:', err)
      }
    } else {
      // Fallback to copying URL
      try {
        await navigator.clipboard.writeText(shareUrl)
        alert('Link copied to clipboard!')
      } catch (err) {
        console.error('Failed to copy URL:', err)
      }
    }
  }

  return (
    <ResponsiveContainer maxWidth="lg" className={className}>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-lg shadow-lg overflow-hidden"
      >
        {/* Success Header */}
        <div className="bg-gradient-to-r from-green-500 to-emerald-600 px-6 py-8 text-white text-center">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
          >
            <CheckCircle className="w-16 h-16 mx-auto mb-4" />
          </motion.div>
          <h1 className="text-2xl md:text-3xl font-bold mb-2">
            🎉 Listing Created Successfully!
          </h1>
          <p className="text-green-100">
            Your item is now live on the marketplace and ready for buyers
          </p>
        </div>

        <div className="p-6 space-y-6">
          {/* Listing Summary */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-gray-50 rounded-lg p-6"
          >
            <h2 className="text-lg font-semibold text-gray-900 mb-4">📋 Listing Summary</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h3 className="font-medium text-gray-900 mb-2">{listingData.title}</h3>
                {listingData.description && (
                  <p className="text-sm text-gray-600 mb-3 line-clamp-3">
                    {listingData.description}
                  </p>
                )}
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Price:</span>
                    <span className="font-semibold text-green-600">{listingData.price} USDC</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Category:</span>
                    <span className="font-medium">{listingData.category}</span>
                  </div>
                </div>
              </div>
              
              <div className="space-y-3">
                <div>
                  <span className="text-sm text-gray-600">Creator Address:</span>
                  <div className="font-mono text-sm bg-white p-2 rounded border mt-1">
                    {listingData.creatorAddress}
                  </div>
                </div>
                
                <div>
                  <span className="text-sm text-gray-600">Transaction Hash:</span>
                  <div className="flex items-center space-x-2 mt-1">
                    <div className="font-mono text-sm bg-white p-2 rounded border flex-1 truncate">
                      {transactionHash}
                    </div>
                    <TouchFriendly>
                      <button
                        onClick={copyTransactionHash}
                        className="p-2 text-gray-500 hover:text-gray-700 transition-colors"
                        title="Copy transaction hash"
                      >
                        {copied ? <CheckCircle className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4" />}
                      </button>
                    </TouchFriendly>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Transaction Details */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4 }}
            className="bg-blue-50 border border-blue-200 rounded-lg p-6"
          >
            <h2 className="text-lg font-semibold text-blue-900 mb-4">🔗 Transaction Details</h2>
            
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-blue-800">Status:</span>
                <span className="flex items-center text-green-600 font-medium">
                  <CheckCircle className="w-4 h-4 mr-1" />
                  Confirmed
                </span>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-blue-800">Network:</span>
                <span className="text-blue-900 font-medium">Base</span>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-blue-800">Block Explorer:</span>
                <a
                  href={`https://basescan.org/tx/${transactionHash}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center text-blue-600 hover:text-blue-800 font-medium"
                >
                  View on BaseScan
                  <ExternalLink className="w-4 h-4 ml-1" />
                </a>
              </div>
            </div>
          </motion.div>

          {/* Next Steps */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="bg-yellow-50 border border-yellow-200 rounded-lg p-6"
          >
            <h2 className="text-lg font-semibold text-yellow-900 mb-4">🚀 What's Next?</h2>
            
            <div className="space-y-3 text-sm text-yellow-800">
              <div className="flex items-start space-x-2">
                <Eye className="w-4 h-4 mt-0.5 flex-shrink-0" />
                <span>Your listing is now visible to all marketplace visitors</span>
              </div>
              <div className="flex items-start space-x-2">
                <Share2 className="w-4 h-4 mt-0.5 flex-shrink-0" />
                <span>Share your listing with potential buyers to increase visibility</span>
              </div>
              <div className="flex items-start space-x-2">
                <CheckCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                <span>You'll receive payments directly to your wallet when items are purchased</span>
              </div>
            </div>
          </motion.div>

          {/* Action Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
          >
            <ResponsiveStack 
              direction={{ xs: 'col', sm: 'row' }} 
              spacing={4}
              className="pt-4"
            >
              <TouchFriendly className="flex-1">
                <button
                  onClick={shareItem}
                  className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium flex items-center justify-center"
                >
                  <Share2 className="w-4 h-4 mr-2" />
                  Share Listing
                </button>
              </TouchFriendly>
              
              <TouchFriendly className="flex-1">
                <button
                  onClick={onCreateAnother}
                  className="w-full px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium"
                >
                  Create Another Listing
                </button>
              </TouchFriendly>
              
              <TouchFriendly className="flex-1">
                <button
                  onClick={onBackToMarketplace}
                  className="w-full px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium flex items-center justify-center"
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back to Marketplace
                </button>
              </TouchFriendly>
            </ResponsiveStack>
          </motion.div>

          {/* Tips */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.7 }}
            className="bg-gray-50 rounded-lg p-4"
          >
            <h3 className="font-medium text-gray-900 mb-2">💡 Pro Tips</h3>
            <ul className="text-sm text-gray-600 space-y-1">
              <li>• Promote your listing on social media to reach more buyers</li>
              <li>• Consider offering limited-time discounts to attract early buyers</li>
              <li>• Respond quickly to buyer inquiries to build trust</li>
              <li>• Keep your listing updated with accurate information</li>
            </ul>
          </motion.div>
        </div>
      </motion.div>
    </ResponsiveContainer>
  )
}

interface PurchaseSuccessProps {
  transactionHash: string
  purchaseData: {
    itemTitle: string
    price: string
    seller: string
    itemId: string
  }
  onBackToMarketplace: () => void
  onViewItem: () => void
  className?: string
}

export const PurchaseSuccessScreen: React.FC<PurchaseSuccessProps> = ({
  transactionHash,
  purchaseData,
  onBackToMarketplace,
  onViewItem,
  className = ''
}) => {
  const { isMobile } = useResponsive()
  const [copied, setCopied] = React.useState(false)

  const copyTransactionHash = async () => {
    try {
      await navigator.clipboard.writeText(transactionHash)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error('Failed to copy transaction hash:', err)
    }
  }

  const downloadReceipt = () => {
    const receiptData = {
      transactionHash,
      ...purchaseData,
      timestamp: new Date().toISOString(),
      network: 'Base'
    }
    
    const dataStr = JSON.stringify(receiptData, null, 2)
    const dataBlob = new Blob([dataStr], { type: 'application/json' })
    const url = URL.createObjectURL(dataBlob)
    
    const link = document.createElement('a')
    link.href = url
    link.download = `receipt-${purchaseData.itemId}-${Date.now()}.json`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  return (
    <ResponsiveContainer maxWidth="lg" className={className}>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-lg shadow-lg overflow-hidden"
      >
        {/* Success Header */}
        <div className="bg-gradient-to-r from-blue-500 to-purple-600 px-6 py-8 text-white text-center">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
          >
            <CheckCircle className="w-16 h-16 mx-auto mb-4" />
          </motion.div>
          <h1 className="text-2xl md:text-3xl font-bold mb-2">
            🎊 Purchase Successful!
          </h1>
          <p className="text-blue-100">
            You now own "{purchaseData.itemTitle}"
          </p>
        </div>

        <div className="p-6 space-y-6">
          {/* Purchase Receipt */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-gray-50 rounded-lg p-6"
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">🧾 Purchase Receipt</h2>
              <TouchFriendly>
                <button
                  onClick={downloadReceipt}
                  className="flex items-center text-sm text-blue-600 hover:text-blue-800"
                >
                  <Download className="w-4 h-4 mr-1" />
                  Download
                </button>
              </TouchFriendly>
            </div>
            
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h3 className="font-medium text-gray-900 mb-2">{purchaseData.itemTitle}</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Item ID:</span>
                      <span className="font-mono">#{purchaseData.itemId}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Price Paid:</span>
                      <span className="font-semibold text-green-600">{purchaseData.price} USDC</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Seller:</span>
                      <span className="font-mono text-xs">
                        {purchaseData.seller.slice(0, 6)}...{purchaseData.seller.slice(-4)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Purchase Date:</span>
                      <span>{new Date().toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>
                
                <div>
                  <span className="text-sm text-gray-600">Transaction Hash:</span>
                  <div className="flex items-center space-x-2 mt-1">
                    <div className="font-mono text-xs bg-white p-2 rounded border flex-1 truncate">
                      {transactionHash}
                    </div>
                    <TouchFriendly>
                      <button
                        onClick={copyTransactionHash}
                        className="p-2 text-gray-500 hover:text-gray-700 transition-colors"
                        title="Copy transaction hash"
                      >
                        {copied ? <CheckCircle className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4" />}
                      </button>
                    </TouchFriendly>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Ownership Transfer */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4 }}
            className="bg-green-50 border border-green-200 rounded-lg p-6"
          >
            <h2 className="text-lg font-semibold text-green-900 mb-4">🔄 Ownership Transfer</h2>
            
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-green-800">Status:</span>
                <span className="flex items-center text-green-600 font-medium">
                  <CheckCircle className="w-4 h-4 mr-1" />
                  Transfer Complete
                </span>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-green-800">Blockchain Record:</span>
                <a
                  href={`https://basescan.org/tx/${transactionHash}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center text-green-600 hover:text-green-800 font-medium"
                >
                  View on BaseScan
                  <ExternalLink className="w-4 h-4 ml-1" />
                </a>
              </div>
              
              <div className="bg-white rounded p-3 mt-3">
                <p className="text-sm text-green-800">
                  ✅ The ownership of this item has been permanently recorded on the blockchain. 
                  You are now the verified owner of "{purchaseData.itemTitle}".
                </p>
              </div>
            </div>
          </motion.div>

          {/* Next Steps */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="bg-blue-50 border border-blue-200 rounded-lg p-6"
          >
            <h2 className="text-lg font-semibold text-blue-900 mb-4">📋 What's Next?</h2>
            
            <div className="space-y-3 text-sm text-blue-800">
              <div className="flex items-start space-x-2">
                <CheckCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                <span>Access your purchased item from your dashboard</span>
              </div>
              <div className="flex items-start space-x-2">
                <Download className="w-4 h-4 mt-0.5 flex-shrink-0" />
                <span>Download any digital assets or access instructions</span>
              </div>
              <div className="flex items-start space-x-2">
                <ExternalLink className="w-4 h-4 mt-0.5 flex-shrink-0" />
                <span>Contact the seller if you need support or have questions</span>
              </div>
            </div>
          </motion.div>

          {/* Action Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
          >
            <ResponsiveStack 
              direction={{ xs: 'col', sm: 'row' }} 
              spacing={4}
              className="pt-4"
            >
              <TouchFriendly className="flex-1">
                <button
                  onClick={onViewItem}
                  className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium flex items-center justify-center"
                >
                  <Eye className="w-4 h-4 mr-2" />
                  View Item
                </button>
              </TouchFriendly>
              
              <TouchFriendly className="flex-1">
                <button
                  onClick={onBackToMarketplace}
                  className="w-full px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium flex items-center justify-center"
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back to Marketplace
                </button>
              </TouchFriendly>
            </ResponsiveStack>
          </motion.div>
        </div>
      </motion.div>
    </ResponsiveContainer>
  )
}

export default {
  ListingSuccessScreen,
  PurchaseSuccessScreen
}