import { ethers } from "ethers";
import { Provider, Contract, Wallet } from "ethers";
import { Order, OrderInfo } from "../types/UniswapTypes";
import { UNISWAP_TRADER_ABI, ORDER_MANAGER_ABI } from "../types/contracts";

export class UniswapTraderClient {
  private provider: Provider;
  private signer: Wallet;
  private traderContract: Contract;
  private orderManagerContract: Contract;
  private readonly WETH: string;
  private activeOrders: Map<string, Order>;

  constructor(
    provider: Provider,
    privateKey: string,
    traderAddress: string,
    orderManagerAddress: string
  ) {
    this.provider = provider;
    this.signer = new Wallet(privateKey, provider);
    this.traderContract = new Contract(
      traderAddress,
      UNISWAP_TRADER_ABI,
      this.signer
    );
    this.orderManagerContract = new Contract(
      orderManagerAddress,
      ORDER_MANAGER_ABI,
      this.signer
    );
    this.WETH = "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2";
    this.activeOrders = new Map<string, Order>();
  }

  private async calculateMinimumOutput(
    tokenIn: string,
    tokenOut: string,
    amountIn: bigint,
    maxSlippage: number
  ): Promise<bigint> {
    const quote = await this.traderContract.getQuote(tokenIn, tokenOut, amountIn);
    return (quote * BigInt(Math.floor((100 - maxSlippage) * 100))) / BigInt(10000);
  }

  public async marketBuy(
    tokenAddress: string,
    ETHAmount: number,
    maxSlippage: number = 0.5
  ): Promise<any> {
    const amountIn = ethers.parseEther(ETHAmount.toString());
    const minAmountOut = await this.calculateMinimumOutput(
      this.WETH,
      tokenAddress,
      amountIn,
      maxSlippage
    );

    try {
      const tx = await this.traderContract.executeMarketBuy(
        tokenAddress,
        minAmountOut,
        {
          value: amountIn,
          gasLimit: 300000,
        }
      );
      return await tx.wait();
    } catch (error) {
      console.error("Buy failed:", error);
      throw error;
    }
  }

  public async marketSell(
    tokenAddress: string,
    amount: bigint,
    maxSlippage: number = 0.5
  ): Promise<any> {
    const token = new Contract(
      tokenAddress,
      ["function approve(address spender, uint256 amount) external returns (bool)"],
      this.signer
    );

    const minAmountOut = await this.calculateMinimumOutput(
      tokenAddress,
      this.WETH,
      amount,
      maxSlippage
    );

    await token.approve(this.traderContract.address, amount);

    try {
      const tx = await this.traderContract.executeMarketSell(
        tokenAddress,
        amount,
        minAmountOut,
        {
          gasLimit: 300000,
        }
      );
      return await tx.wait();
    } catch (error) {
      console.error("Sell failed:", error);
      throw error;
    }
  }

  public async getTokenPrice(
    tokenAddress: string,
    amount: bigint = ethers.parseEther("1")
  ): Promise<string> {
    try {
      const quote = await this.traderContract.getQuote(
        tokenAddress,
        this.WETH,
        amount
      );
      return ethers.formatEther(quote);
    } catch (error) {
      console.error("Error getting price:", error);
      throw error;
    }
  }

  public async placeLimitBuy(
    tokenAddress: string,
    ETHAmount: number,
    limitPrice: number
  ): Promise<string> {
    const amountIn = ethers.parseEther(ETHAmount.toString());
    
    try {
      const tx = await this.orderManagerContract.createLimitOrder(
        this.WETH,
        tokenAddress,
        amountIn,
        ethers.parseEther(limitPrice.toString()),
        {
          value: amountIn,
        }
      );
      const receipt = await tx.wait();
      const orderId = receipt.events[0].args.orderId;

      // Monitor order in memory
      this.monitorLimitOrder(orderId, tokenAddress, ETHAmount, limitPrice, "LIMIT_BUY");

      return orderId;
    } catch (error) {
      console.error("Error creating limit buy:", error);
      throw error;
    }
  }

  public async placeLimitSell(
    tokenAddress: string,
    tokenAmount: bigint,
    limitPrice: number
  ): Promise<string> {
    const orderId = Date.now().toString();
    const token = new Contract(
      tokenAddress,
      [
        "function approve(address spender, uint256 amount) external returns (bool)",
      ],
      this.signer
    );

    await token.approve(this.traderContract.address, tokenAmount);

    const checkInterval = setInterval(async () => {
      try {
        const currentPrice = parseFloat(await this.getTokenPrice(tokenAddress));
        console.log(
          `Current price: ${currentPrice}, Limit price: ${limitPrice}`,
        );

        if (currentPrice >= limitPrice) {
          console.log("Limit sell triggered at price:", currentPrice);
          await this.marketSell(tokenAddress, tokenAmount, 1);
          this.cancelOrder(orderId);
        }
      } catch (error) {
        console.error("Error monitoring limit sell:", error);
      }
    }, 15000);

    this.activeOrders.set(orderId, {
      type: "LIMIT_SELL",
      interval: checkInterval,
      tokenAddress,
      amount: tokenAmount,
      price: limitPrice,
    });

    return orderId;
  }

