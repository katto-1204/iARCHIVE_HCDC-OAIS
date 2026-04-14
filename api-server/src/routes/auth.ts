import { Router } from "express";
import bcrypt from "bcryptjs";
import { signToken } from "../lib/auth.js";
import { requireAuth } from "../middlewares/auth.js";
import { jsonStoreGetUserByEmail, jsonStoreGetUserById, jsonStoreRegisterUser } from "../lib/jsonStore.js";
import { getFirebaseAuth, getFirestoreDb } from "../lib/firebase.js";

const router = Router();

const DEMO_PASSWORD = "admin123";
const DEMO_USERS = [
  { id: "demo-admin", name: "Demo Admin", email: "admin@hcdc.edu.ph", role: "admin", userCategory: "administrator", institution: "HCDC", status: "active" },
  { id: "demo-archivist", name: "Demo Archivist", email: "archivist@hcdc.edu.ph", role: "archivist", userCategory: "staff", institution: "HCDC", status: "active" },
  { id: "demo-student", name: "Demo Student", email: "student@hcdc.edu.ph", role: "student", userCategory: "student", institution: "HCDC", status: "active" },
] as const;

function getDemoUserByEmail(email?: string) {
  return DEMO_USERS.find((u) => u.email.toLowerCase() === (email || "").toLowerCase());
}

async function signInWithPassword(email: string, password: string) {
  const apiKey = process.env["FIREBASE_API_KEY"];
  if (!apiKey) {
    throw new Error("Missing FIREBASE_API_KEY");
  }
  const res = await fetch(
    `https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${apiKey}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password, returnSecureToken: true }),
    },
  );
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    const msg = (err && err.error && err.error.message) || "INVALID_LOGIN";
    throw new Error(msg);
  }
  return (await res.json()) as { idToken: string };
}

async function verifyIdTokenRestFallback(idToken: string) {
  const apiKey = process.env["FIREBASE_API_KEY"];
  if (!apiKey) {
    throw new Error("Missing FIREBASE_API_KEY for token lookup");
  }
  const res = await fetch(
    `https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${apiKey}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ idToken }),
    },
  );
  if (!res.ok) {
    throw new Error("Invalid idToken via REST");
  }
  const data = await res.json();
  const user = data.users?.[0];
  if (!user) throw new Error("No user found for idToken");
  return { uid: user.localId, email: user.email, name: user.displayName };
}

router.post("/auth/login", async (req, res) => {
  const { email, password, idToken } = req.body;
  if ((!email || !password) && !idToken) {
    res.status(400).json({ error: "Email and password or idToken required" });
    return;
  }

  // Demo accounts should always work, even if the DB is unreachable
  // or the demo users are not present in Postgres.
  const demoUser = getDemoUserByEmail(email);
  if (demoUser && password === DEMO_PASSWORD) {
    const token = signToken({ userId: demoUser.id, email: demoUser.email, role: demoUser.role, name: demoUser.name });
    res.json({
      token,
      user: {
        id: demoUser.id,
        name: demoUser.name,
        email: demoUser.email,
        role: demoUser.role,
        userCategory: demoUser.userCategory,
        institution: demoUser.institution,
        status: demoUser.status,
        createdAt: new Date().toISOString(),
      },
    });
    return;
  }

  try {
    let firebaseToken = idToken as string | undefined;
    if (!firebaseToken && email && password) {
      const result = await signInWithPassword(email, password);
      firebaseToken = result.idToken;
    }
    if (!firebaseToken) {
      res.status(401).json({ error: "Invalid credentials" });
      return;
    }
    
    let decoded: { uid: string, email?: string, name?: string };
    try {
      const auth = getFirebaseAuth();
      decoded = await auth.verifyIdToken(firebaseToken);
    } catch {
      decoded = await verifyIdTokenRestFallback(firebaseToken);
    }
    
    let profile: any = null;
    try {
      const db = getFirestoreDb();
      const profileSnap = await db.collection("users").doc(decoded.uid).get();
      if (!profileSnap.exists) {
        const now = new Date().toISOString();
        profile = {
          id: decoded.uid,
          name: decoded.name || decoded.email || "User",
          email: decoded.email || "",
          role: "student",
          userCategory: "student",
          institution: null,
          purpose: null,
          status: "pending", // Fixed: Default to pending for admin approval
          createdAt: now,
          updatedAt: now,
        };
        await db.collection("users").doc(decoded.uid).set(profile, { merge: true });
        res.status(403).json({ error: "Account is not active. Please wait for approval." });
        return;
      } else {
        profile = profileSnap.data() as any;
        if (profile.status !== "active") {
          res.status(403).json({ error: "Account is not active. Please wait for approval." });
          return;
        }
      }
    } catch {
      // Firebase DB failed (SA error). Let's check jsonStore for approval state.
      profile = jsonStoreGetUserByEmail(decoded.email || email);
      if (!profile) {
        // If they don't even exist in the JSON store fallback, they are unapproved.
        res.status(403).json({ error: "Account profile missing or not active. Please wait for approval." });
        return;
      }
      if (profile.status !== "active") {
        res.status(403).json({ error: "Account is not active. Please wait for approval." });
        return;
      }
      // Validated active JSON fallback user
    }

    res.json({
      token: firebaseToken,
      user: {
        id: decoded.uid,
        name: profile?.name || decoded.name || decoded.email || "User",
        email: profile?.email || decoded.email,
        role: profile?.role || "student",
        userCategory: profile?.userCategory || profile?.role || "student",
        institution: profile?.institution || null,
        status: profile?.status || "active",
        createdAt: profile?.createdAt || new Date().toISOString(),
      },
    });
  } catch (outerErr) {
    // If it's one of the demo accounts, never attempt bcrypt compare
    // with an absent/blank DB password hash.
    const demoUser = getDemoUserByEmail(email);
    if (demoUser) {
      res.status(401).json({ error: "Invalid credentials" });
      return;
    }

    const jsonUser = jsonStoreGetUserByEmail(email);
    if (!jsonUser || !jsonUser.passwordHash) {
      res.status(401).json({ error: "Invalid credentials" });
      return;
    }
    const valid = await bcrypt.compare(password, jsonUser.passwordHash);
    if (!valid) {
      res.status(401).json({ error: "Invalid credentials" });
      return;
    }
    if (jsonUser.status !== "active") {
      res.status(401).json({ error: "Account is not active. Please wait for approval." });
      return;
    }

    const token = signToken({ userId: jsonUser.id, email: jsonUser.email, role: jsonUser.role, name: jsonUser.name });
    res.json({
      token,
      user: {
        id: jsonUser.id,
        name: jsonUser.name,
        email: jsonUser.email,
        role: jsonUser.role,
        userCategory: jsonUser.userCategory ?? jsonUser.role,
        institution: jsonUser.institution ?? null,
        status: jsonUser.status,
        createdAt: jsonUser.createdAt,
      },
    });
  }
});

