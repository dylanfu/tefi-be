import { Router } from "express";
import { StorageService } from "../services/StorageService";
import { Trade } from "../types/TradeTypes";
import { NillionConfig } from "../types/NillionTypes";

const router = Router();

const nillionConfig: NillionConfig = {
  appId: process.env.NILLION_APP_ID as string,
  userSeed: process.env.NILLION_USER_SEED as string,
  apiBase: process.env.NILLION_API_BASE as string,
};

const storageService = new StorageService(nillionConfig);

// Store new trade
router.post("/", async (req, res) => {
  try {
    const trade: Trade = req.body;
    const secretName = storageService.generateSecretName(trade);
    const result = await storageService.saveTrade(trade);
    res.json({ success: true, storeId: result.store_id, secretName });
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    res.status(400).json({ success: false, error: errorMessage });
  }
});

// Retrieve trade
router.get("/:storeId/:secretName", async (req, res) => {
  try {
    const { storeId, secretName } = req.params;
    const trade = await storageService.getTrade(storeId, secretName);
    res.json({ success: true, trade });
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    res.status(400).json({ success: false, error: errorMessage });
  }
});

// Update trade
router.put("/:storeId/:secretName", async (req, res) => {
  try {
    const { storeId, secretName } = req.params;
    const trade: Trade = req.body;
    const result = await storageService.modifyTrade(storeId, secretName, trade);
    res.json({ success: true, storeId: result.store_id });
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    res.status(400).json({ success: false, error: errorMessage });
  }
});

export default router;
