import { Router } from "express";
import bcrypt from "bcryptjs";
import { db, usersTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { signToken } from "../lib/auth.js";
import { generateId } from "../lib/id.js";
import { requireAuth } from "../middlewares/auth.js";
import { jsonStoreGetUserByEmail, jsonStoreGetUserById, jsonStoreRegisterUser } from "../lib/jsonStore.js";

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

router.post("/auth/login", async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    res.status(400).json({ error: "Email and password required" });
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
    const [user] = await db.select().from(usersTable).where(eq(usersTable.email, email)).limit(1);
    if (!user) {
      res.status(401).json({ error: "Invalid credentials" });
      return;
    }
    if (user.status !== "active") {
      res.status(401).json({ error: "Account is not active. Please wait for approval." });
      return;
    }
    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) {
      res.status(401).json({ error: "Invalid credentials" });
      return;
    }
    const token = signToken({ userId: user.id, email: user.email, role: user.role, name: user.name });
    res.json({ token, user: { id: user.id, name: user.name, email: user.email, role: user.role, userCategory: user.userCategory, institution: user.institution, status: user.status, createdAt: user.createdAt } });
  } catch {
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
  const { name, email, password, role, institution, purpose } = req.body;
  if (!name || !email || !password || !role) {
    res.status(400).json({ error: "Name, email, password and role are required" });
    return;
  }
  try {
    const existing = await db.select().from(usersTable).where(eq(usersTable.email, email)).limit(1);
    if (existing.length > 0) {
      res.status(400).json({ error: "Email already registered" });
      return;
    }
    const passwordHash = await bcrypt.hash(password, 12);
    const id = generateId();
    await db.insert(usersTable).values({
      id,
      name,
      email,
      passwordHash,
      role: role as any,
      institution,
      purpose,
      status: "pending",
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
    const [user] = await db.select().from(usersTable).where(eq(usersTable.id, req.user!.userId)).limit(1);
    if (!user) {
      res.status(404).json({ error: "User not found" });
      return;
    }
    res.json({ id: user.id, name: user.name, email: user.email, role: user.role, userCategory: user.userCategory, institution: user.institution, status: user.status, createdAt: user.createdAt });
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
