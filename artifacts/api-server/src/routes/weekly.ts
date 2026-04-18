import { Router } from "express";
import { db } from "@workspace/db";
import { notes } from "@workspace/db";
import { eq, and, gte, desc } from "drizzle-orm";

const router = Router();

function formatNote(note: any) {
  if (!note) return null;
  return {
    ...note,
    noteDate: note.noteDate?.toISOString() ?? null,
    createdAt: note.createdAt?.toISOString() ?? null,
    updatedAt: note.updatedAt?.toISOString() ?? null,
    company: note.company ? {
      ...note.company,
      createdAt: note.company.createdAt?.toISOString() ?? null,
    } : null,
    user: note.user ? {
      ...note.user,
      createdAt: note.user.createdAt?.toISOString() ?? null,
    } : null,
    aiResult: note.aiResult ? {
      ...note.aiResult,
      keyExtraction: JSON.parse(note.aiResult.keyExtraction ?? "{}"),
      generatedAt: note.aiResult.generatedAt?.toISOString() ?? null,
    } : null,
  };
}

router.get("/", async (req, res) => {
  try {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const weeklyNotes = await db.query.notes.findMany({
      where: and(
        eq(notes.isDeleted, false),
        eq(notes.includeInWeekly, true),
        gte(notes.noteDate, sevenDaysAgo)
      ),
      with: {
        company: true,
        user: true,
        aiResult: true,
      },
      orderBy: [notes.noteDate],
    });

    // Group by company/category
    const groups = new Map<string, any>();
    for (const note of weeklyNotes) {
      const key = note.companyId ? `company:${note.companyId}` : `category:${note.category}`;
      if (!groups.has(key)) {
        groups.set(key, {
          groupKey: key,
          category: note.category,
          company: note.company ? {
            ...note.company,
            createdAt: note.company.createdAt?.toISOString() ?? null,
          } : null,
          notes: [],
        });
      }
      groups.get(key)!.notes.push(formatNote(note));
    }

    res.json(Array.from(groups.values()));
  } catch (err) {
    req.log.error({ err }, "Failed to get weekly agenda");
    res.status(500).json({ error: "Failed to get weekly agenda" });
  }
});

export default router;
