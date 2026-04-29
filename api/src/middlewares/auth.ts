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

export async function requireAuth(req: Request, res: Response, next: NextFunction) {
  const token = extractToken(req.headers.authorization);
  if (!token) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  try {
    const { data: { user: authUser }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !authUser) {
      throw new Error("Invalid Supabase token");
    }

    // Fetch profile for role and status
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', authUser.id)
      .single();

    if (profileError || !profile) {
      console.warn(`Auth Warning: No profile found in Supabase for user ${authUser.id} (${authUser.email}). Defaulting to student role.`);
      // If profile doesn't exist, we fallback to default student role
      req.user = {
        userId: authUser.id,
        email: authUser.email || "",
        role: "student",
        name: authUser.user_metadata?.full_name || authUser.email || "User",
      };
    } else {
      if (profile.status !== "active") {
        res.status(403).json({ error: "Account is not active. Please wait for approval." });
        return;
      }
      req.user = {
        userId: authUser.id,
        email: profile.email || authUser.email || "",
        role: profile.role || "student",
        name: profile.name || authUser.user_metadata?.full_name || "User",
      };
    }
    next();
  } catch (err: any) {
    // Legacy support for local JWTs if needed during migration
    try {
      const payload = verifyToken(token);
      req.user = payload;
      next();
    } catch {
      res.status(401).json({ error: "Invalid session. Please login again." });
    }
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
