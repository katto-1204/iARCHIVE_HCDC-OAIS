import pino from "pino";

const isProduction = process.env.NODE_ENV === "production";

export const logger = isProduction 
  ? { 
      info: (...args: any[]) => console.log(...args), 
      error: (...args: any[]) => console.error(...args), 
      warn: (...args: any[]) => console.warn(...args),
      debug: (...args: any[]) => console.debug(...args),
    } as any
  : pino({
      level: process.env.LOG_LEVEL ?? "info",
      redact: [
        "req.headers.authorization",
        "req.headers.cookie",
        "res.headers['set-cookie']",
      ],
      transport: {
        target: "pino-pretty",
        options: { colorize: true },
      },
    });
