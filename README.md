# Escrow Payment System on Base

A secure escrow payment system built for Base network using USDC, with automatic fee distribution and creator payouts.

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ 
- npm or yarn
- MetaMask or Base Wallet
- USDC on Base network

### Installation

1. **Clone and install dependencies:**
```bash
npm install
```

2. **Set up environment variables:**
```bash
cp .env.example .env
# Edit .env with your configuration
```

3. **Compile contracts:**
```bash
npx hardhat compile
```

4. **Run tests:**
```bash
npx hardhat test
```

## 📋 Contract Addresses

### Base Sepolia Testnet
- **EscrowPayment:** `0x3Ccc876E15c0C833e7457e514Ff13deA946f38d2`
- **USDC:** `0x036CbD53842c5426634e7929541eC2318f3dCF7e`

### Base Mainnet
- **EscrowPayment:** `TBD` (needs deployment funding)
- **USDC:** `0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913`

## 🔧 Deployment

### Deploy to Base Sepolia (Testnet)
```bash
npm run deploy:sepolia
```

### Deploy to Base Mainnet
```bash
# Ensure your deployer address has sufficient ETH for gas
npm run deploy:mainnet
```

### Verify Contract
```bash
npx hardhat verify --network baseMainnet <CONTRACT_ADDRESS> "<USDC_ADDRESS>" <FEE_PERCENT> "<ADMIN_ADDRESS>"
```

## 💡 How It Works

### 1. **Item Listing**
- Creator calls `listItem(creatorAddress, price, title)`
- Item gets assigned unique ID
- Creator specifies their payout wallet

### 2. **Purchase Flow**
- Buyer approves USDC spending: `USDC.approve(escrowAddress, price)`
- Buyer calls `buyItem(itemId)`
- Contract automatically splits payment:
  - Platform fee (10%) → Admin wallet
  - Remaining (90%) → Creator wallet

### 3. **Refunds** (Admin only)
- Admin can issue refunds via `refund(itemId, buyerIndex)`
- Refunds come from admin's wallet

## 🎯 Key Features

- ✅ **Instant Payouts:** No escrow holding period
- ✅ **Automatic Fee Distribution:** Platform fee + creator payout in one transaction
- ✅ **Secure:** Built with OpenZeppelin contracts
- ✅ **Gas Optimized:** Efficient Solidity patterns
- ✅ **Pausable:** Emergency stop functionality
- ✅ **Upgradeable Fee:** Admin can adjust platform fee

## 🔒 Security Features

- **ReentrancyGuard:** Prevents reentrancy attacks
- **Pausable:** Emergency pause functionality
- **Ownable:** Admin-only functions
- **SafeERC20:** Safe token transfers
- **Input Validation:** Comprehensive parameter checking

## 📊 Contract Functions

### Public Functions
- `listItem(creator, price, title)` - List new item
- `buyItem(itemId)` - Purchase item with USDC
- `getItem(itemId)` - Get item details
- `calculateFees(price)` - Preview fee breakdown

### Admin Functions
- `refund(itemId, buyerIndex)` - Issue refund
- `updateFeePercent(newFee)` - Update platform fee
- `pause()` / `unpause()` - Emergency controls

### View Functions
- `getCreatorItems(creator)` - Get creator's items
- `getBuyerPurchases(buyer)` - Get buyer's purchases
- `getPurchaseCount(itemId)` - Get purchase count

## 🌐 Frontend Setup

### Install Frontend Dependencies
```bash
cd frontend
npm install
```

### Configure Wallet Connection
1. Get WalletConnect Project ID from https://cloud.walletconnect.com
2. Update `frontend/lib/wagmi.ts` with your project ID

### Run Development Server
```bash
cd frontend
npm run dev
```

### Frontend Features
- 🔗 **Wallet Connection:** RainbowKit integration
- 📝 **List Items:** Easy item creation form
- 🛒 **Buy Items:** Two-step purchase process
- 📊 **Item Browser:** View all available items
- 💰 **Fee Calculator:** Real-time fee preview

## 🧪 Testing

### Run All Tests
```bash
npx hardhat test
```

### Test Coverage
- ✅ Contract deployment
- ✅ Item listing
- ✅ Item purchasing
- ✅ Fee calculations
- ✅ Refund functionality
- ✅ Access controls

## 📈 Gas Costs

| Function | Gas Cost |
|----------|----------|
| listItem | ~166,546 |
| buyItem | ~240,975 |
| refund | ~80,000 |

## 🔧 Configuration

### Environment Variables
```bash
# Deployment
PRIVATE_KEY=your_private_key
ADMIN_ADDRESS=0x5230b89d6728a10b34b8EC1C740a7A7a1C4afe94

# Network RPCs
BASE_MAINNET_RPC=https://mainnet.base.org
BASE_SEPOLIA_RPC=https://sepolia.base.org

# Contract Addresses
USDC_BASE_MAINNET=0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913
USDC_BASE_SEPOLIA=0x036CbD53842c5426634e7929541eC2318f3dCF7e

# Platform Settings
PLATFORM_FEE_PERCENT=10  # 10% platform fee
```

## 🚨 Important Notes

### For Mainnet Deployment
1. **Fund Deployer Address:** Send ETH to `0x5230b89d6728a10b34b8EC1C740a7A7a1C4afe94`
2. **Minimum Required:** ~0.01 ETH for deployment gas
3. **Get Basescan API Key:** For contract verification

### Security Considerations
- ⚠️ **Private Key Security:** Never commit private keys
- ⚠️ **Admin Controls:** Admin has refund and pause powers
- ⚠️ **USDC Approval:** Users must approve USDC spending
- ⚠️ **Fee Limits:** Maximum 25% platform fee enforced

## 📞 Support

### Useful Links
- **Base Docs:** https://docs.base.org
- **Basescan:** https://basescan.org
- **USDC Docs:** https://developers.circle.com/stablecoins

### Troubleshooting
- **"Insufficient balance":** Fund deployer with ETH
- **"Transaction reverted":** Check USDC approval
- **"Item does not exist":** Verify item ID
- **"Cannot buy own item":** Use different wallet

## 📄 License

MIT License - see LICENSE file for details.

---

**Ready to deploy to mainnet!** Just fund the deployer address with ETH and run the deployment command.# stablecoin-escrow
