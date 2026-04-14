/**
 * Vercel Serverless Function entry point.
 *
 * Wraps the Express API server so it runs as a Vercel serverless function.
 * All /api/* requests are routed here via the rewrites in vercel.json.
 */
import app from "../api-server/src/app";

export default app;
