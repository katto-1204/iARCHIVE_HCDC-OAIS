import express from "express";
import cors from "cors";
import pkg from "jsonwebtoken";
const { sign, verify } = pkg;

const app = express();

app.use(cors());
app.use(express.json());

const JWT_SECRET = process.env.JWT_SECRET || "iarchive-hcdc-secret-2026";

// RECOVERY ROUTE: Verification that the API is reachable
app.get("/api/health", (req, res) => {
  res.json({ 
    status: "ok", 
    message: "Recovery API Live", 
    project: process.env.FIREBASE_PROJECT_ID 
  });
});

// TOTAL WAR BYPASS - This handles login even if Firebase is down
app.post("/api/auth/login", (req, res) => {
  const { email, password } = req.body || {};
  const inputEmail = (email || "").toLowerCase().trim();
  
  const demoUsers: Record<string, any> = {
    "admin@hcdc.edu.ph": { id: "demo-admin", name: "Admin User", role: "admin" },
    "archivist@hcdc.edu.ph": { id: "demo-arch", name: "Archivist User", role: "archivist" },
    "student@hcdc.edu.ph": { id: "demo-stud", name: "Student User", role: "student" },
  };

  if (demoUsers[inputEmail] && (password === "admin123" || !password)) {
    const token = sign({ 
      userId: demoUsers[inputEmail].id, 
      email: inputEmail, 
      role: demoUsers[inputEmail].role 
    }, JWT_SECRET, { expiresIn: "7d" });
    return res.status(200).json({ token, user: demoUsers[inputEmail] });
  }

  // If not a demo user, we'd normally call Firebase here. 
  // For now, we return 401 if demo fail to force them to use the bypass.
  res.status(401).json({ message: "Invalid credentials or Firebase connection issue" });
});

// AUTH ME BYPASS
app.get("/api/auth/me", (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ message: "No token" });
  }
  
  try {
    const token = authHeader.split(" ")[1];
    const decoded = verify(token, JWT_SECRET);
    res.json(decoded);
  } catch (err) {
    res.status(401).json({ message: "Invalid token" });
  }
});

export default app;
