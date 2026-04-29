import express, { type Express } from "express";
import cors from "cors";
import { pinoHttp } from "pino-http";
import jwt from "jsonwebtoken";
import router from "./routes/index.js";
import { logger } from "./lib/logger.js";
import { supabase } from "./lib/supabase.js";

const app: Express = express();

console.log("iArchive Backend Initializing...");

if (process.env.NODE_ENV !== "production") {
  app.use(pinoHttp({ logger }));
} else {
  app.use((req, res, next) => {
    console.log(`${req.method} ${req.url}`);
    next();
  });
}
app.use(cors());
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));

// ─── TOTAL WAR DEMO BYPASS ───
// This intercepts ANY login attempt for demo accounts and grants instant access.
app.use(async (req, res, next) => {
  if (req.method === "POST" && (req.url?.includes("/auth/login") || req.url === "/login")) {
    const { email, password } = req.body || {};
    const inputEmail = (email || "").toLowerCase().trim();
    
    const demoEmails = ["admin@hcdc.edu.ph", "archivist@hcdc.edu.ph", "student@hcdc.edu.ph"];
    
    if (demoEmails.includes(inputEmail) && (password === "admin123" || !password)) {
      console.log("DEMO BYPASS TRIGGERED:", inputEmail);
      
      // Fetch the REAL profile from Supabase so ingestion works
      const { data: profile } = await supabase.from('profiles').select('*').eq('email', inputEmail).single();
      
      const user = profile ? {
        id: profile.id,
        name: profile.name,
        role: profile.role,
        email: profile.email,
        status: profile.status
      } : {
        id: "demo-" + inputEmail.split('@')[0],
        name: "Demo " + inputEmail.split('@')[0],
        role: inputEmail.includes("admin") ? "admin" : "student",
        email: inputEmail,
        status: "active"
      };

      const secret = process.env.JWT_SECRET || "iarchive-hcdc-secret-2026";
      const token = jwt.sign({ 
        userId: user.id, 
        email: user.email, 
        role: user.role, 
        name: user.name 
      }, secret, { expiresIn: "7d" });
      
      return res.status(200).json({ token, user });
    }
  }
  next();
});

app.get("/api/test", (req, res) => {
  res.json({ message: "API is working", cwd: process.cwd() });
});

app.use("/api", router);

// @ts-ignore
app.use((err: any, req: any, res: any, next: any) => {
  logger.error(err);
  const status = err.status || err.statusCode || 500;
  res.status(status).json({ message: err.message || "Internal Server Error" });
});

export default app;
