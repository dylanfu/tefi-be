import { Router } from "express";
import { ExecuteTradeService } from "../services/ExecuteTradeService";

const router = Router();
const tradeService = new ExecuteTradeService(
  process.env.RPC_URL as string,
  process.env.PRIVATE_KEY as string,
  process.env.TRADER_CONTRACT_ADDRESS as string,
  process.env.ORDER_MANAGER_ADDRESS as string
);

// Market Buy
router.post("/market-buy", async (req, res) => {
  try {
    const { tokenAddress, ethAmount, maxSlippage } = req.body;
    const result = await tradeService.executeBuyOrder(
      tokenAddress,
      ethAmount,
      maxSlippage,
    );
    res.json({ success: true, transaction: result });
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    res.status(400).json({ success: false, error: errorMessage });
  }
});

// Market Sell
router.post("/market-sell", async (req, res) => {
  try {
    const { tokenAddress, tokenAmount, maxSlippage } = req.body;
    const result = await tradeService.executeSellOrder(
      tokenAddress,
      tokenAmount,
      maxSlippage,
    );
    res.json({ success: true, transaction: result });
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    res.status(400).json({ success: false, error: errorMessage });
  }
});

// Limit Buy
router.post("/limit-buy", async (req, res) => {
  try {
    const { tokenAddress, ethAmount, limitPrice } = req.body;
    const orderId = await tradeService.createLimitBuyOrder(
      tokenAddress,
      ethAmount,
      limitPrice,
    );
    res.json({ success: true, orderId });
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    res.status(400).json({ success: false, error: errorMessage });
  }
});

// Limit Sell
router.post("/limit-sell", async (req, res) => {
  try {
    const { tokenAddress, tokenAmount, limitPrice } = req.body;
    const orderId = await tradeService.createLimitSellOrder(
      tokenAddress,
      tokenAmount,
      limitPrice,
    );
    res.json({ success: true, orderId });
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    res.status(400).json({ success: false, error: errorMessage });
  }
});

// Stop Loss
router.post("/stop-loss", async (req, res) => {
  try {
    const { tokenAddress, tokenAmount, stopPrice } = req.body;
    const orderId = await tradeService.setStopLossOrder(
      tokenAddress,
      tokenAmount,
      stopPrice,
    );
    res.json({ success: true, orderId });
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    res.status(400).json({ success: false, error: errorMessage });
  }
});

// Get Token Price
router.get("/price/:tokenAddress", async (req, res) => {
  try {
    const { tokenAddress } = req.params;
    const price = await tradeService.getTokenPrice(tokenAddress);
    res.json({ success: true, price });
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    res.status(400).json({ success: false, error: errorMessage });
  }
});

// Cancel Order
router.delete("/order/:orderId", async (req, res) => {
  try {
    const { orderId } = req.params;
    const result = tradeService.cancelOrder(orderId);
    res.json({ success: result });
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    res.status(400).json({ success: false, error: errorMessage });
  }
});

// Get Active Orders
router.get("/orders", async (req, res) => {
  try {
    const orders = tradeService.getActiveOrders();
    res.json({ success: true, orders });
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    res.status(400).json({ success: false, error: errorMessage });
  }
});

export default router;
