// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";

/**
 * @title EscrowPayment
 * @dev Escrow contract for handling payments between creators and buyers
 * Platform takes a fee, remainder goes directly to creator
 */
contract EscrowPayment is Ownable, ReentrancyGuard, Pausable {
    using SafeERC20 for IERC20;

    // Events
    event ItemListed(
        uint256 indexed itemId,
        address indexed creator,
        uint256 price,
        string title
    );
    
    event ItemPurchased(
        uint256 indexed itemId,
        address indexed buyer,
        address indexed creator,
        uint256 totalPrice,
        uint256 platformFee,
        uint256 creatorPayout
    );
    
    event RefundIssued(
        uint256 indexed itemId,
        address indexed buyer,
        uint256 amount
    );
    
    event FeeUpdated(uint256 oldFee, uint256 newFee);

    // Structs
    struct Item {
        address creator;
        uint256 price;
        string title;
        bool exists;
        bool active;
    }

    struct Purchase {
        address buyer;
        uint256 amount;
        uint256 timestamp;
        bool refunded;
    }

    // State variables
    IERC20 public immutable usdcToken;
    uint256 public platformFeePercent; // Basis points (100 = 1%)
    
    mapping(uint256 => Item) public items;
    mapping(uint256 => Purchase[]) public purchases;
    mapping(address => uint256[]) public creatorItems;
    mapping(address => uint256[]) public buyerPurchases;
    
    uint256 public nextItemId = 1;
    uint256 public constant MAX_FEE_PERCENT = 2500; // 25% max fee

    constructor(
        address _usdcToken,
        uint256 _platformFeePercent,
        address _admin
    ) Ownable(_admin) {
        require(_usdcToken != address(0), "Invalid USDC address");
        require(_platformFeePercent <= MAX_FEE_PERCENT, "Fee too high");
        
        usdcToken = IERC20(_usdcToken);
        platformFeePercent = _platformFeePercent;
    }

    /**
     * @dev List a new item for sale
     * @param _creator Address that will receive payments
     * @param _price Price in USDC (with 6 decimals)
     * @param _title Item title/description
     */
    function listItem(
        address _creator,
        uint256 _price,
        string calldata _title
    ) external whenNotPaused returns (uint256) {
        require(_creator != address(0), "Invalid creator address");
        require(_price > 0, "Price must be greater than 0");
        require(bytes(_title).length > 0, "Title cannot be empty");

        uint256 itemId = nextItemId++;
        
        items[itemId] = Item({
            creator: _creator,
            price: _price,
            title: _title,
            exists: true,
            active: true
        });
        
        creatorItems[_creator].push(itemId);
        
        emit ItemListed(itemId, _creator, _price, _title);
        return itemId;
    }

    /**
     * @dev Purchase an item with USDC
     * @param _itemId ID of the item to purchase
     */
    function buyItem(uint256 _itemId) external nonReentrant whenNotPaused {
        Item storage item = items[_itemId];
        require(item.exists, "Item does not exist");
        require(item.active, "Item not active");
        require(item.creator != msg.sender, "Cannot buy own item");

        uint256 totalPrice = item.price;
        uint256 platformFee = (totalPrice * platformFeePercent) / 10000;
        uint256 creatorPayout = totalPrice - platformFee;

        // Transfer USDC from buyer
        usdcToken.safeTransferFrom(msg.sender, address(this), totalPrice);

        // Transfer platform fee to admin
        if (platformFee > 0) {
            usdcToken.safeTransfer(owner(), platformFee);
        }

        // Transfer remaining amount to creator
        usdcToken.safeTransfer(item.creator, creatorPayout);

        // Record purchase
        purchases[_itemId].push(Purchase({
            buyer: msg.sender,
            amount: totalPrice,
            timestamp: block.timestamp,
            refunded: false
        }));
        
        buyerPurchases[msg.sender].push(_itemId);

        emit ItemPurchased(
            _itemId,
            msg.sender,
            item.creator,
            totalPrice,
            platformFee,
            creatorPayout
        );
    }

    /**
     * @dev Issue refund to a buyer (admin only)
     * @param _itemId ID of the item
     * @param _buyerIndex Index of the purchase in the purchases array
     */
    function refund(
        uint256 _itemId,
        uint256 _buyerIndex
    ) external onlyOwner nonReentrant {
        require(items[_itemId].exists, "Item does not exist");
        require(_buyerIndex < purchases[_itemId].length, "Invalid buyer index");
        
        Purchase storage purchase = purchases[_itemId][_buyerIndex];
        require(!purchase.refunded, "Already refunded");

        purchase.refunded = true;
        
        // Transfer refund amount from admin to buyer
        usdcToken.safeTransferFrom(owner(), purchase.buyer, purchase.amount);

        emit RefundIssued(_itemId, purchase.buyer, purchase.amount);
    }

    /**
     * @dev Update platform fee percentage (admin only)
     * @param _newFeePercent New fee percentage in basis points
     */
    function updateFeePercent(uint256 _newFeePercent) external onlyOwner {
        require(_newFeePercent <= MAX_FEE_PERCENT, "Fee too high");
        
        uint256 oldFee = platformFeePercent;
        platformFeePercent = _newFeePercent;
        
        emit FeeUpdated(oldFee, _newFeePercent);
    }

    /**
     * @dev Toggle item active status (creator or admin only)
     * @param _itemId ID of the item
     */
    function toggleItemStatus(uint256 _itemId) external {
        Item storage item = items[_itemId];
        require(item.exists, "Item does not exist");
        require(
            msg.sender == item.creator || msg.sender == owner(),
            "Not authorized"
        );
        
        item.active = !item.active;
    }

    /**
     * @dev Pause contract (admin only)
     */
    function pause() external onlyOwner {
        _pause();
    }

    /**
     * @dev Unpause contract (admin only)
     */
    function unpause() external onlyOwner {
        _unpause();
    } 
   // View functions
    
    /**
     * @dev Get item details
     */
    function getItem(uint256 _itemId) external view returns (
        address creator,
        uint256 price,
        string memory title,
        bool active
    ) {
        Item storage item = items[_itemId];
        require(item.exists, "Item does not exist");
        
        return (item.creator, item.price, item.title, item.active);
    }

    /**
     * @dev Get purchase count for an item
     */
    function getPurchaseCount(uint256 _itemId) external view returns (uint256) {
        return purchases[_itemId].length;
    }

    /**
     * @dev Get purchase details
     */
    function getPurchase(uint256 _itemId, uint256 _index) external view returns (
        address buyer,
        uint256 amount,
        uint256 timestamp,
        bool refunded
    ) {
        require(_index < purchases[_itemId].length, "Invalid index");
        Purchase storage purchase = purchases[_itemId][_index];
        
        return (purchase.buyer, purchase.amount, purchase.timestamp, purchase.refunded);
    }

    /**
     * @dev Get items created by a specific creator
     */
    function getCreatorItems(address _creator) external view returns (uint256[] memory) {
        return creatorItems[_creator];
    }

    /**
     * @dev Get items purchased by a specific buyer
     */
    function getBuyerPurchases(address _buyer) external view returns (uint256[] memory) {
        return buyerPurchases[_buyer];
    }

    /**
     * @dev Calculate fees for a given price
     */
    function calculateFees(uint256 _price) external view returns (
        uint256 platformFee,
        uint256 creatorPayout
    ) {
        platformFee = (_price * platformFeePercent) / 10000;
        creatorPayout = _price - platformFee;
    }

    /**
     * @dev Emergency withdrawal function (admin only)
     * Only for stuck tokens, should not be used in normal operations
     */
    function emergencyWithdraw(address _token, uint256 _amount) external onlyOwner {
        IERC20(_token).safeTransfer(owner(), _amount);
    }
}