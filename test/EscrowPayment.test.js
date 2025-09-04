const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("EscrowPayment", function () {
  let escrowPayment;
  let mockUSDC;
  let admin, creator, buyer, otherAccount;
  const PLATFORM_FEE = 1000; // 10%
  const ITEM_PRICE = ethers.parseUnits("100", 6); // 100 USDC

  beforeEach(async function () {
    [admin, creator, buyer, otherAccount] = await ethers.getSigners();

    // Deploy mock USDC token
    const MockERC20 = await ethers.getContractFactory("MockERC20");
    mockUSDC = await MockERC20.deploy("USD Coin", "USDC", 6);
    await mockUSDC.waitForDeployment();

    // Deploy EscrowPayment
    const EscrowPayment = await ethers.getContractFactory("EscrowPayment");
    escrowPayment = await EscrowPayment.deploy(
      await mockUSDC.getAddress(),
      PLATFORM_FEE,
      admin.address
    );
    await escrowPayment.waitForDeployment();

    // Mint USDC to buyer
    await mockUSDC.mint(buyer.address, ethers.parseUnits("1000", 6));
  });

  describe("Deployment", function () {
    it("Should set the correct admin", async function () {
      expect(await escrowPayment.owner()).to.equal(admin.address);
    });

    it("Should set the correct USDC token", async function () {
      expect(await escrowPayment.usdcToken()).to.equal(await mockUSDC.getAddress());
    });

    it("Should set the correct platform fee", async function () {
      expect(await escrowPayment.platformFeePercent()).to.equal(PLATFORM_FEE);
    });
  });

  describe("Item Listing", function () {
    it("Should allow listing an item", async function () {
      await expect(
        escrowPayment.connect(creator).listItem(
          creator.address,
          ITEM_PRICE,
          "Test Item"
        )
      ).to.emit(escrowPayment, "ItemListed")
        .withArgs(1, creator.address, ITEM_PRICE, "Test Item");

      const item = await escrowPayment.getItem(1);
      expect(item.creator).to.equal(creator.address);
      expect(item.price).to.equal(ITEM_PRICE);
      expect(item.title).to.equal("Test Item");
      expect(item.active).to.be.true;
    });

    it("Should reject invalid parameters", async function () {
      await expect(
        escrowPayment.listItem(ethers.ZeroAddress, ITEM_PRICE, "Test")
      ).to.be.revertedWith("Invalid creator address");

      await expect(
        escrowPayment.listItem(creator.address, 0, "Test")
      ).to.be.revertedWith("Price must be greater than 0");

      await expect(
        escrowPayment.listItem(creator.address, ITEM_PRICE, "")
      ).to.be.revertedWith("Title cannot be empty");
    });
  });

  describe("Item Purchase", function () {
    beforeEach(async function () {
      // List an item
      await escrowPayment.connect(creator).listItem(
        creator.address,
        ITEM_PRICE,
        "Test Item"
      );

      // Approve USDC spending
      await mockUSDC.connect(buyer).approve(
        await escrowPayment.getAddress(),
        ITEM_PRICE
      );
    });

    it("Should allow purchasing an item", async function () {
      const platformFee = (ITEM_PRICE * BigInt(PLATFORM_FEE)) / 10000n;
      const creatorPayout = ITEM_PRICE - platformFee;

      await expect(
        escrowPayment.connect(buyer).buyItem(1)
      ).to.emit(escrowPayment, "ItemPurchased")
        .withArgs(1, buyer.address, creator.address, ITEM_PRICE, platformFee, creatorPayout);

      // Check balances
      expect(await mockUSDC.balanceOf(admin.address)).to.equal(platformFee);
      expect(await mockUSDC.balanceOf(creator.address)).to.equal(creatorPayout);
    });

    it("Should reject invalid purchases", async function () {
      await expect(
        escrowPayment.connect(buyer).buyItem(999)
      ).to.be.revertedWith("Item does not exist");

      await expect(
        escrowPayment.connect(creator).buyItem(1)
      ).to.be.revertedWith("Cannot buy own item");
    });
  });
});