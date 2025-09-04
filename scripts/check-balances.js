const { ethers } = require("hardhat");

async function main() {
  console.log("💰 Checking USDC Balances and Escrow Activity");
  
  const [deployer] = await ethers.getSigners();
  
  // Check if we have test config
  const fs = require('fs');
  let usdcAddress, escrowAddress;
  
  if (fs.existsSync('test-config.json')) {
    const testConfig = JSON.parse(fs.readFileSync('test-config.json', 'utf8'));
    usdcAddress = testConfig.mockUSDC;
    escrowAddress = testConfig.testEscrow;
    console.log("📋 Using test configuration");
  } else {
    // Use production addresses
    usdcAddress = "0x036CbD53842c5426634e7929541eC2318f3dCF7e";
    escrowAddress = "0xF8c217E22F6e5571AbE6353Aa920Ba307BB131c0";
    console.log("📋 Using production configuration");
  }
  
  console.log("USDC Contract:", usdcAddress);
  console.log("Escrow Contract:", escrowAddress);
  console.log("Your Address:", deployer.address);
  
  // Get contract instances
  const MockERC20 = await ethers.getContractFactory("MockERC20");
  const usdcToken = MockERC20.attach(usdcAddress);
  
  const EscrowPayment = await ethers.getContractFactory("EscrowPayment");
  const escrowPayment = EscrowPayment.attach(escrowAddress);
  
  try {
    // Check USDC balances
    console.log("\n💰 USDC Balances:");
    
    const yourBalance = await usdcToken.balanceOf(deployer.address);
    console.log("Your Balance:", ethers.formatUnits(yourBalance, 6), "USDC");
    
    const escrowBalance = await usdcToken.balanceOf(escrowAddress);
    console.log("Escrow Balance:", ethers.formatUnits(escrowBalance, 6), "USDC");
    
    const adminAddress = await escrowPayment.owner();
    const adminBalance = await usdcToken.balanceOf(adminAddress);
    console.log("Admin Balance:", ethers.formatUnits(adminBalance, 6), "USDC");
    
    // Check escrow contract state
    console.log("\n📊 Escrow Contract State:");
    
    const nextItemId = await escrowPayment.nextItemId();
    console.log("Next Item ID:", nextItemId.toString());
    
    const platformFee = await escrowPayment.platformFeePercent();
    console.log("Platform Fee:", (Number(platformFee) / 100).toFixed(1) + "%");
    
    // Check if any items exist
    if (nextItemId > 1) {
      console.log("\n📦 Listed Items:");
      
      for (let i = 1; i < nextItemId; i++) {
        try {
          const item = await escrowPayment.getItem(i);
          console.log(`Item ${i}:`);
          console.log("  Creator:", item.creator);
          console.log("  Price:", ethers.formatUnits(item.price, 6), "USDC");
          console.log("  Title:", item.title);
          console.log("  Active:", item.active);
          
          // Check purchases for this item
          const purchaseCount = await escrowPayment.getPurchaseCount(i);
          console.log("  Purchases:", purchaseCount.toString());
          
          if (purchaseCount > 0) {
            console.log("  Purchase Details:");
            for (let j = 0; j < purchaseCount; j++) {
              const purchase = await escrowPayment.getPurchase(i, j);
              console.log(`    Purchase ${j + 1}:`);
              console.log("      Buyer:", purchase.buyer);
              console.log("      Amount:", ethers.formatUnits(purchase.amount, 6), "USDC");
              console.log("      Refunded:", purchase.refunded);
            }
          }
        } catch (error) {
          console.log(`Item ${i}: Not found or error`);
        }
      }
    } else {
      console.log("\n📦 No items listed yet");
    }
    
    // Check your creator items
    const creatorItems = await escrowPayment.getCreatorItems(deployer.address);
    if (creatorItems.length > 0) {
      console.log("\n🎨 Your Listed Items:", creatorItems.map(id => id.toString()).join(", "));
    }
    
    // Check your purchases
    const buyerPurchases = await escrowPayment.getBuyerPurchases(deployer.address);
    if (buyerPurchases.length > 0) {
      console.log("🛒 Your Purchases:", buyerPurchases.map(id => id.toString()).join(", "));
    }
    
    // Calculate potential earnings
    if (yourBalance > 0) {
      console.log("\n💡 Testing Scenarios:");
      
      const testPrices = [10, 50, 100, 500];
      console.log("If you list items at different prices:");
      
      for (const price of testPrices) {
        const [platformFeeAmount, creatorPayout] = await escrowPayment.calculateFees(
          ethers.parseUnits(price.toString(), 6)
        );
        
        console.log(`  $${price} item → Platform fee: $${ethers.formatUnits(platformFeeAmount, 6)}, Creator gets: $${ethers.formatUnits(creatorPayout, 6)}`);
      }
    }
    
    // Check allowances
    console.log("\n🔐 USDC Allowances:");
    const allowance = await usdcToken.allowance(deployer.address, escrowAddress);
    console.log("Your allowance to escrow:", ethers.formatUnits(allowance, 6), "USDC");
    
    if (allowance > 0) {
      console.log("✅ You can purchase items up to", ethers.formatUnits(allowance, 6), "USDC");
    } else {
      console.log("⚠️  You need to approve USDC spending before purchasing");
    }
    
  } catch (error) {
    console.error("❌ Error checking balances:", error.message);
    
    if (error.message.includes("call revert exception")) {
      console.log("\n💡 This might be because:");
      console.log("1. Contract addresses are incorrect");
      console.log("2. You're on the wrong network");
      console.log("3. Contracts haven't been deployed yet");
      console.log("\nTry running: npx hardhat run scripts/setup-testnet-usdc.js --network baseSepolia");
    }
  }
}

main()
  .then(() => {
    console.log("\n✅ Balance check completed!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("\n❌ Balance check failed:");
    console.error(error);
    process.exit(1);
  });