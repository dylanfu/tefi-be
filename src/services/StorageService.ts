import { TradeStorageClient } from "../clients/TradeStorageClient";
import { Trade } from "../types/TradeTypes";
import { NillionConfig, StoreResult } from "../types/NillionTypes";

export class StorageService {
  private storageClient: TradeStorageClient;

  constructor(config: NillionConfig) {
    this.storageClient = new TradeStorageClient(config);
  }

  async saveTrade(trade: Trade): Promise<StoreResult> {
    try {
      return await this.storageClient.storeTrade(trade);
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      throw new Error(`Failed to save trade: ${errorMessage}`);
    }
  }

  async getTrade(storeId: string, secretName: string): Promise<Trade> {
    try {
      return await this.storageClient.retrieveTrade(storeId, secretName);
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      throw new Error(`Failed to retrieve trade: ${errorMessage}`);
    }
  }

  async modifyTrade(
    storeId: string,
    secretName: string,
    trade: Trade,
  ): Promise<StoreResult> {
    try {
      return await this.storageClient.updateTrade(storeId, secretName, trade);
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      throw new Error(`Failed to update trade: ${errorMessage}`);
    }
  }

  generateSecretName(trade: Trade): string {
    return `trade_${trade.ticker}_${trade.createdAt}`;
  }
}
