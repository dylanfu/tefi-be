export interface TradeParams {
  tokenIn: string;
  tokenOut: string;
  fee: number;
  recipient: string;
  deadline: number;
  amountIn: bigint;
  amountOutMinimum: bigint;
  sqrtPriceLimitX96: number;
}

type OrderType = "LIMIT_BUY" | "LIMIT_SELL" | "STOP_LOSS";

export interface Order {
  type: OrderType;
  interval: NodeJS.Timeout;
  tokenAddress: string;
  amount: bigint | number;
  price: number;
}

export interface OrderInfo {
  id: string;
  type: OrderType;
  tokenAddress: string;
  amount: bigint | number;
  price: number;
}
