const { ethers } = require("hardhat");
require("dotenv").config();

async function main() {
  console.log("🚀 Starting deployment to", network.name);
  
  // Get network-specific configuration
  const networkConfig = getNetworkConfig(network.name);
  
  // Get deployer account
  const [deployer] = await ethers.getSigners();
  console.log("📝 Deploying with account:", deployer.address);
  
  // Check balance
  const balance = await ethers.provider.getBalance(deployer.address);
  console.log("💰 Account balance:", ethers.formatEther(balance), "ETH");
  
  if (balance < ethers.parseEther("0.001")) {
    throw new Error("❌ Insufficient balance for deployment");
  }

  // Deploy EscrowPayment contract
  console.log("\n📦 Deploying EscrowPayment contract...");
  
  const EscrowPayment = await ethers.getContractFactory("EscrowPayment");
  const escrowPayment = await EscrowPayment.deploy(
    networkConfig.usdcAddress,
    networkConfig.platformFeePercent,
    networkConfig.adminAddress
  );

  await escrowPayment.waitForDeployment();
  const contractAddress = await escrowPayment.getAddress();
  
  console.log("✅ EscrowPayment deployed to:", contractAddress);
  console.log("🔧 Constructor args:");
  console.log("   USDC Address:", networkConfig.usdcAddress);
  console.log("   Platform Fee:", networkConfig.platformFeePercent / 100, "%");
  console.log("   Admin Address:", networkConfig.adminAddress);

  // Verify deployment
  console.log("\n🔍 Verifying deployment...");
  try {
    // Wait a bit for the contract to be indexed
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    const owner = await escrowPayment.owner();
    const usdcToken = await escrowPayment.usdcToken();
    const feePercent = await escrowPayment.platformFeePercent();
    
    console.log("   Contract Owner:", owner);
    console.log("   USDC Token:", usdcToken);
    console.log("   Fee Percent:", feePercent.toString());
  } catch (error) {
    console.log("   ⚠️  Contract verification will be available shortly after deployment");
    console.log("   Contract Address:", contractAddress);
  }

  // Save deployment info
  const deploymentInfo = {
    network: network.name,
    contractAddress: contractAddress,
    deployer: deployer.address,
    timestamp: new Date().toISOString(),
    constructorArgs: [
      networkConfig.usdcAddress,
      networkConfig.platformFeePercent,
      networkConfig.adminAddress
    ],
    gasUsed: "TBD", // Will be filled after transaction receipt
    transactionHash: escrowPayment.deploymentTransaction()?.hash,
    networkConfig: networkConfig
  };

  console.log("\n📋 Deployment Summary:");
  console.log(JSON.stringify(deploymentInfo, null, 2));

  // Save to file
  const fs = require('fs');
  const deploymentFile = `deployments/${network.name}-${Date.now()}.json`;
  
  // Create deployments directory if it doesn't exist
  if (!fs.existsSync('deployments')) {
    fs.mkdirSync('deployments');
  }
  
  fs.writeFileSync(deploymentFile, JSON.stringify(deploymentInfo, null, 2));
  console.log(`\n💾 Deployment info saved to: ${deploymentFile}`);

  // Instructions for verification
  if (network.name !== "hardhat" && network.name !== "localhost") {
    console.log("\n🔐 To verify on Basescan, run:");
    console.log(`npx hardhat verify --network ${network.name} ${contractAddress} "${networkConfig.usdcAddress}" ${networkConfig.platformFeePercent} "${networkConfig.adminAddress}"`);
  }

  return contractAddress;
}

function getNetworkConfig(networkName) {
  const config = {
    adminAddress: process.env.ADMIN_ADDRESS,
    platformFeePercent: parseInt(process.env.PLATFORM_FEE_PERCENT) * 100 // Convert to basis points
  };

  switch (networkName) {
    case "baseMainnet":
      return {
        ...config,
        usdcAddress: process.env.USDC_BASE_MAINNET
      };
    case "baseSepolia":
      return {
        ...config,
        usdcAddress: process.env.USDC_BASE_SEPOLIA
      };
    default:
      throw new Error(`❌ Unsupported network: ${networkName}`);
  }
}

// Handle errors
main()
  .then((contractAddress) => {
    console.log("\n🎉 Deployment completed successfully!");
    console.log("Contract Address:", contractAddress);
    process.exit(0);
  })
  .catch((error) => {
    console.error("\n❌ Deployment failed:");
    console.error(error);
    process.exit(1);
  });