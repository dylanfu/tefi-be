// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "./interfaces/ISwapRouter.sol";
import "./interfaces/IQuoter.sol";

contract UniswapTrader is Ownable, ReentrancyGuard {
    using SafeERC20 for IERC20;

    ISwapRouter public immutable swapRouter;
    IQuoter public immutable quoter;
    address public immutable WETH;
    uint24 public constant poolFee = 3000;

    struct Order {
        address owner;
        address tokenIn;
        address tokenOut;
        uint256 amountIn;
        uint256 minAmountOut;
        uint256 price;
        OrderType orderType;
        bool executed;
    }

    enum OrderType { MARKET, LIMIT_BUY, LIMIT_SELL, STOP_LOSS }

    mapping(bytes32 => Order) public orders;
    mapping(address => bytes32[]) public userOrders;

    event OrderCreated(
        bytes32 indexed orderId,
        address indexed owner,
        OrderType orderType,
        address tokenIn,
        address tokenOut,
        uint256 amountIn,
        uint256 price
    );

    event OrderExecuted(
        bytes32 indexed orderId,
        uint256 amountIn,
        uint256 amountOut
    );

    constructor(
        address _swapRouter,
        address _quoter,
        address _WETH
    ) Ownable(msg.sender) {
        swapRouter = ISwapRouter(_swapRouter);
        quoter = IQuoter(_quoter);
        WETH = _WETH;
    }

    function executeMarketBuy(
        address tokenOut,
        uint256 minAmountOut
    ) external payable nonReentrant returns (uint256 amountOut) {
        require(msg.value > 0, "Invalid ETH amount");

        ISwapRouter.ExactInputSingleParams memory params = ISwapRouter
            .ExactInputSingleParams({
                tokenIn: WETH,
                tokenOut: tokenOut,
                fee: poolFee,
                recipient: msg.sender,
                deadline: block.timestamp + 300,
                amountIn: msg.value,
                amountOutMinimum: minAmountOut,
                sqrtPriceLimitX96: 0
            });

        amountOut = swapRouter.exactInputSingle{value: msg.value}(params);
        require(amountOut >= minAmountOut, "Insufficient output");

        bytes32 orderId = keccak256(
            abi.encodePacked(
                block.timestamp,
                msg.sender,
                WETH,
                tokenOut,
                msg.value
            )
        );

        orders[orderId] = Order({
            owner: msg.sender,
            tokenIn: WETH,
            tokenOut: tokenOut,
            amountIn: msg.value,
            minAmountOut: minAmountOut,
            price: 0,
            orderType: OrderType.MARKET,
            executed: true
        });

        emit OrderExecuted(orderId, msg.value, amountOut);
        return amountOut;
    }

    function executeMarketSell(
        address tokenIn,
        uint256 amountIn,
        uint256 minAmountOut
    ) external nonReentrant returns (uint256 amountOut) {
        require(amountIn > 0, "Invalid amount");

        IERC20(tokenIn).safeTransferFrom(msg.sender, address(this), amountIn);
        IERC20(tokenIn).safeApprove(address(swapRouter), amountIn);

        ISwapRouter.ExactInputSingleParams memory params = ISwapRouter
            .ExactInputSingleParams({
                tokenIn: tokenIn,
                tokenOut: WETH,
                fee: poolFee,
                recipient: msg.sender,
                deadline: block.timestamp + 300,
                amountIn: amountIn,
                amountOutMinimum: minAmountOut,
                sqrtPriceLimitX96: 0
            });

        amountOut = swapRouter.exactInputSingle(params);
        require(amountOut >= minAmountOut, "Insufficient output");

        bytes32 orderId = keccak256(
            abi.encodePacked(
                block.timestamp,
                msg.sender,
                tokenIn,
                WETH,
                amountIn
            )
        );

        orders[orderId] = Order({
            owner: msg.sender,
            tokenIn: tokenIn,
            tokenOut: WETH,
            amountIn: amountIn,
            minAmountOut: minAmountOut,
            price: 0,
            orderType: OrderType.MARKET,
            executed: true
        });

        emit OrderExecuted(orderId, amountIn, amountOut);
        return amountOut;
    }

    function getQuote(
        address tokenIn,
        address tokenOut,
        uint256 amountIn
    ) external returns (uint256) {
        return
            quoter.quoteExactInputSingle(
                tokenIn,
                tokenOut,
                poolFee,
                amountIn,
                0
            );
    }

    // Emergency withdrawal function
    function emergencyWithdraw(
        address token,
        uint256 amount
    ) external onlyOwner {
        if (token == address(0)) {
            payable(owner()).transfer(amount);
        } else {
            IERC20(token).safeTransfer(owner(), amount);
        }
    }

    receive() external payable {}
}
