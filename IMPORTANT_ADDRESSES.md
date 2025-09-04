# 🔑 Important Addresses & Information

## 📍 Contract Addresses

### Base Sepolia Testnet
- **Escrow Contract:** `0xF8c217E22F6e5571AbE6353Aa920Ba307BB131c0`
- **USDC Token:** `0x036CbD53842c5426634e7929541eC2318f3dCF7e`
- **Admin Address:** `0x5230b89d6728a10b34b8EC1C740a7A7a1C4afe94`
- **Deployer:** `0x5230b89d6728a10b34b8EC1C740a7A7a1C4afe94`

### Transaction Details
- **Deployment TX:** `0x510e3fbde75c15d772ba0456cb483728cf3183dcda0cdbeac7091d4ca0fefda1`
- **Block Number:** ~30,602,040
- **Gas Used:** ~1.49M gas
- **Deployment Date:** September 4, 2025

## 🌐 Network Information

### Base Sepolia Testnet
- **Chain ID:** 84532
- **RPC URL:** https://sepolia.base.org
- **Block Explorer:** https://sepolia.basescan.org
- **Faucet:** https://www.coinbase.com/faucets/base-ethereum-sepolia-faucet

### Contract Links
- **Basescan:** https://sepolia.basescan.org/address/0xF8c217E22F6e5571AbE6353Aa920Ba307BB131c0
- **USDC Token:** https://sepolia.basescan.org/address/0x036CbD53842c5426634e7929541eC2318f3dCF7e

## ⚙️ Configuration

### Platform Settings
- **Platform Fee:** 10% (1000 basis points)
- **Max Fee Allowed:** 25% (2500 basis points)
- **USDC Decimals:** 6
- **Gas Limit Recommendations:**
  - List Item: 200,000
  - Buy Item: 250,000
  - USDC Approval: 50,000

### Frontend Configuration
- **Local URL:** http://localhost:3000
- **Contract ABI:** Available in `frontend/lib/contracts.ts`
- **Wagmi Config:** Base Sepolia network configured

## 🔐 Security Information

### Access Control
- **Contract Owner:** `0x5230b89d6728a10b34b8EC1C740a7A7a1C4afe94`
- **Admin Functions:** Pause, unpause, update fees, refunds, emergency withdrawal
- **User Functions:** List items, buy items, toggle item status (creators only)

### Security Features
- ✅ ReentrancyGuard protection
- ✅ Pausable contract
- ✅ SafeERC20 for token transfers
- ✅ Input validation on all functions
- ✅ Access control on admin functions

## 📁 Important Files

### Deployment Records
- `deployments/baseSepolia-1756972312146.json` - Full deployment details
- `DEPLOYMENT_SUMMARY.md` - Complete deployment documentation
- `TESTING_GUIDE.md` - Comprehensive testing instructions

### Contract Files
- `contracts/EscrowPayment.sol` - Main escrow contract
- `contracts/MockERC20.sol` - Test token contract
- `hardhat.config.js` - Network configuration

### Test Files
- `test/EscrowPayment.test.js` - Basic functionality tests
- `test/EscrowPayment.comprehensive.test.js` - Full security and edge case tests
- `scripts/test-deployed.js` - Post-deployment verification
- `scripts/frontend-integration-test.js` - Frontend compatibility tests

### Frontend Files
- `frontend/lib/contracts.ts` - Contract addresses and ABIs
- `frontend/lib/wagmi.ts` - Wallet and network configuration
- `frontend/components/` - React components for marketplace

## 🧪 Testing Commands

### Local Testing
```bash
# Run all tests
npm test

# Run comprehensive tests
npx hardhat test test/EscrowPayment.comprehensive.test.js

# Test deployed contract
npx hardhat run scripts/test-deployed.js --network baseSepolia

# Frontend integration test
node scripts/frontend-integration-test.js
```

### Frontend Testing
```bash
# Start development server
cd frontend && npm run dev

# Build for production
cd frontend && npm run build
```

### Contract Interaction
```bash
# Hardhat console on Base Sepolia
npx hardhat console --network baseSepolia

# Verify contract (if Basescan API key available)
npx hardhat verify --network baseSepolia 0xF8c217E22F6e5571AbE6353Aa920Ba307BB131c0 "0x036CbD53842c5426634e7929541eC2318f3dCF7e" 1000 "0x5230b89d6728a10b34b8EC1C740a7A7a1C4afe94"
```

## 💰 Fee Structure

### Platform Fees
- **Current Rate:** 10%
- **Example:** $100 item = $10 platform fee + $90 to creator
- **Adjustable:** Yes (admin only, max 25%)

### Gas Costs (Estimated)
- **List Item:** ~165,000 gas (~$0.01 USD at 1 gwei)
- **Buy Item:** ~217,000 gas (~$0.015 USD at 1 gwei)
- **USDC Approval:** ~46,000 gas (~$0.005 USD at 1 gwei)

## 🚀 Mainnet Migration

### For Base Mainnet Deployment
- **USDC Address:** `0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913`
- **Chain ID:** 8453
- **RPC URL:** https://mainnet.base.org
- **Block Explorer:** https://basescan.org

### Recommended Changes for Production
1. **Multi-sig Admin:** Use Gnosis Safe or similar
2. **Timelock:** Add timelock for fee changes
3. **Monitoring:** Set up event monitoring
4. **Insurance:** Consider smart contract insurance
5. **Audit:** Professional security audit recommended

## 📞 Support & Maintenance

### Key Contacts
- **Admin Wallet:** `0x5230b89d6728a10b34b8EC1C740a7A7a1C4afe94`
- **Contract Address:** `0xF8c217E22F6e5571AbE6353Aa920Ba307BB131c0`

### Emergency Procedures
- **Pause Contract:** Admin can pause all operations
- **Emergency Withdrawal:** Admin can recover stuck tokens
- **Fee Updates:** Admin can adjust platform fees (max 25%)

---

**⚠️ IMPORTANT: Keep this information secure and backed up. These addresses and private keys control significant functionality.**

**✅ STATUS: FULLY DEPLOYED AND OPERATIONAL ON BASE SEPOLIA TESTNET**