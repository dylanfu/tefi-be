export const UNISWAP_TRADER_ABI = [
  "function executeMarketBuy(address tokenOut, uint256 minAmountOut) external payable returns (uint256 amountOut)",
  "function executeMarketSell(address tokenIn, uint256 amountIn, uint256 minAmountOut) external returns (uint256 amountOut)",
  "function getQuote(address tokenIn, address tokenOut, uint256 amountIn) external returns (uint256)",
] as const;

export const ORDER_MANAGER_ABI = [
  "function createLimitOrder(address tokenIn, address tokenOut, uint256 amountIn, uint256 targetPrice) external returns (bytes32)",
  "function cancelLimitOrder(bytes32 orderId) external",
  "function getUserLimitOrders(address user) external view returns (bytes32[])",
] as const; 