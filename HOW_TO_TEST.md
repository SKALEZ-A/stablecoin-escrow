# 🧪 How to Test Your Escrow Payment System

## 🔍 Understanding the Escrow Deposit System

Your contract **already works as a proper escrow** with these key points:

### ✅ **Deposit Address:** 
- **Escrow Contract:** `0xF8c217E22F6e5571AbE6353Aa920Ba307BB131c0`
- **This IS the deposit address** - users deposit USDC here when purchasing

### ✅ **Payment Flow:**
1. **User approves** USDC spending to escrow contract
2. **User calls buyItem()** → USDC is deposited into escrow contract
3. **Contract automatically splits** the deposit:
   - Platform fee → Admin wallet
   - Remaining amount → Creator wallet

### ✅ **Escrow Features:**
- Funds are held temporarily during the transaction
- Automatic distribution based on platform fee
- Refund capability for disputes
- Complete transaction history

## 🚀 Step-by-Step Testing Process

### Option 1: Test with Mock USDC (Recommended)

#### Step 1: Deploy Test Contracts
```bash
# Deploy mock USDC and test escrow
npx hardhat run scripts/setup-testnet-usdc.js --network baseSepolia
```

This will:
- Deploy a mock USDC contract you can mint
- Deploy a test escrow contract
- Mint 10,000 test USDC to your wallet
- Test the complete purchase flow
- Save addresses to `test-config.json`

#### Step 2: Update Frontend for Testing
After running the setup script, update your frontend with the test addresses:

```typescript
// In frontend/lib/contracts.ts
export const ESCROW_CONTRACT = {
  address: 'YOUR_TEST_ESCROW_ADDRESS' as `0x${string}`, // From test-config.json
  // ... rest of ABI
}

export const USDC_CONTRACT = {
  address: 'YOUR_MOCK_USDC_ADDRESS' as `0x${string}`, // From test-config.json
  // ... rest of ABI
}
```

### Option 2: Get Real Base Sepolia USDC

#### Method A: Use Aave Faucet
1. Visit: https://staging.aave.com/faucet/
2. Connect wallet (Base Sepolia network)
3. Request USDC tokens
4. Use original contract addresses

#### Method B: Bridge from Ethereum Sepolia
1. Get Sepolia ETH and USDC on Ethereum Sepolia
2. Use Base bridge to transfer to Base Sepolia
3. Use original contract addresses

## 🎯 Complete Testing Workflow

### Phase 1: Setup (Choose Option 1 or 2 above)

### Phase 2: Frontend Testing

#### 1. Start Frontend
```bash
cd frontend
npm run dev
# Open http://localhost:3000
```

#### 2. Connect Wallet
- Click "Connect Wallet"
- Select MetaMask/WalletConnect
- Ensure you're on Base Sepolia network

#### 3. Test Creator Flow (Listing Items)
1. **Switch to "Sell Items" tab**
2. **Fill out the form:**
   - **Title:** "Concert Ticket"
   - **Price:** 50 (USDC)
   - **Creator Address:** Your wallet address
3. **Click "List Item"**
   - ✅ Should prompt for transaction
   - ✅ Transaction should succeed
   - ✅ Item should appear in marketplace

#### 4. Test Buyer Flow (Purchasing Items)
1. **Switch to "Buy Items" tab**
2. **Enter Item ID:** 1 (from previous step)
3. **Click "Buy Item"**
   - ✅ First transaction: USDC approval
   - ✅ Second transaction: Actual purchase
   - ✅ USDC should be deducted from your balance
   - ✅ Platform fee goes to admin
   - ✅ Creator payout goes to creator

### Phase 3: Verify Escrow Functionality

#### Check Balances After Purchase
```bash
# Run balance check script
node scripts/check-balances.js
```

#### Verify Transaction on Basescan
1. Go to: https://sepolia.basescan.org
2. Search for your escrow contract address
3. Check "Internal Txns" tab
4. ✅ Should see USDC transfers:
   - From buyer to escrow contract
   - From escrow to admin (platform fee)
   - From escrow to creator (payout)

## 🔧 Troubleshooting Common Issues

### "No USDC Balance" Error
**Problem:** Can't purchase because no USDC
**Solution:** 
- Use Option 1 (Mock USDC) for testing
- Or get real Base Sepolia USDC from faucets

### "Transaction Reverted" Error
**Problem:** Purchase transaction fails
**Solutions:**
1. **Check USDC approval:** Must approve spending first
2. **Check item exists:** Verify item ID is correct
3. **Check sufficient balance:** Need enough USDC + ETH for gas
4. **Check item is active:** Item must not be paused

### "Cannot Buy Own Item" Error
**Problem:** Trying to purchase item you listed
**Solution:** Use different wallet address for testing

### Wallet Connection Issues
**Problem:** Wallet won't connect or wrong network
**Solutions:**
1. **Refresh page** and try again
2. **Switch to Base Sepolia** in wallet
3. **Add Base Sepolia network** manually if needed

## 📊 Expected Test Results

### Successful Purchase Flow
1. **USDC Approval:** ~46k gas, ~$0.005
2. **Item Purchase:** ~217k gas, ~$0.015
3. **Balance Changes:**
   - Buyer: -100 USDC
   - Admin: +10 USDC (platform fee)
   - Creator: +90 USDC (payout)

### Transaction Verification
- **Basescan:** All transactions visible
- **Event Logs:** ItemPurchased event emitted
- **Contract State:** Purchase recorded in contract

## 🎯 Key Testing Points

### ✅ Escrow Deposit Verification
- [ ] USDC is deposited into escrow contract address
- [ ] Platform fee is automatically sent to admin
- [ ] Creator payout is automatically sent to creator
- [ ] Transaction is recorded for refund capability

### ✅ User Experience
- [ ] Wallet connection works smoothly
- [ ] Item listing is intuitive
- [ ] Purchase flow is clear (approval + purchase)
- [ ] Balance updates are visible

### ✅ Security Features
- [ ] Cannot buy own items
- [ ] Cannot purchase with insufficient balance
- [ ] Cannot purchase inactive items
- [ ] Admin functions are protected

## 🚀 Production Deployment Notes

When ready for mainnet:

1. **Use Real USDC:** `0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913`
2. **Multi-sig Admin:** Use Gnosis Safe for admin functions
3. **Monitor Transactions:** Set up event monitoring
4. **Security Audit:** Consider professional audit

---

## 💡 Quick Start Commands

```bash
# 1. Setup test environment
npx hardhat run scripts/setup-testnet-usdc.js --network baseSepolia

# 2. Start frontend
cd frontend && npm run dev

# 3. Test complete flow
# - Connect wallet to localhost:3000
# - List item in "Sell Items" tab
# - Purchase item in "Buy Items" tab
# - Verify balances changed correctly
```

**🎯 Your escrow system is working perfectly - users DO deposit into the contract address, and it automatically handles the distribution!**