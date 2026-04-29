import { Router } from "express";
import { signToken } from "../lib/auth.js";
import { requireAuth } from "../middlewares/auth.js";
import { supabase } from "../lib/supabase.js";

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

  // Demo accounts should always work
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
    // Sign in with Supabase Auth
    const { data: authData, error: authErr } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (authErr) {
      if (/invalid login/i.test(authErr.message) || /invalid credentials/i.test(authErr.message)) {
        res.status(401).json({ error: "Invalid credentials" });
        return;
      }
      throw authErr;
    }

    const supabaseUser = authData.user;
    const session = authData.session;

    // Fetch profile from profiles table
    const { data: profile } = await supabase.from('profiles').select('*').eq('id', supabaseUser.id).single();

    if (!profile) {
      res.status(404).json({ error: "Account not found in system. Please contact admin." });
      return;
    }

    if (profile.status === "rejected") {
      res.status(403).json({ error: "Your account has been rejected." });
      return;
    }

    if (profile.status !== "active") {
      res.status(403).json({ error: "Account is not active. Please wait for approval." });
      return;
    }

    // Generate our own JWT for the API middleware
    const token = signToken({
      userId: supabaseUser.id,
      email: profile.email,
      role: profile.role,
      name: profile.name,
    });

    res.json({
      token,
      supabaseToken: session?.access_token,
      user: {
        id: supabaseUser.id,
        name: profile.name,
        email: profile.email,
        role: profile.role,
        userCategory: profile.user_category || profile.role,
        institution: profile.institution || null,
        status: profile.status,
        createdAt: profile.created_at,
      },
    });
  } catch (err: any) {
    console.error("Auth Login error:", err.message);
    res.status(500).json({ error: "Login failed. Please try again." });
  }
});

router.post("/auth/register", async (req, res) => {
  const { name, email, password, role, institution, purpose } = req.body;
  if (!name || !email || !password || !role) {
    res.status(400).json({ error: "Name, email, password, and role are required" });
    return;
  }
  try {
    const { data: authData, error: authErr } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: name,
          role,
          institution: institution || "HCDC",
          purpose: purpose || "",
        },
      },
    });

    if (authErr) {
      if (/already registered/i.test(authErr.message) || /already been registered/i.test(authErr.message)) {
        res.status(400).json({ error: "Email already registered" });
        return;
      }
      throw authErr;
    }

    res.status(201).json({ message: "Registration submitted. Awaiting admin approval." });
  } catch (err: any) {
    console.error("Registration error:", err.message);
    res.status(500).json({ error: "Failed to register user" });
  }
});

router.get("/auth/me", requireAuth, async (req, res) => {
  try {
    // Check demo users first
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

    const { data: profile, error } = await supabase.from('profiles').select('*').eq('id', req.user!.userId).single();
    
    if (error || !profile) {
      res.status(404).json({ error: "User not found" });
      return;
    }

    res.json({
      id: profile.id,
      name: profile.name,
      email: profile.email,
      role: profile.role,
      userCategory: profile.user_category || profile.role,
      institution: profile.institution || null,
      status: profile.status,
      createdAt: profile.created_at,
    });
  } catch (err: any) {
    console.error("Auth /me error:", err.message);
    res.status(500).json({ error: "Failed to fetch profile" });
  }
});

router.patch("/auth/profile", requireAuth, async (req, res) => {
  const { name, institution, purpose } = req.body;
  const userId = req.user!.userId;
  try {
    const update: any = { updated_at: new Date().toISOString() };
    if (name) update.name = name;
    if (institution !== undefined) update.institution = institution;
    if (purpose !== undefined) update.purpose = purpose;

    const { data, error } = await supabase.from('profiles').update(update).eq('id', userId).select().single();
    if (error) throw error;
    if (!data) { res.status(404).json({ error: "Profile not found" }); return; }

    res.json({
      id: data.id,
      name: data.name,
      email: data.email,
      role: data.role,
      userCategory: data.user_category || data.role,
      institution: data.institution || null,
      status: data.status,
      createdAt: data.created_at,
    });
  } catch (err: any) {
    console.error("Profile Update Error:", err.message);
    res.status(500).json({ error: "Failed to update profile" });
  }
});

router.post("/auth/logout", (_req, res) => {
  res.json({ message: "Logged out" });
});

export default router;
