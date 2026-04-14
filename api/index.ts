import "dotenv/config";
import express from "express";
import cors from "cors";
import router from "./src/routes/index.js";
import { logger } from "./src/lib/logger.js";
import pinoHttp from "pino-http";

const app = express();

// @ts-ignore
const pino = (pinoHttp as any).default || pinoHttp;

app.use((pino as any)({ logger }));

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Test route
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", message: "iArchive Vercel API is live", time: new Date().toISOString() });
});

app.use("/api", router);

// Final fallback for 404
app.use((req, res) => {
  console.log("404 Not Found:", req.url);
  res.status(404).json({ message: "Route not found", url: req.url });
});

// Start listen if running locally
if (process.env.NODE_ENV !== "production") {
  const port = process.env.PORT || 5000;
  app.listen(port, () => console.log(`Local dev server listening on ${port}`));
}

export default app;
