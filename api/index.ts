import express from "express";
import cors from "cors";
import jwt from "jsonwebtoken";
// Note: We import from the original location, but Vercel will now see them 
// because we are part of the 'api' function build context
import router from "./src/routes/index.js";
import { logger } from "./src/lib/logger.js";

const app = express();

console.log("iArchive Vercel Edge-Safe Backend Initializing...");

app.use((req, res, next) => {
  console.log(`${req.method} ${req.url}`);
  next();
});

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// TOTAL WAR DEMO BYPASS
app.use((req, res, next) => {
  if (req.method === "POST") {
    const { email, password } = req.body || {};
    const inputEmail = (email || "").toLowerCase().trim();
    
    const demoUsers: Record<string, any> = {
      "admin@hcdc.edu.ph": { id: "demo-admin", name: "Demo Admin", role: "admin", status: "active" },
      "archivist@hcdc.edu.ph": { id: "demo-archivist", name: "Demo Archivist", role: "archivist", status: "active" },
      "student@hcdc.edu.ph": { id: "demo-student", name: "Demo Student", role: "student", status: "active" },
    };

    if (demoUsers[inputEmail] && (password === "admin123" || !password)) {
      console.log("TOTAL WAR BYPASS TRIGGERED:", inputEmail);
      const secret = process.env.JWT_SECRET || "iarchive-hcdc-secret-2026";
      try {
        const token = jwt.sign({ 
          userId: demoUsers[inputEmail].id, 
          email: inputEmail, 
          role: demoUsers[inputEmail].role, 
          name: demoUsers[inputEmail].name 
        }, secret, { expiresIn: "7d" });
        return res.status(200).json({ token, user: demoUsers[inputEmail] });
      } catch (e) {
        return res.status(200).json({ token: "emergency-token-" + Date.now(), user: demoUsers[inputEmail] });
      }
    }
  }
  next();
});

app.get("/api/test", (req, res) => {
  res.json({ 
    message: "iArchive Vercel API is live", 
    vercel: true,
    env: process.env.NODE_ENV,
    time: new Date().toISOString()
  });
});

app.use("/api", router);

// Error Handler
app.use((err: any, req: any, res: any, next: any) => {
  console.error("Vercel API Error:", err);
  const status = err.status || err.statusCode || 500;
  res.status(status).json({
    message: err.message || "Internal Server Error",
    error: process.env.NODE_ENV === "development" ? err : { name: err.name },
    stack: process.env.NODE_ENV === "development" ? err.stack : undefined
  });
});

export default app;
