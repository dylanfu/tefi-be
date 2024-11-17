import { ethers } from "ethers";
import { UniswapTraderClient } from "../clients/UniswapTraderClient";
import { OrderInfo } from "../types/UniswapTypes";

export class ExecuteTradeService {
  private trader: UniswapTraderClient;

  constructor(
    rpcUrl: string,
    privateKey: string,
    traderAddress: string,
    orderManagerAddress: string
  ) {
    if (!privateKey?.match(/^(0x)?[0-9a-fA-F]{64}$/)) {
      throw new Error('Invalid private key format');
    }
    const provider = new ethers.JsonRpcProvider(rpcUrl);
    this.trader = new UniswapTraderClient(
      provider,
      privateKey,
      traderAddress,
      orderManagerAddress
    );
  }

  async executeBuyOrder(
    tokenAddress: string,
    ethAmount: number,
    maxSlippage: number = 0.5,
  ): Promise<any> {
    try {
      return await this.trader.marketBuy(tokenAddress, ethAmount, maxSlippage);
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      throw new Error(`Failed to execute buy order: ${errorMessage}`);
    }
  }

  async executeSellOrder(
    tokenAddress: string,
    tokenAmount: string,
    maxSlippage: number = 0.5,
  ): Promise<any> {
    try {
      const amount = ethers.parseUnits(tokenAmount, 18);
      return await this.trader.marketSell(tokenAddress, amount, maxSlippage);
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      throw new Error(`Failed to execute sell order: ${errorMessage}`);
    }
  }

  async createLimitBuyOrder(
    tokenAddress: string,
    ethAmount: number,
    limitPrice: number,
  ): Promise<string> {
    try {
      return await this.trader.placeLimitBuy(
        tokenAddress,
        ethAmount,
        limitPrice,
      );
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      throw new Error(`Failed to create limit buy order: ${errorMessage}`);
    }
  }

  async createLimitSellOrder(
    tokenAddress: string,
    tokenAmount: string,
    limitPrice: number,
  ): Promise<string> {
    try {
      const amount = ethers.parseUnits(tokenAmount, 18);
      return await this.trader.placeLimitSell(tokenAddress, amount, limitPrice);
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      throw new Error(`Failed to create limit sell order: ${errorMessage}`);
    }
  }

  async setStopLossOrder(
    tokenAddress: string,
    tokenAmount: string,
    stopPrice: number,
  ): Promise<string> {
    try {
      const amount = ethers.parseUnits(tokenAmount, 18);
      return await this.trader.setStopLoss(tokenAddress, stopPrice, amount);
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      throw new Error(`Failed to set stop loss: ${errorMessage}`);
    }
  }

  async getTokenPrice(tokenAddress: string): Promise<string> {
    try {
      return await this.trader.getTokenPrice(tokenAddress);
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      throw new Error(`Failed to get token price: ${errorMessage}`);
    }
  }

  cancelOrder(orderId: string): boolean {
    return this.trader.cancelOrder(orderId);
  }

  getActiveOrders(): OrderInfo[] {
    return this.trader.getActiveOrders();
  }
}