router.post("/auth/register", async (req, res) => {
  const { name, email, password, role, institution, purpose, idToken } = req.body;
  if (!name || !role || (!idToken && (!email || !password))) {
    res.status(400).json({ error: "Name, role, and credentials are required" });
    return;
  }
  try {
    let uid = "";
    let resolvedEmail = email as string | undefined;
    
    if (idToken) {
      let decoded: { uid: string, email?: string, name?: string };
      try {
        const auth = getFirebaseAuth();
        decoded = await auth.verifyIdToken(idToken);
      } catch {
        decoded = await verifyIdTokenRestFallback(idToken);
      }
      uid = decoded.uid;
      resolvedEmail = decoded.email || resolvedEmail;
    } else {
      const auth = getFirebaseAuth();
      const created = await auth.createUser({
        email,
        password,
        displayName: name,
      });
      uid = created.uid;
      resolvedEmail = created.email || resolvedEmail;
    }

    let db;
    try {
      db = getFirestoreDb();
    } catch {
      throw new Error("No Firestore DB");
    }
    const existing = await db.collection("users").doc(uid).get();
    if (existing.exists) {
      res.status(400).json({ error: "User already registered" });
      return;
    }
    const now = new Date().toISOString();
    await db.collection("users").doc(uid).set({
      id: uid,
      name,
      email: resolvedEmail || email,
      role,
      userCategory: role,
      institution: institution ?? null,
      purpose: purpose ?? null,
      status: "pending",
      createdAt: now,
      updatedAt: now,
    });
    res.status(201).json({ message: "Registration submitted. Awaiting admin approval." });
  } catch {
    const result = jsonStoreRegisterUser({ name, email, password, role, institution, purpose });
    if (!result.ok) {
      res.status(400).json({ error: result.error });
      return;
    }
    res.status(201).json({ message: "Registration submitted. Awaiting admin approval." });
  }
});

router.get("/auth/me", requireAuth, async (req, res) => {
  try {
    const db = getFirestoreDb();
    const snap = await db.collection("users").doc(req.user!.userId).get();
    if (!snap.exists) {
      const demoUser = DEMO_USERS.find((u) => u.id === req.user!.userId || u.email === req.user!.email);
      if (demoUser) {
        res.json({
          id: demoUser.id,
          name: demoUser.name,
          email: demoUser.email,
          role: demoUser.role,
          userCategory: demoUser.userCategory,
          institution: demoUser.institution,
          status: demoUser.status,
          createdAt: new Date().toISOString(),
        });
        return;
      }
      const jsonUser = jsonStoreGetUserById(req.user!.userId);
      if (!jsonUser) {
        res.status(404).json({ error: "User not found" });
        return;
      }
      res.json({
        id: jsonUser.id,
        name: jsonUser.name,
        email: jsonUser.email,
        role: jsonUser.role,
        userCategory: jsonUser.userCategory ?? jsonUser.role,
        institution: jsonUser.institution ?? null,
        status: jsonUser.status,
        createdAt: jsonUser.createdAt,
      });
      return;
    }
    const user = snap.data() as any;
    res.json({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      userCategory: user.userCategory ?? user.role,
      institution: user.institution ?? null,
      status: user.status,
      createdAt: user.createdAt,
    });
  } catch {
    const demoUser = DEMO_USERS.find((u) => u.id === req.user!.userId || u.email === req.user!.email);
    if (demoUser) {
      res.json({
        id: demoUser.id,
        name: demoUser.name,
        email: demoUser.email,
        role: demoUser.role,
        userCategory: demoUser.userCategory,
        institution: demoUser.institution,
        status: demoUser.status,
        createdAt: new Date().toISOString(),
      });
      return;
    }
    const jsonUser = jsonStoreGetUserById(req.user!.userId);
    if (!jsonUser) {
      res.status(404).json({ error: "User not found" });
      return;
    }
    res.json({
      id: jsonUser.id,
      name: jsonUser.name,
      email: jsonUser.email,
      role: jsonUser.role,
      userCategory: jsonUser.userCategory ?? jsonUser.role,
      institution: jsonUser.institution ?? null,
      status: jsonUser.status,
      createdAt: jsonUser.createdAt,
    });
  }
});

router.post("/auth/logout", (_req, res) => {
  res.json({ message: "Logged out" });
});

export default router;
