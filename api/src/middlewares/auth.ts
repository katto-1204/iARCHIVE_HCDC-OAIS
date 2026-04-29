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
 * Now with a built-in bypass for the System Administrator.
 */
export async function requireAuth(req: Request, res: Response, next: NextFunction) {
  const token = extractToken(req.headers.authorization);
  if (!token) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  try {
    const payload = verifyToken(token);
    if (!payload || !payload.userId) {
      throw new Error("Invalid token");
    }

    // ─── ADMIN BYPASS CHECK ───
    // If it's the demo admin or the specific admin email, grant instant access
    if (payload.userId === 'da000000-0000-0000-0000-000000000001' || payload.email === 'admin@hcdc.edu.ph') {
      req.user = {
        userId: payload.userId,
        email: payload.email || 'admin@hcdc.edu.ph',
        role: 'admin',
        name: payload.name || 'System Administrator'
      };
      return next();
    }

    // Regular database verification for all other users
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', payload.userId)
      .single();

    if (profileError || !profile) {
      // Fallback for safety during transitions
      req.user = payload;
    } else {
      if (profile.status === "rejected") {
        return res.status(403).json({ error: "Account has been rejected." });
      }
      if (profile.status !== "active") {
        return res.status(403).json({ error: "Account is pending approval." });
      }
      
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
    res.status(401).json({ error: "Invalid session." });
  }
}

export function requireRole(...roles: string[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) return res.status(401).json({ error: "Unauthorized" });
    if (!roles.includes(req.user.role)) return res.status(403).json({ error: "Forbidden" });
    next();
  };
}
