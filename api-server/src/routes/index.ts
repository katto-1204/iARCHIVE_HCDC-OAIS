import { Router, type IRouter } from "express";
import healthRouter from "./health.js";
import authRouter from "./auth.js";
import materialsRouter from "./materials.js";
import categoriesRouter from "./categories.js";
import requestsRouter from "./requests.js";
import usersRouter from "./users.js";
import announcementsRouter from "./announcements.js";
import auditRouter from "./audit.js";

const router: IRouter = Router();

router.use(healthRouter);
router.use(authRouter);
router.use(materialsRouter);
router.use(categoriesRouter);
router.use(requestsRouter);
router.use(usersRouter);
router.use(announcementsRouter);
router.use(auditRouter);

export default router;
