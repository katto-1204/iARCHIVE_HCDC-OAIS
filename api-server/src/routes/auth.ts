import { Router } from "express";
import bcrypt from "bcryptjs";
import { signToken } from "../lib/auth.js";
import { requireAuth } from "../middlewares/auth.js";
import { jsonStoreGetUserByEmail, jsonStoreGetUserById, jsonStoreRegisterUser } from "../lib/jsonStore.js";
import { getFirebaseAuth, getFirestoreDb, isFirebaseConfigured } from "../lib/firebase.js";

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

router.post("/auth/login", async (req, res) => {
  const { email, password, idToken } = req.body;
  if ((!email || !password) && !idToken) {
    res.status(400).json({ error: "Email and password or idToken required" });
    return;
  }

  // FORCE DEMO ACCOUNTS - Bypass everything else
  const DEMO_PASSWORD = "admin123";
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
    if (!isFirebaseConfigured()) {
       throw new Error("Firebase skip");
    }
    const auth = getFirebaseAuth();
    let firebaseToken = idToken as string | undefined;
    if (!firebaseToken && email && password) {
      const result = await signInWithPassword(email, password);
      firebaseToken = result.idToken;
    }
    if (!firebaseToken) {
      res.status(401).json({ error: "Invalid credentials" });
      return;
    }
    const decoded = await auth.verifyIdToken(firebaseToken);
    const db = getFirestoreDb();
    const profileSnap = await db.collection("users").doc(decoded.uid).get();
    let profile: any = null;
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
        status: "active",
        createdAt: now,
        updatedAt: now,
      };
      await db.collection("users").doc(decoded.uid).set(profile, { merge: true });
    } else {
      profile = profileSnap.data() as any;
      if (profile.status !== "active") {
        res.status(403).json({ error: "Account is not active. Please wait for approval." });
        return;
      }
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
        createdAt: profile.createdAt || new Date().toISOString(),
      },
    });
  } catch (err) {
    console.error("Login error:", err);
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
    const valid = (password && jsonUser.passwordHash) ? await bcrypt.compare(password, jsonUser.passwordHash) : false;
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
  const { name, email, password, role, userCategory, institution, purpose, idToken } = req.body;
  if (!name || (!role && !userCategory) || (!idToken && (!email || !password))) {
    res.status(400).json({ error: "Name, credentials, and user role/category are required" });
    return;
  }
  try {
    if (!isFirebaseConfigured()) {
       throw new Error("Firebase not configured");
    }
    const auth = getFirebaseAuth();
    let uid = "";
    let resolvedEmail = email as string | undefined;
    if (idToken) {
      const decoded = await auth.verifyIdToken(idToken);
      uid = decoded.uid;
      resolvedEmail = decoded.email || resolvedEmail;
    } else {
      const created = await auth.createUser({
        email,
        password,
        displayName: name,
      });
      uid = created.uid;
      resolvedEmail = created.email || resolvedEmail;
    }

    const db = getFirestoreDb();
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
      role: role || "student",
      userCategory: userCategory || role || "student",
      institution: institution ?? null,
      purpose: purpose ?? null,
      status: "pending",
      createdAt: now,
      updatedAt: now,
    });
    res.status(201).json({ message: "Registration submitted. Awaiting admin approval." });
  } catch (err) {
    console.error("Firebase registration failed, falling back to JSON store:", err);
    try {
      const result = jsonStoreRegisterUser({ name, email, password, role: role || "student", userCategory: userCategory || role || "student", institution, purpose });
      if (!result.ok) {
        res.status(400).json({ error: result.error });
        return;
      }
      res.status(201).json({ message: "Registration submitted. Awaiting admin approval." });
    } catch (jsonErr) {
      console.error("JSON store registration failed:", jsonErr);
      res.status(500).json({ error: "Registration failed. Internal server error." });
    }
  }
});

router.patch("/auth/me", requireAuth, async (req, res) => {
  const { name, institution, purpose } = req.body;
  try {
    const db = getFirestoreDb();
    const updateData: any = {};
    if (name) updateData.name = name;
    if (institution !== undefined) updateData.institution = institution;
    if (purpose !== undefined) updateData.purpose = purpose;
    updateData.updatedAt = new Date().toISOString();
    
    await db.collection("users").doc(req.user!.userId).update(updateData);
    const snap = await db.collection("users").doc(req.user!.userId).get();
    res.json({ ...snap.data(), id: snap.id });
  } catch (err) {
    const jsonUser = jsonStoreGetUserById(req.user!.userId);
    if (!jsonUser) {
      res.status(404).json({ error: "User not found" });
      return;
    }
    if (name) jsonUser.name = name;
    if (institution !== undefined) jsonUser.institution = institution;
    if (purpose !== undefined) jsonUser.purpose = purpose;
    jsonUser.updatedAt = new Date().toISOString();
    res.json({ ...jsonUser });
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
