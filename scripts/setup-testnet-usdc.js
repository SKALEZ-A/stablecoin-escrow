const { ethers } = require("hardhat");

async function main() {
  console.log("🪙 Setting up Base Sepolia USDC for testing");
  
  const [deployer] = await ethers.getSigners();
  console.log("Setting up for account:", deployer.address);
  
  // Base Sepolia USDC contract
  const usdcAddress = "0x036CbD53842c5426634e7929541eC2318f3dCF7e";
  
  // For testing, we'll deploy a mock USDC that we can mint
  console.log("\n📦 Deploying Mock USDC for testing...");
  
  const MockERC20 = await ethers.getContractFactory("MockERC20");
  const mockUSDC = await MockERC20.deploy("Test USDC", "TUSDC", 6);
  await mockUSDC.waitForDeployment();
  
  const mockUSDCAddress = await mockUSDC.getAddress();
  console.log("✅ Mock USDC deployed to:", mockUSDCAddress);
  
  // Mint test USDC to deployer
  const testAmount = ethers.parseUnits("10000", 6); // 10,000 USDC
  await mockUSDC.mint(deployer.address, testAmount);
  console.log("✅ Minted 10,000 test USDC to:", deployer.address);
  
  // Deploy new escrow contract with mock USDC for testing
  console.log("\n📦 Deploying Test Escrow Contract...");
  
  const EscrowPayment = await ethers.getContractFactory("EscrowPayment");
  const testEscrow = await EscrowPayment.deploy(
    mockUSDCAddress,
    1000, // 10% fee
    deployer.address
  );
  await testEscrow.waitForDeployment();
  
  const testEscrowAddress = await testEscrow.getAddress();
  console.log("✅ Test Escrow deployed to:", testEscrowAddress);
  
  // Test the complete flow
  console.log("\n🧪 Testing Complete Flow...");
  
  // 1. List an item
  console.log("1️⃣ Listing test item...");
  const listTx = await testEscrow.listItem(
    deployer.address,
    ethers.parseUnits("100", 6), // 100 USDC
    "Test Event Ticket"
  );
  await listTx.wait();
  console.log("✅ Item listed with ID: 1");
  
  // 2. Approve USDC spending
  console.log("2️⃣ Approving USDC spending...");
  const approveTx = await mockUSDC.approve(
    testEscrowAddress,
    ethers.parseUnits("100", 6)
  );
  await approveTx.wait();
  console.log("✅ USDC spending approved");
  
  // 3. Purchase item
  console.log("3️⃣ Purchasing item...");
  const balanceBefore = await mockUSDC.balanceOf(deployer.address);
  
  const buyTx = await testEscrow.buyItem(1);
  await buyTx.wait();
  
  const balanceAfter = await mockUSDC.balanceOf(deployer.address);
  console.log("✅ Item purchased successfully!");
  console.log("   Balance before:", ethers.formatUnits(balanceBefore, 6), "USDC");
  console.log("   Balance after:", ethers.formatUnits(balanceAfter, 6), "USDC");
  console.log("   Spent:", ethers.formatUnits(balanceBefore - balanceAfter, 6), "USDC");
  
  // 4. Verify purchase
  const purchase = await testEscrow.getPurchase(1, 0);
  console.log("✅ Purchase verified:");
  console.log("   Buyer:", purchase.buyer);
  console.log("   Amount:", ethers.formatUnits(purchase.amount, 6), "USDC");
  
  console.log("\n🎉 Complete escrow flow tested successfully!");
  console.log("\n📋 Test Contract Addresses:");
  console.log("Mock USDC:", mockUSDCAddress);
  console.log("Test Escrow:", testEscrowAddress);
  console.log("\n💡 Use these addresses in frontend for testing!");
  
  // Save test configuration
  const testConfig = {
    network: "baseSepolia",
    mockUSDC: mockUSDCAddress,
    testEscrow: testEscrowAddress,
    deployer: deployer.address,
    timestamp: new Date().toISOString()
  };
  
  const fs = require('fs');
  fs.writeFileSync('test-config.json', JSON.stringify(testConfig, null, 2));
  console.log("💾 Test configuration saved to test-config.json");
}

main()
  .then(() => {
    console.log("\n🎉 Test setup completed successfully!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("\n❌ Test setup failed:");
    console.error(error);
    process.exit(1);
  });