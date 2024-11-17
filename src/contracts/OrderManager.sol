// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "./UniswapTrader.sol";

contract OrderManager is Ownable, ReentrancyGuard {
    UniswapTrader public immutable trader;
    
    struct LimitOrder {
        address owner;
        address tokenIn;
        address tokenOut;
        uint256 amountIn;
        uint256 targetPrice;
        bool isActive;
    }

    mapping(bytes32 => LimitOrder) public limitOrders;
    mapping(address => bytes32[]) public userLimitOrders;

    event LimitOrderCreated(
        bytes32 indexed orderId,
        address indexed owner,
        address tokenIn,
        address tokenOut,
        uint256 amountIn,
        uint256 targetPrice
    );

    event LimitOrderExecuted(bytes32 indexed orderId);
    event LimitOrderCancelled(bytes32 indexed orderId);

    constructor(address _trader) Ownable(msg.sender) {
        trader = UniswapTrader(_trader);
    }

    function createLimitOrder(
        address tokenIn,
        address tokenOut,
        uint256 amountIn,
        uint256 targetPrice
    ) external nonReentrant returns (bytes32 orderId) {
        orderId = keccak256(
            abi.encodePacked(
                block.timestamp,
                msg.sender,
                tokenIn,
                tokenOut,
                amountIn,
                targetPrice
            )
        );

        limitOrders[orderId] = LimitOrder({
            owner: msg.sender,
            tokenIn: tokenIn,
            tokenOut: tokenOut,
            amountIn: amountIn,
            targetPrice: targetPrice,
            isActive: true
        });

        userLimitOrders[msg.sender].push(orderId);

        emit LimitOrderCreated(
            orderId,
            msg.sender,
            tokenIn,
            tokenOut,
            amountIn,
            targetPrice
        );
    }

    function cancelLimitOrder(bytes32 orderId) external {
        LimitOrder storage order = limitOrders[orderId];
        require(msg.sender == order.owner, "Not order owner");
        require(order.isActive, "Order not active");

        order.isActive = false;
        emit LimitOrderCancelled(orderId);
    }

    function getUserLimitOrders(
        address user
    ) external view returns (bytes32[] memory) {
        return userLimitOrders[user];
    }
}
