import express, { Express, Request, Response } from "express";
import { config } from "dotenv";
import { resolve } from "path";
import storeRoutes from "./routes/Store";
import tradeRoutes from "./routes/Trade";

// Configure dotenv with explicit path
const result = config({ path: resolve(__dirname, "../.env") });
console.log('Dotenv config result:', {
    error: result.error,
    parsed: result.parsed,
    envPath: resolve(__dirname, "../.env")
});

const app: Express = express();
const port = process.env.PORT || 3000;

app.use(express.json());

app.get("/", (req: Request, res: Response) => {
  res.send("Express + TypeScript Server");
});

app.get("/health", (req: Request, res: Response) => {
  res.status(200).json({
    status: "ok",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

app.use("/store", storeRoutes);
app.use("/trade", tradeRoutes);

app.listen(port, () => {
  console.log(`⚡️[server]: Server is running at http://localhost:${port}`);
});
