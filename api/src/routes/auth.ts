import { Router } from "express";
import { signToken } from "../lib/auth.js";
import { requireAuth } from "../middlewares/auth.js";
import { supabase } from "../lib/supabase.js";

const router = Router();

router.post("/auth/login", async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    res.status(400).json({ error: "Email and password required" });
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
    const { data: profile, error: profileErr } = await supabase.from('profiles').select('*').eq('id', supabaseUser.id).single();

    if (profileErr || !profile) {
      console.error("Profile fetch error:", profileErr);
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
    // Check if this is the first admin
    let status = "pending";
    if (role === "admin") {
      const { count, error: countErr } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .eq('role', 'admin');
      
      if (!countErr && (count === 0 || count === null)) {
        status = "active";
      }
    }

    const { data: authData, error: authErr } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: name,
          role,
          institution: institution || "HCDC",
          purpose: purpose || "",
          status: status, // Pass status to metadata so trigger can use it
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

    // If we set status to active, we might need to manually update the profile 
    // because the trigger might default to 'pending'.
    if (status === "active" && authData.user) {
      const uid = authData.user.id;
      // Wait a bit for the trigger to finish or just upsert
      await supabase.from('profiles').upsert({
        id: uid,
        name,
        email,
        role,
        status: "active",
        institution: institution || "HCDC",
        purpose: purpose || "",
        updated_at: new Date().toISOString()
      });
    }

    const message = status === "active" 
      ? "Registration successful! Your account is the first administrator account and has been automatically activated."
      : "Registration submitted. Awaiting admin approval.";

    res.status(201).json({ message, status });
  } catch (err: any) {
    console.error("Registration error:", err.message);
    res.status(500).json({ error: "Failed to register user" });
  }
});

router.get("/auth/me", requireAuth, async (req, res) => {
  try {
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
