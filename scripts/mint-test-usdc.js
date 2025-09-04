const { ethers } = require("hardhat");

async function main() {
  console.log("🪙 Minting Test USDC");
  
  const [deployer] = await ethers.getSigners();
  console.log("Minting for account:", deployer.address);
  
  // Use test config
  const fs = require('fs');
  const testConfig = JSON.parse(fs.readFileSync('test-config.json', 'utf8'));
  
  const mockUSDCAddress = testConfig.mockUSDC;
  console.log("Mock USDC Contract:", mockUSDCAddress);
  
  // Get contract instance
  const MockERC20 = await ethers.getContractFactory("MockERC20");
  const mockUSDC = MockERC20.attach(mockUSDCAddress);
  
  // Mint 5000 USDC
  const mintAmount = ethers.parseUnits("5000", 6);
  console.log("Minting 5000 USDC...");
  
  const tx = await mockUSDC.mint(deployer.address, mintAmount);
  await tx.wait();
  
  console.log("✅ Minted successfully!");
  
  // Check balance
  const balance = await mockUSDC.balanceOf(deployer.address);
  console.log("Your USDC Balance:", ethers.formatUnits(balance, 6), "USDC");
  
  console.log("\n🎯 Now you can test the escrow system:");
  console.log("1. Go to http://localhost:3000");
  console.log("2. Connect your wallet");
  console.log("3. List an item in 'Sell Items' tab");
  console.log("4. Purchase the item in 'Buy Items' tab");
  console.log("5. Check that USDC is properly distributed");
}

main()
  .then(() => {
    console.log("\n🎉 USDC minting completed!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("\n❌ USDC minting failed:");
    console.error(error);
    process.exit(1);
  });