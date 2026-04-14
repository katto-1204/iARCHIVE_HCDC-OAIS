import express, { type Express } from "express";
import cors from "cors";
import pinoHttp from "pino-http";
import jwt from "jsonwebtoken";
import router from "./routes/index.js";
import { logger } from "./lib/logger.js";

const app: Express = express();

app.use(
  pinoHttp({
    logger,
    serializers: {
      req(req) {
        return {
          id: req.id,
          method: req.method,
          url: req.url?.split("?")[0],
        };
      },
      res(res) {
        return {
          statusCode: res.statusCode,
        };
      },
    },
  }),
);
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// EMERGENCY DEMO LOGIN BYPASS - Force success for demo accounts
app.post(["/api/auth/login", "/auth/login"], (req, res, next) => {
  const { email, password } = req.body || {};
  console.log("Login attempt:", { email, hasPassword: !!password });
  
  const demoUsers: Record<string, any> = {
    "admin@hcdc.edu.ph": { id: "demo-admin", name: "Demo Admin", role: "admin", status: "active" },
    "archivist@hcdc.edu.ph": { id: "demo-archivist", name: "Demo Archivist", role: "archivist", status: "active" },
    "student@hcdc.edu.ph": { id: "demo-student", name: "Demo Student", role: "student", status: "active" },
  };
  
  const inputEmail = (email || "").toLowerCase().trim();
  if (demoUsers[inputEmail] && (password === "admin123" || !password)) {
    console.log("Demo login bypass triggered for:", inputEmail);
    const secret = process.env.JWT_SECRET || "iarchive-hcdc-secret-2026";
    try {
      const token = jwt.sign({ 
        userId: demoUsers[inputEmail].id, 
        email: inputEmail, 
        role: demoUsers[inputEmail].role, 
        name: demoUsers[inputEmail].name 
      }, secret, { expiresIn: "7d" });
      return res.status(200).json({ token, user: demoUsers[inputEmail] });
    } catch (err: any) {
      console.error("JWT signing failed:", err.message);
    }
  }
  next();
});

app.get("/api/test", (req, res) => {
  res.json({ message: "API is working", cwd: process.cwd(), node_env: process.env.NODE_ENV });
});
app.use("/api", router);
// @ts-ignore
app.use((err, req, res, next) => {
  logger.error(err);
  const status = err.status || err.statusCode || 500;
  res.status(status).json({
    message: err.message || "Internal Server Error",
    error: process.env.NODE_ENV === "development" ? err : {},
  });
});

export default app;
