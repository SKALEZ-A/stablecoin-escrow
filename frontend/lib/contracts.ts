// Contract addresses - updated for testing with mock USDC
export const ESCROW_CONTRACT = {
  address: '0x3bbB8Ee519D500234D69b9ECC357B63CB52a97D7' as `0x${string}`, // Test Escrow with Mock USDC
  abi: [
    {
      "inputs": [
        {"internalType": "address", "name": "_usdcToken", "type": "address"},
        {"internalType": "uint256", "name": "_platformFeePercent", "type": "uint256"},
        {"internalType": "address", "name": "_admin", "type": "address"}
      ],
      "stateMutability": "nonpayable",
      "type": "constructor"
    },
    {
      "inputs": [
        {"internalType": "address", "name": "_creator", "type": "address"},
        {"internalType": "uint256", "name": "_price", "type": "uint256"},
        {"internalType": "string", "name": "_title", "type": "string"}
      ],
      "name": "listItem",
      "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}],
      "stateMutability": "nonpayable",
      "type": "function"
    },
    {
      "inputs": [{"internalType": "uint256", "name": "_itemId", "type": "uint256"}],
      "name": "buyItem",
      "outputs": [],
      "stateMutability": "nonpayable",
      "type": "function"
    },
    {
      "inputs": [{"internalType": "uint256", "name": "_itemId", "type": "uint256"}],
      "name": "getItem",
      "outputs": [
        {"internalType": "address", "name": "creator", "type": "address"},
        {"internalType": "uint256", "name": "price", "type": "uint256"},
        {"internalType": "string", "name": "title", "type": "string"},
        {"internalType": "bool", "name": "active", "type": "bool"}
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [{"internalType": "uint256", "name": "_price", "type": "uint256"}],
      "name": "calculateFees",
      "outputs": [
        {"internalType": "uint256", "name": "platformFee", "type": "uint256"},
        {"internalType": "uint256", "name": "creatorPayout", "type": "uint256"}
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [],
      "name": "nextItemId",
      "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "anonymous": false,
      "inputs": [
        {"indexed": true, "internalType": "uint256", "name": "itemId", "type": "uint256"},
        {"indexed": true, "internalType": "address", "name": "creator", "type": "address"},
        {"indexed": false, "internalType": "uint256", "name": "price", "type": "uint256"},
        {"indexed": false, "internalType": "string", "name": "title", "type": "string"}
      ],
      "name": "ItemListed",
      "type": "event"
    },
    {
      "anonymous": false,
      "inputs": [
        {"indexed": true, "internalType": "uint256", "name": "itemId", "type": "uint256"},
        {"indexed": true, "internalType": "address", "name": "buyer", "type": "address"},
        {"indexed": true, "internalType": "address", "name": "creator", "type": "address"},
        {"indexed": false, "internalType": "uint256", "name": "totalPrice", "type": "uint256"},
        {"indexed": false, "internalType": "uint256", "name": "platformFee", "type": "uint256"},
        {"indexed": false, "internalType": "uint256", "name": "creatorPayout", "type": "uint256"}
      ],
      "name": "ItemPurchased",
      "type": "event"
    }
  ]
} as const

export const USDC_CONTRACT = {
  address: '0x036CbD53842c5426634e7929541eC2318f3dCF7e' as `0x${string}`, // Base Sepolia USDC
  abi: [
    {
      "inputs": [
        {"internalType": "address", "name": "spender", "type": "address"},
        {"internalType": "uint256", "name": "amount", "type": "uint256"}
      ],
      "name": "approve",
      "outputs": [{"internalType": "bool", "name": "", "type": "bool"}],
      "stateMutability": "nonpayable",
      "type": "function"
    },
    {
      "inputs": [{"internalType": "address", "name": "account", "type": "address"}],
      "name": "balanceOf",
      "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}],
      "stateMutability": "view",
      "type": "function"
    }
  ]
} as const