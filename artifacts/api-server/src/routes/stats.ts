import { Router } from "express";
import { db } from "@workspace/db";
import { notes, companies, noteAiResults } from "@workspace/db";
import { eq, and, gte, count, desc } from "drizzle-orm";

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

router.get("/overview", async (req, res) => {
  try {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const allNotes = await db.query.notes.findMany({
      where: eq(notes.isDeleted, false),
      with: { company: true, user: true, aiResult: true },
      orderBy: [desc(notes.noteDate)],
    });

    const allCompanies = await db.select().from(companies);

    const totalNotes = allNotes.length;
    const notesThisWeek = allNotes.filter(n => n.noteDate >= sevenDaysAgo).length;
    const pipelineNotes = allNotes.filter(n => n.category === "pipeline").length;
    const portfolioNotes = allNotes.filter(n => n.category === "portfolio").length;
    const genericNotes = allNotes.filter(n => n.category === "generic").length;
    const positiveNotes = allNotes.filter(n => n.aiResult?.sentiment === "positive").length;
    const neutralNotes = allNotes.filter(n => n.aiResult?.sentiment === "neutral").length;
    const negativeNotes = allNotes.filter(n => n.aiResult?.sentiment === "negative").length;

    res.json({
      totalNotes,
      notesThisWeek,
      pipelineNotes,
      portfolioNotes,
      genericNotes,
      positiveNotes,
      neutralNotes,
      negativeNotes,
      companiesTracked: allCompanies.length,
      recentActivity: allNotes.slice(0, 5).map(formatNote),
    });
  } catch (err) {
    req.log.error({ err }, "Failed to get stats overview");
    res.status(500).json({ error: "Failed to get stats overview" });
  }
});

export default router;
