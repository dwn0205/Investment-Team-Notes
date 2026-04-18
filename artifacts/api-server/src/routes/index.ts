import { Router, type IRouter } from "express";
import healthRouter from "./health.js";
import companiesRouter from "./companies.js";
import usersRouter from "./users.js";
import notesRouter from "./notes.js";
import weeklyRouter from "./weekly.js";
import quarterlyRouter from "./quarterly.js";
import statsRouter from "./stats.js";

const router: IRouter = Router();

router.use(healthRouter);
router.use("/companies", companiesRouter);
router.use("/users", usersRouter);
router.use("/notes", notesRouter);
router.use("/weekly", weeklyRouter);
router.use("/quarterly", quarterlyRouter);
router.use("/stats", statsRouter);

export default router;
