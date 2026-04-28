import { Request, Response, NextFunction } from "express";
import { extractToken, JwtPayload, verifyToken } from "../lib/auth.js";
import { getFirebaseAuth } from "../lib/firebase.js";
import { getFirestoreDb } from "../lib/firebase.js";

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
    const auth = getFirebaseAuth();
    const decoded = await auth.verifyIdToken(token);
    const db = getFirestoreDb();
    let profileSnap = await db.collection("users").doc(decoded.uid).get();
    if (!profileSnap.exists && decoded.email) {
      const normalizedEmail = String(decoded.email).trim().toLowerCase();
      const byEmail = await db.collection("users").where("email", "==", normalizedEmail).limit(1).get();
      if (!byEmail.empty) {
        const existingData = byEmail.docs[0].data() as any;
        await db.collection("users").doc(decoded.uid).set(
          {
            ...existingData,
            id: decoded.uid,
            email: existingData?.email || normalizedEmail,
            updatedAt: new Date().toISOString(),
          },
          { merge: true }
        );
        profileSnap = await db.collection("users").doc(decoded.uid).get();
      }
    }
    if (profileSnap.exists) {
      const profile = profileSnap.data() as any;
      const status = profile?.status || "active";
      if (status !== "active") {
        res.status(403).json({ error: "Account is not active. Please wait for approval." });
        return;
      }
      req.user = {
        userId: decoded.uid,
        email: profile?.email || decoded.email || "",
        role: profile?.role || "student",
        name: profile?.name || decoded.name || decoded.email || "User",
      };
      next();
      return;
    }

    req.user = {
      userId: decoded.uid,
      email: decoded.email || "",
      role: (decoded.role as string) || "student",
      name: (decoded.name as string) || decoded.email || "User",
    };
    next();
  } catch {
    try {
      const payload = verifyToken(token);
      req.user = payload;
      next();
    } catch {
      res.status(401).json({ error: "Invalid token" });
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
