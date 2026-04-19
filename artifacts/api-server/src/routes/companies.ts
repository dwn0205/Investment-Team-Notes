import { Router } from "express";
import { db } from "@workspace/db";
import { companies } from "@workspace/db";
import { CreateCompanyBody } from "@workspace/api-zod";
import { eq } from "drizzle-orm";

const router = Router();

router.get("/", async (req, res) => {
  try {
    const result = await db.select().from(companies).orderBy(companies.name);
    res.json(result);
  } catch (err) {
    req.log.error({ err }, "Failed to list companies");
    res.status(500).json({ error: "Failed to list companies" });
  }
});

router.post("/", async (req, res) => {
  const parsed = CreateCompanyBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid request body" });
    return;
  }
  try {
    const [company] = await db.insert(companies).values(parsed.data).returning();
    res.status(201).json(company);
  } catch (err) {
    req.log.error({ err }, "Failed to create company");
    res.status(500).json({ error: "Failed to create company" });
  }
});

router.put("/:id", async (req, res) => {
  const { name, type, status } = req.body;
  try {
    const updateFields: Record<string, unknown> = {};
    if (name !== undefined) updateFields.name = name;
    if (type !== undefined) updateFields.type = type;
    if (status !== undefined) updateFields.status = status;

    const result = await db
      .update(companies)
      .set(updateFields)
      .where(eq(companies.id, req.params.id))
      .returning();

    if (result.length === 0) {
      res.status(404).json({ error: "Company not found" });
      return;
    }
    res.json(result[0]);
  } catch (err) {
    req.log.error({ err }, "Failed to update company");
    res.status(500).json({ error: "Failed to update company" });
  }
});

export default router;
