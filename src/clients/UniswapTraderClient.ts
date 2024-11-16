import { ethers } from "ethers";
import { Provider, Contract, Wallet } from "ethers";
import { Order, OrderInfo, TradeParams } from "../types/UniswapTypes";

export class UniswapTraderClient {
  private provider: Provider;
  private signer: Wallet;
  private router: Contract;
  private quoter: Contract;
  private readonly WETH: string;
  private activeOrders: Map<string, Order>;

  constructor(provider: Provider, privateKey: string) {
    this.provider = provider;
    this.signer = new Wallet(privateKey, provider);
    this.router = new Contract(
      "0xE592427A0AEce92De3Edee1F18E0157C05861564",
      [
        "function exactInputSingle(tuple(address tokenIn, address tokenOut, uint24 fee, address recipient, uint256 deadline, uint256 amountIn, uint256 amountOutMinimum, uint160 sqrtPriceLimitX96)) external payable returns (uint256 amountOut)",
      ],
      this.signer,
    );
    this.quoter = new Contract(
      "0xb27308f9F90D607463bb33eA1BeBb41C27CE5AB6",
      [
        "function quoteExactInputSingle(address tokenIn, address tokenOut, uint24 fee, uint256 amountIn, uint160 sqrtPriceLimitX96) external returns (uint256 amountOut)",
      ],
      this.provider,
    );
    this.WETH = "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2";
    this.activeOrders = new Map<string, Order>();
  }

  private async createTradeParams(
    tokenIn: string,
    tokenOut: string,
    amountIn: bigint,
  ): Promise<TradeParams> {
    const recipient = await this.signer.getAddress();
    return {
      tokenIn,
      tokenOut,
      fee: 3000,
      recipient,
      deadline: Math.floor(Date.now() / 1000) + 300,
      amountIn,
      amountOutMinimum: BigInt(0),
      sqrtPriceLimitX96: 0,
    };
  }

  public async marketBuy(
    tokenAddress: string,
    ETHAmount: number,
    maxSlippage: number = 0.5,
  ): Promise<any> {
    const amountIn = ethers.parseEther(ETHAmount.toString());
    const params = await this.createTradeParams(
      this.WETH,
      tokenAddress,
      amountIn,
    );

    try {
      const tx = await this.router.exactInputSingle(params, {
        value: amountIn,
        gasLimit: 300000,
      });
      return await tx.wait();
    } catch (error) {
      console.error("Buy failed:", error);
      throw error;
    }
  }

  public async marketSell(
    tokenAddress: string,
    amount: bigint,
    maxSlippage: number = 0.5,
  ): Promise<any> {
    const token = new Contract(
      tokenAddress,
      [
        "function approve(address spender, uint256 amount) external returns (bool)",
      ],
      this.signer,
    );

    await token.approve(this.router.address, amount);
    const params = await this.createTradeParams(
      tokenAddress,
      this.WETH,
      amount,
    );

    try {
      const tx = await this.router.exactInputSingle(params, {
        gasLimit: 300000,
      });
      return await tx.wait();
    } catch (error) {
      console.error("Sell failed:", error);
      throw error;
    }
  }

  public async getTokenPrice(
    tokenAddress: string,
    amount: bigint = ethers.parseEther("1"),
  ): Promise<string> {
    try {
      const quote = await this.quoter.quoteExactInputSingle(
        tokenAddress,
        this.WETH,
        3000,
        amount,
        0,
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
    limitPrice: number,
  ): Promise<string> {
    const orderId = Date.now().toString();

    const checkInterval = setInterval(async () => {
      try {
        const currentPrice = parseFloat(await this.getTokenPrice(tokenAddress));
        console.log(
          `Current price: ${currentPrice}, Limit price: ${limitPrice}`,
        );

        if (currentPrice <= limitPrice) {
          console.log("Limit buy triggered at price:", currentPrice);
          await this.marketBuy(tokenAddress, ETHAmount, 1);
          this.cancelOrder(orderId);
        }
      } catch (error) {
        console.error("Error monitoring limit buy:", error);
      }
    }, 15000);

    this.activeOrders.set(orderId, {
      type: "LIMIT_BUY",
      interval: checkInterval,
      tokenAddress,
      amount: ETHAmount,
      price: limitPrice,
    });

    return orderId;
  }

  public async placeLimitSell(
    tokenAddress: string,
    tokenAmount: bigint,
    limitPrice: number,
  ): Promise<string> {
    const orderId = Date.now().toString();
    const token = new Contract(
      tokenAddress,
      [
        "function approve(address spender, uint256 amount) external returns (bool)",
      ],
      this.signer,
    );

    await token.approve(this.router.address, tokenAmount);

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
      this.signer,
    );

    await token.approve(this.router.address, amount);

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
async function example(): Promise<void> {
  const provider = new ethers.JsonRpcProvider("YOUR_RPC_URL");
  const trader = new UniswapTraderClient(provider, "YOUR_PRIVATE_KEY");

  try {
    // Place a limit buy order
    const limitBuyId = await trader.placeLimitBuy(
      "0x1234...", // Token address
      0.1, // Buy with 0.1 ETH
      0.00005, // Limit price in ETH
    );

    // Place a limit sell order
    const limitSellId = await trader.placeLimitSell(
      "0x1234...", // Token address
      ethers.parseUnits("100", 18), // Amount of tokens to sell
      0.00006, // Limit price in ETH
    );

    // Set stop loss
    const stopLossId = await trader.setStopLoss(
      "0x1234...", // Token address
      0.00004, // Stop price in ETH
      ethers.parseUnits("100", 18), // Amount to sell
    );

    // Check active orders
    const activeOrders = trader.getActiveOrders();
    console.log("Active orders:", activeOrders);

    // Cancel an order
    trader.cancelOrder(limitBuyId);
  } catch (error) {
    console.error("Error in trading example:", error);
  }
}