  public async setStopLoss(
    tokenAddress: string,
    stopPrice: number,
    amount: bigint,
  ): Promise<string> {
    const orderId = Date.now().toString();
    const token = new Contract(
      tokenAddress,
      [
        "function approve(address spender, uint256 amount) external returns (bool)",
      ],
      this.signer
    );

    await token.approve(this.traderContract.address, amount);

    const checkInterval = setInterval(async () => {
      try {
        const currentPrice = parseFloat(await this.getTokenPrice(tokenAddress));

        if (currentPrice <= stopPrice) {
          console.log("Stop loss triggered at price:", currentPrice);
          await this.marketSell(tokenAddress, amount, 1);
          this.cancelOrder(orderId);
        }
      } catch (error) {
        console.error("Error monitoring stop loss:", error);
      }
    }, 15000);

    this.activeOrders.set(orderId, {
      type: "STOP_LOSS",
      interval: checkInterval,
      tokenAddress,
      amount,
      price: stopPrice,
    });

    return orderId;
  }

  private async monitorLimitOrder(
    orderId: string,
    tokenAddress: string,
    amount: number | bigint,
    targetPrice: number,
    type: "LIMIT_BUY" | "LIMIT_SELL" | "STOP_LOSS"
  ) {
    const checkInterval = setInterval(async () => {
      try {
        const currentPrice = parseFloat(await this.getTokenPrice(tokenAddress));
        console.log(`Current price: ${currentPrice}, Target price: ${targetPrice}`);

        const shouldExecute = type === "LIMIT_BUY" 
          ? currentPrice <= targetPrice
          : type === "LIMIT_SELL" 
          ? currentPrice >= targetPrice
          : currentPrice <= targetPrice;

        if (shouldExecute) {
          if (type === "LIMIT_BUY") {
            await this.marketBuy(tokenAddress, Number(amount), 1);
          } else {
            await this.marketSell(tokenAddress, BigInt(amount), 1);
          }
          this.cancelOrder(orderId);
        }
      } catch (error) {
        console.error(`Error monitoring ${type}:`, error);
      }
    }, 15000);

    this.activeOrders.set(orderId, {
      type,
      interval: checkInterval,
      tokenAddress,
      amount,
      price: targetPrice,
    });
  }

  public cancelOrder(orderId: string): boolean {
    const order = this.activeOrders.get(orderId);
    if (order) {
      clearInterval(order.interval);
      this.activeOrders.delete(orderId);
      console.log(`Order ${orderId} cancelled`);
      return true;
    }
    return false;
  }

  public getActiveOrders(): OrderInfo[] {
    const orders: OrderInfo[] = [];
    for (const [id, order] of this.activeOrders) {
      orders.push({
        id,
        type: order.type,
        tokenAddress: order.tokenAddress,
        amount: order.amount,
        price: order.price,
      });
    }
    return orders;
  }
}

// Example usage:
// async function example(): Promise<void> {
//   const provider = new ethers.JsonRpcProvider("YOUR_RPC_URL");
//   const trader = new UniswapTraderClient(provider, "YOUR_PRIVATE_KEY");

//   try {
//     // Place a limit buy order
//     const limitBuyId = await trader.placeLimitBuy(
//       "0x1234...", // Token address
//       0.1, // Buy with 0.1 ETH
//       0.00005, // Limit price in ETH
//     );

//     // Place a limit sell order
//     const limitSellId = await trader.placeLimitSell(
//       "0x1234...", // Token address
//       ethers.parseUnits("100", 18), // Amount of tokens to sell
//       0.00006, // Limit price in ETH
//     );

//     // Set stop loss
//     const stopLossId = await trader.setStopLoss(
//       "0x1234...", // Token address
//       0.00004, // Stop price in ETH
//       ethers.parseUnits("100", 18), // Amount to sell
//     );

//     // Check active orders
//     const activeOrders = trader.getActiveOrders();
//     console.log("Active orders:", activeOrders);

//     // Cancel an order
//     trader.cancelOrder(limitBuyId);
//   } catch (error) {
//     console.error("Error in trading example:", error);
//   }
// }
