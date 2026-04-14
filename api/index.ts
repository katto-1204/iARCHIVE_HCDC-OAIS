/**
 * Vercel Serverless Function entry point.
 */
import app from "../api-server/src/app";

export default async function handler(req: any, res: any) {
  try {
    return app(req, res);
  } catch (error: any) {
    console.error("Vercel Function Error:", error);
    res.status(500).json({
      message: "Vercel Serverless Function Runtime Error",
      error: error.message,
      stack: error.stack,
      cwd: process.cwd(),
      env: process.env.NODE_ENV
    });
  }
}

