import { NillionClient } from "./NillionClient";
import { NillionConfig, StoreResult } from "../types/NillionTypes";
import { Trade } from "../types/TradeTypes";

export class TradeStorageClient {
  private client: NillionClient;

  constructor(config: NillionConfig) {
    this.client = new NillionClient(config);
  }

  async storeTrade(trade: Trade): Promise<StoreResult> {
    // Convert trade object to string
    const tradeString = JSON.stringify(trade);
    return await this.client.createSecret(
      tradeString,
      `trade_${trade.ticker}_${trade.createdAt}`,
    );
  }

  async retrieveTrade(storeId: string, secretName: string): Promise<Trade> {
    const result = await this.client.getSecret(storeId, secretName);
    return JSON.parse(result.secret_value as string);
  }

  async updateTrade(
    storeId: string,
    secretName: string,
    trade: Trade,
  ): Promise<StoreResult> {
    const tradeString = JSON.stringify(trade);
    return await this.client.updateSecret(storeId, secretName, tradeString);
  }
}
