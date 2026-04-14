import pino from "pino";

const isProduction = process.env.NODE_ENV === "production";

// pino-http REQUIRES a real pino instance. 
// We use a real one even in production, but without the 'pretty' transport.
export const logger = isProduction 
  ? pino({
      level: process.env.LOG_LEVEL || "info",
      base: undefined, // Remove pid/hostname for cleaner Vercel logs
    })
  : pino({
      level: process.env.LOG_LEVEL || "info",
      transport: {
        target: "pino-pretty",
        options: { colorize: true },
      },
    });
