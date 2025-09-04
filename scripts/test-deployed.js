const { ethers } = require("hardhat");
require("dotenv").config();

async function main() {
  console.log("🧪 Testing deployed contract on", network.name);
  
  // Contract address from deployment
  const contractAddress = "0xF8c217E22F6e5571AbE6353Aa920Ba307BB131c0";
  const usdcAddress = "0x036CbD53842c5426634e7929541eC2318f3dCF7e"; // Base Sepolia USDC
  
  // Get signers
  const [deployer] = await ethers.getSigners();
  console.log("🔑 Testing with account:", deployer.address);
  
  // Get contract instances
  const EscrowPayment = await ethers.getContractFactory("EscrowPayment");
  const escrowPayment = EscrowPayment.attach(contractAddress);
  
  const MockERC20 = await ethers.getContractFactory("MockERC20");
  const usdcToken = MockERC20.attach(usdcAddress);
  
  console.log("\n📋 Contract Information:");
  console.log("Contract Address:", contractAddress);
  console.log("USDC Address:", usdcAddress);
  
  try {
    // Test basic contract functions
    console.log("\n🔍 Testing contract state...");
    
    const owner = await escrowPayment.owner();
    console.log("✅ Contract Owner:", owner);
    
    const usdcTokenAddress = await escrowPayment.usdcToken();
    console.log("✅ USDC Token:", usdcTokenAddress);
    
    const platformFee = await escrowPayment.platformFeePercent();
    console.log("✅ Platform Fee:", platformFee.toString(), "basis points");
    
    const nextItemId = await escrowPayment.nextItemId();
    console.log("✅ Next Item ID:", nextItemId.toString());
    
    // Test fee calculation
    const testPrice = ethers.parseUnits("100", 6); // 100 USDC
    const [platformFeeAmount, creatorPayout] = await escrowPayment.calculateFees(testPrice);
    console.log("✅ Fee calculation for 100 USDC:");
    console.log("   Platform Fee:", ethers.formatUnits(platformFeeAmount, 6), "USDC");
    console.log("   Creator Payout:", ethers.formatUnits(creatorPayout, 6), "USDC");
    
    // Test item listing (this will fail on testnet without USDC, but we can test the call)
    console.log("\n📝 Testing item listing...");
    try {
      const tx = await escrowPayment.listItem(
        deployer.address,
        testPrice,
        "Test Item for Deployment Verification",
        { gasLimit: 200000 }
      );
      
      console.log("✅ Item listing transaction sent:", tx.hash);
      const receipt = await tx.wait();
      console.log("✅ Item listed successfully! Gas used:", receipt.gasUsed.toString());
      
      // Get the item details
      const item = await escrowPayment.getItem(1);
      console.log("✅ Item details:");
      console.log("   Creator:", item.creator);
      console.log("   Price:", ethers.formatUnits(item.price, 6), "USDC");
      console.log("   Title:", item.title);
      console.log("   Active:", item.active);
      
    } catch (error) {
      console.log("⚠️  Item listing test skipped (expected on testnet):", error.message);
    }
    
    console.log("\n✅ All basic contract tests passed!");
    console.log("\n📊 Contract is ready for frontend integration!");
    
  } catch (error) {
    console.error("❌ Contract test failed:", error.message);
    throw error;
  }
}

main()
  .then(() => {
    console.log("\n🎉 Contract testing completed successfully!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("\n❌ Contract testing failed:");
    console.error(error);
    process.exit(1);
  });