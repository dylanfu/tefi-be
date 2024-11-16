// Types
export interface Trade {
  ticker: string;
  orderType: "LONG" | "SHORT";
  quantity: number;
  entryPrice: number;
  exitPrice: number;
  stopLoss: number;
  createdAt: string;
}
