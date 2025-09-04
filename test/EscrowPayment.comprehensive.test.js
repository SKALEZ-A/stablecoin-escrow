const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("EscrowPayment - Comprehensive Tests", function () {
  let escrowPayment;
  let mockUSDC;
  let admin, creator, buyer, buyer2, otherAccount;
  const PLATFORM_FEE = 1000; // 10%
  const ITEM_PRICE = ethers.parseUnits("100", 6); // 100 USDC
  const LARGE_AMOUNT = ethers.parseUnits("10000", 6); // 10,000 USDC

  beforeEach(async function () {
    [admin, creator, buyer, buyer2, otherAccount] = await ethers.getSigners();

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

    // Mint USDC to buyers
    await mockUSDC.mint(buyer.address, LARGE_AMOUNT);
    await mockUSDC.mint(buyer2.address, LARGE_AMOUNT);
    await mockUSDC.mint(admin.address, LARGE_AMOUNT); // For refunds
  });

  describe("Security Tests", function () {
    it("Should prevent reentrancy attacks", async function () {
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

      // Normal purchase should work
      await expect(
        escrowPayment.connect(buyer).buyItem(1)
      ).to.not.be.reverted;
    });

    it("Should handle pausing correctly", async function () {
      // Pause contract
      await escrowPayment.connect(admin).pause();

      // Should not allow listing when paused
      await expect(
        escrowPayment.connect(creator).listItem(
          creator.address,
          ITEM_PRICE,
          "Test Item"
        )
      ).to.be.revertedWithCustomError(escrowPayment, "EnforcedPause");

      // Unpause
      await escrowPayment.connect(admin).unpause();

      // Should work after unpause
      await expect(
        escrowPayment.connect(creator).listItem(
          creator.address,
          ITEM_PRICE,
          "Test Item"
        )
      ).to.not.be.reverted;
    });
  });

  describe("Fee Management", function () {
    it("Should update platform fee correctly", async function () {
      const newFee = 500; // 5%
      
      await expect(
        escrowPayment.connect(admin).updateFeePercent(newFee)
      ).to.emit(escrowPayment, "FeeUpdated")
        .withArgs(PLATFORM_FEE, newFee);

      expect(await escrowPayment.platformFeePercent()).to.equal(newFee);
    });

    it("Should reject fees above maximum", async function () {
      const maxFee = 2500; // 25%
      const tooHighFee = 2600; // 26%

      // Should accept max fee
      await expect(
        escrowPayment.connect(admin).updateFeePercent(maxFee)
      ).to.not.be.reverted;

      // Should reject fee above max
      await expect(
        escrowPayment.connect(admin).updateFeePercent(tooHighFee)
      ).to.be.revertedWith("Fee too high");
    });

    it("Should calculate fees correctly", async function () {
      const price = ethers.parseUnits("1000", 6); // 1000 USDC
      const [platformFee, creatorPayout] = await escrowPayment.calculateFees(price);
      
      const expectedFee = (price * BigInt(PLATFORM_FEE)) / 10000n;
      const expectedPayout = price - expectedFee;

      expect(platformFee).to.equal(expectedFee);
      expect(creatorPayout).to.equal(expectedPayout);
    });
  });

  describe("Multiple Purchases", function () {
    beforeEach(async function () {
      // List an item
      await escrowPayment.connect(creator).listItem(
        creator.address,
        ITEM_PRICE,
        "Popular Item"
      );
    });

    it("Should handle multiple purchases of same item", async function () {
      // Approve USDC for both buyers
      await mockUSDC.connect(buyer).approve(
        await escrowPayment.getAddress(),
        ITEM_PRICE
      );
      await mockUSDC.connect(buyer2).approve(
        await escrowPayment.getAddress(),
        ITEM_PRICE
      );

      // Both buyers purchase
      await escrowPayment.connect(buyer).buyItem(1);
      await escrowPayment.connect(buyer2).buyItem(1);

      // Check purchase count
      expect(await escrowPayment.getPurchaseCount(1)).to.equal(2);

      // Check individual purchases
      const purchase1 = await escrowPayment.getPurchase(1, 0);
      const purchase2 = await escrowPayment.getPurchase(1, 1);

      expect(purchase1.buyer).to.equal(buyer.address);
      expect(purchase2.buyer).to.equal(buyer2.address);
      expect(purchase1.amount).to.equal(ITEM_PRICE);
      expect(purchase2.amount).to.equal(ITEM_PRICE);
    });
  });

  describe("Refund System", function () {
    beforeEach(async function () {
      // List and purchase an item
      await escrowPayment.connect(creator).listItem(
        creator.address,
        ITEM_PRICE,
        "Refundable Item"
      );

      await mockUSDC.connect(buyer).approve(
        await escrowPayment.getAddress(),
        ITEM_PRICE
      );
      await escrowPayment.connect(buyer).buyItem(1);
    });

    it("Should process refunds correctly", async function () {
      const buyerBalanceBefore = await mockUSDC.balanceOf(buyer.address);
      
      // Admin approves refund amount
      await mockUSDC.connect(admin).approve(
        await escrowPayment.getAddress(),
        ITEM_PRICE
      );

      // Issue refund
      await expect(
        escrowPayment.connect(admin).refund(1, 0)
      ).to.emit(escrowPayment, "RefundIssued")
        .withArgs(1, buyer.address, ITEM_PRICE);

      // Check buyer received refund
      const buyerBalanceAfter = await mockUSDC.balanceOf(buyer.address);
      expect(buyerBalanceAfter - buyerBalanceBefore).to.equal(ITEM_PRICE);

      // Check purchase is marked as refunded
      const purchase = await escrowPayment.getPurchase(1, 0);
      expect(purchase.refunded).to.be.true;
    });

    it("Should prevent double refunds", async function () {
      // Admin approves refund amount
      await mockUSDC.connect(admin).approve(
        await escrowPayment.getAddress(),
        ITEM_PRICE * 2n
      );

      // First refund should work
      await escrowPayment.connect(admin).refund(1, 0);

      // Second refund should fail
      await expect(
        escrowPayment.connect(admin).refund(1, 0)
      ).to.be.revertedWith("Already refunded");
    });
  });

  describe("Item Management", function () {
    it("Should toggle item status correctly", async function () {
      // List an item
      await escrowPayment.connect(creator).listItem(
        creator.address,
        ITEM_PRICE,
        "Toggle Item"
      );

      // Creator can toggle
      await escrowPayment.connect(creator).toggleItemStatus(1);
      let item = await escrowPayment.getItem(1);
      expect(item.active).to.be.false;

      // Admin can toggle
      await escrowPayment.connect(admin).toggleItemStatus(1);
      item = await escrowPayment.getItem(1);
      expect(item.active).to.be.true;

      // Others cannot toggle
      await expect(
        escrowPayment.connect(buyer).toggleItemStatus(1)
      ).to.be.revertedWith("Not authorized");
    });

    it("Should track creator and buyer items", async function () {
      // List multiple items
      await escrowPayment.connect(creator).listItem(
        creator.address,
        ITEM_PRICE,
        "Item 1"
      );
      await escrowPayment.connect(creator).listItem(
        creator.address,
        ITEM_PRICE * 2n,
        "Item 2"
      );

      // Check creator items
      const creatorItems = await escrowPayment.getCreatorItems(creator.address);
      expect(creatorItems.length).to.equal(2);
      expect(creatorItems[0]).to.equal(1);
      expect(creatorItems[1]).to.equal(2);

      // Purchase items
      await mockUSDC.connect(buyer).approve(
        await escrowPayment.getAddress(),
        ITEM_PRICE * 3n
      );
      await escrowPayment.connect(buyer).buyItem(1);
      await escrowPayment.connect(buyer).buyItem(2);

      // Check buyer purchases
      const buyerPurchases = await escrowPayment.getBuyerPurchases(buyer.address);
      expect(buyerPurchases.length).to.equal(2);
      expect(buyerPurchases[0]).to.equal(1);
      expect(buyerPurchases[1]).to.equal(2);
    });
  });

  describe("Edge Cases", function () {
    it("Should handle zero fee correctly", async function () {
      // Deploy with zero fee
      const EscrowPayment = await ethers.getContractFactory("EscrowPayment");
      const zeroFeeEscrow = await EscrowPayment.deploy(
        await mockUSDC.getAddress(),
        0, // 0% fee
        admin.address
      );

      await zeroFeeEscrow.connect(creator).listItem(
        creator.address,
        ITEM_PRICE,
        "Zero Fee Item"
      );

      const creatorBalanceBefore = await mockUSDC.balanceOf(creator.address);
      const adminBalanceBefore = await mockUSDC.balanceOf(admin.address);

      await mockUSDC.connect(buyer).approve(
        await zeroFeeEscrow.getAddress(),
        ITEM_PRICE
      );
      await zeroFeeEscrow.connect(buyer).buyItem(1);

      // Creator should get full amount
      const creatorBalanceAfter = await mockUSDC.balanceOf(creator.address);
      expect(creatorBalanceAfter - creatorBalanceBefore).to.equal(ITEM_PRICE);

      // Admin should get nothing
      const adminBalanceAfter = await mockUSDC.balanceOf(admin.address);
      expect(adminBalanceAfter).to.equal(adminBalanceBefore);
    });

    it("Should handle maximum fee correctly", async function () {
      const maxFee = 2500; // 25%
      
      // Deploy with max fee
      const EscrowPayment = await ethers.getContractFactory("EscrowPayment");
      const maxFeeEscrow = await EscrowPayment.deploy(
        await mockUSDC.getAddress(),
        maxFee,
        admin.address
      );

      await maxFeeEscrow.connect(creator).listItem(
        creator.address,
        ITEM_PRICE,
        "Max Fee Item"
      );

      const expectedFee = (ITEM_PRICE * BigInt(maxFee)) / 10000n;
      const expectedCreatorPayout = ITEM_PRICE - expectedFee;

      await mockUSDC.connect(buyer).approve(
        await maxFeeEscrow.getAddress(),
        ITEM_PRICE
      );

      await expect(
        maxFeeEscrow.connect(buyer).buyItem(1)
      ).to.emit(maxFeeEscrow, "ItemPurchased")
        .withArgs(1, buyer.address, creator.address, ITEM_PRICE, expectedFee, expectedCreatorPayout);
    });
  });

  describe("Emergency Functions", function () {
    it("Should allow emergency withdrawal by admin", async function () {
      // Send some tokens to contract (simulate stuck tokens)
      await mockUSDC.mint(await escrowPayment.getAddress(), ITEM_PRICE);

      const adminBalanceBefore = await mockUSDC.balanceOf(admin.address);

      // Emergency withdraw
      await escrowPayment.connect(admin).emergencyWithdraw(
        await mockUSDC.getAddress(),
        ITEM_PRICE
      );

      const adminBalanceAfter = await mockUSDC.balanceOf(admin.address);
      expect(adminBalanceAfter - adminBalanceBefore).to.equal(ITEM_PRICE);
    });

    it("Should reject emergency withdrawal by non-admin", async function () {
      await expect(
        escrowPayment.connect(buyer).emergencyWithdraw(
          await mockUSDC.getAddress(),
          ITEM_PRICE
        )
      ).to.be.revertedWithCustomError(escrowPayment, "OwnableUnauthorizedAccount");
    });
  });
});