import { Request, Response, NextFunction } from "express";
import { extractToken, JwtPayload, verifyToken } from "../lib/auth.js";
import { supabase } from "../lib/supabase.js";

declare global {
  namespace Express {
    interface Request {
      user?: JwtPayload;
    }
  }
}

/**
 * requireAuth middleware
 * Verifies our custom JWT and fetches the user profile from Supabase.
 */
export async function requireAuth(req: Request, res: Response, next: NextFunction) {
  const token = extractToken(req.headers.authorization);
  if (!token) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  try {
    // 1. Verify our custom JWT (signed with JWT_SECRET)
    const payload = verifyToken(token);
    if (!payload || !payload.userId) {
      throw new Error("Invalid custom token payload");
    }

    // 2. Fetch the latest profile from Supabase to ensure roles/status are up to date
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', payload.userId)
      .single();

    if (profileError || !profile) {
      // Fallback for demo/system stability if profile is somehow missing
      req.user = payload;
    } else {
      if (profile.status === "rejected") {
        res.status(403).json({ error: "Account has been rejected." });
        return;
      }
      if (profile.status !== "active") {
        res.status(403).json({ error: "Account is not active. Please wait for approval." });
        return;
      }
      
      // Update payload with latest database info
      req.user = {
        userId: profile.id,
        email: profile.email,
        role: profile.role || "student",
        name: profile.name,
      };
    }
    next();
  } catch (err: any) {
    console.error("Auth Middleware Error:", err.message);
    res.status(401).json({ error: "Invalid session. Please login again." });
  }
}

export function requireRole(...roles: string[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }
    if (!roles.includes(req.user.role)) {
      res.status(403).json({ error: "Forbidden" });
      return;
    }
    next();
  };
}
