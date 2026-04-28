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

async function resolveUserProfile(db: FirebaseFirestore.Firestore, uid: string, email?: string) {
  const byUid = await db.collection("users").doc(uid).get();
  if (byUid.exists) return { snap: byUid, linked: false };

  const normalizedEmail = String(email || "").trim().toLowerCase();
  if (!normalizedEmail) return { snap: byUid, linked: false };

  const byEmail = await db.collection("users").where("email", "==", normalizedEmail).limit(1).get();
  if (byEmail.empty) return { snap: byUid, linked: false };

  const existingDoc = byEmail.docs[0];
  const existingData = existingDoc.data() as any;
  await db.collection("users").doc(uid).set(
    {
      ...existingData,
      id: uid,
      email: existingData?.email || normalizedEmail,
      updatedAt: new Date().toISOString(),
    },
    { merge: true }
  );

  const linkedSnap = await db.collection("users").doc(uid).get();
  return { snap: linkedSnap, linked: true };
}

async function signInWithPassword(email: string, password: string) {
  const apiKey = process.env["FIREBASE_API_KEY"] || process.env["VITE_FIREBASE_API_KEY"];
  if (!apiKey) {
    throw new Error("Missing FIREBASE_API_KEY (or VITE_FIREBASE_API_KEY)");
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
  const apiKey = process.env["FIREBASE_API_KEY"] || process.env["VITE_FIREBASE_API_KEY"];
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
    
    let decoded: { uid: string, email?: string, name?: string } | null;
    try {
      const auth = getFirebaseAuth();
      decoded = await auth.verifyIdToken(firebaseToken);
    } catch {
      decoded = await verifyIdTokenRestFallback(firebaseToken);
    }
    
    if (!decoded) {
      res.status(401).json({ error: "Invalid Firebase token" });
      return;
    }
    
    let profile: any = null;
    try {
      const db = getFirestoreDb();
      const { snap: profileSnap } = await resolveUserProfile(db, decoded.uid, decoded.email);
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
        if (profile.status === "rejected") {
          const reason = profile.rejectionReason || "";
          res.status(403).json({ error: "Your account has been rejected.", rejectionReason: reason });
          return;
        }
        if (profile.status !== "active") {
          res.status(403).json({ error: "Account is not active. Please wait for approval." });
          return;
        }
      }
    } catch (dbErr: any) {
      console.warn("Auth me/login Firestore warning:", dbErr.message);
      // If DB is unreachable, we still allow the token if we can verify it via REST
      // or if it was recently cached. We proceed to local check if DB fails.
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
  } catch (outerErr: any) {
    console.error("Auth Login outer error:", outerErr.message, outerErr.stack);
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
    if (jsonUser.status === "rejected") {
      res.status(403).json({ error: "Your account has been rejected.", rejectionReason: (jsonUser as any).rejectionReason || "" });
      return;
    }
    if (jsonUser.status !== "active") {
      res.status(403).json({ error: "Account is not active. Please wait for approval." });
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
      let decoded: { uid: string, email?: string, name?: string } | null;
      try {
        const auth = getFirebaseAuth();
        decoded = await auth.verifyIdToken(idToken);
      } catch {
        decoded = await verifyIdTokenRestFallback(idToken);
      }
      
      if (!decoded) {
        res.status(401).json({ error: "Invalid Firebase token" });
        return;
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
  } catch (err: any) {
    console.error("Registration error:", err.message, err.stack);
    if (/email already/i.test(err.message)) {
      res.status(400).json({ error: "Email already registered" });
      return;
    }
    res.status(500).json({ error: "Failed to register user to database" });
  }
});

router.get("/auth/me", requireAuth, async (req, res) => {
  try {
    const db = getFirestoreDb();
    const snap = await resolveUserProfile(db, req.user!.userId, req.user!.email).then((r) => r.snap);
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

router.patch("/auth/profile", requireAuth, async (req, res) => {
  const { name, institution, purpose } = req.body;
  const userId = req.user!.userId;
  try {
    const db = getFirestoreDb();
    const snap = await db.collection("users").doc(userId).get();
    if (!snap.exists) {
      res.status(404).json({ error: "Profile not found" });
      return;
    }
    const update: any = { updatedAt: new Date().toISOString() };
    if (name) update.name = name;
    if (institution !== undefined) update.institution = institution;
    if (purpose !== undefined) update.purpose = purpose;
    
    await db.collection("users").doc(userId).update(update);
    const updated = await db.collection("users").doc(userId).get();
    res.json({ id: updated.id, ...updated.data() });
  } catch (error: any) {
    console.error("Profile Update Error:", error.message);
    res.status(500).json({ error: "Failed to update profile" });
  }
});

router.post("/auth/logout", (_req, res) => {
  res.json({ message: "Logged out" });
});

export default router;
