import { Router } from "express";
import { db } from "@workspace/db";
import { users } from "@workspace/db";

const router = Router();

router.get("/", async (req, res) => {
  try {
    const result = await db.select().from(users).orderBy(users.fullName);
    res.json(result);
  } catch (err) {
    req.log.error({ err }, "Failed to list users");
    res.status(500).json({ error: "Failed to list users" });
  }
});

export default router;
