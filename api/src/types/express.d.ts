declare global {
  namespace Express {
    interface Request {
      user?: import("../lib/auth.js").JwtPayload;
    }
  }
}

export {};
