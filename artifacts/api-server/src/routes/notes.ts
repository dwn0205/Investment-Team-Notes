import { Router } from "express";
import { db } from "@workspace/db";
import {
  notes, users, companies, noteVersions, noteAiResults
} from "@workspace/db";
import {
  CreateNoteBody, UpdateNoteBody, ListNotesQueryParams
} from "@workspace/api-zod";
import { eq, and, gte, lte, desc, isNull, ne } from "drizzle-orm";
import { processNoteAi } from "../lib/ai.js";

const router = Router();

async function getNoteWithDetails(noteId: string) {
  const note = await db.query.notes.findFirst({
    where: and(eq(notes.id, noteId), eq(notes.isDeleted, false)),
    with: {
      company: true,
      user: true,
      aiResult: true,
    },
  });
  return note;
}

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
  const parsed = ListNotesQueryParams.safeParse(req.query);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid query params" });
    return;
  }
  const { category, companyId, dateFrom, dateTo, includeInWeekly, authorId } = parsed.data;

  try {
    const conditions: any[] = [eq(notes.isDeleted, false)];
    if (category) conditions.push(eq(notes.category, category as any));
    if (companyId) conditions.push(eq(notes.companyId, companyId));
    if (dateFrom) conditions.push(gte(notes.noteDate, new Date(dateFrom)));
    if (dateTo) conditions.push(lte(notes.noteDate, new Date(dateTo)));
    if (includeInWeekly !== undefined) conditions.push(eq(notes.includeInWeekly, includeInWeekly));
    if (authorId) conditions.push(eq(notes.userId, authorId));

    const result = await db.query.notes.findMany({
      where: and(...conditions),
      with: {
        company: true,
        user: true,
        aiResult: true,
      },
      orderBy: [desc(notes.noteDate)],
    });

    res.json(result.map(formatNote));
  } catch (err) {
    req.log.error({ err }, "Failed to list notes");
    res.status(500).json({ error: "Failed to list notes" });
  }
});

router.post("/", async (req, res) => {
  const parsed = CreateNoteBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid request body", details: parsed.error.message });
    return;
  }

  const data = parsed.data;

  if (data.category !== "generic" && !data.companyId) {
    res.status(400).json({ error: "companyId is required for pipeline/portfolio notes" });
    return;
  }
  if (data.category === "generic" && data.companyId) {
    res.status(400).json({ error: "companyId must be null for generic notes" });
    return;
  }

  try {
    const noteDate = data.noteDate ? new Date(data.noteDate as string) : new Date();
    const [note] = await db.insert(notes).values({
      companyId: data.companyId ?? null,
      userId: data.userId,
      content: data.content,
      category: data.category as any,
      stageAtTimeOfNote: (data.stageAtTimeOfNote as any) ?? null,
      noteDate,
      includeInWeekly: data.includeInWeekly,
    }).returning();

    const noteWithDetails = await getNoteWithDetails(note.id);

    // Fire and forget AI processing
    processNoteAi(note.id, data.content).catch(() => {});

    res.status(201).json(formatNote(noteWithDetails));
  } catch (err) {
    req.log.error({ err }, "Failed to create note");
    res.status(500).json({ error: "Failed to create note" });
  }
});

router.get("/:id", async (req, res) => {
  try {
    const note = await getNoteWithDetails(req.params.id);
    if (!note) {
      res.status(404).json({ error: "Note not found" });
      return;
    }
    res.json(formatNote(note));
  } catch (err) {
    req.log.error({ err }, "Failed to get note");
    res.status(500).json({ error: "Failed to get note" });
  }
});

router.put("/:id", async (req, res) => {
  const parsed = UpdateNoteBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid request body" });
    return;
  }

  try {
    const existing = await db.query.notes.findFirst({
      where: and(eq(notes.id, req.params.id), eq(notes.isDeleted, false)),
    });

    if (!existing) {
      res.status(404).json({ error: "Note not found" });
      return;
    }

    const { content, stageAtTimeOfNote, includeInWeekly, editReason } = parsed.data;
    const contentChanged = content !== undefined && content !== existing.content;

    if (contentChanged) {
      // Save version before updating
      await db.insert(noteVersions).values({
        noteId: existing.id,
        contentSnapshot: existing.content,
        userId: existing.userId,
        editReason: editReason ?? null,
      });
    }

    const updateFields: any = { updatedAt: new Date() };
    if (content !== undefined) updateFields.content = content;
    if (stageAtTimeOfNote !== undefined) updateFields.stageAtTimeOfNote = stageAtTimeOfNote ?? null;
    if (includeInWeekly !== undefined) updateFields.includeInWeekly = includeInWeekly;
    if (contentChanged) updateFields.versionCount = (existing.versionCount ?? 1) + 1;

    await db.update(notes).set(updateFields).where(eq(notes.id, req.params.id));

    if (contentChanged && content) {
      processNoteAi(req.params.id, content).catch(() => {});
    }

    const updated = await getNoteWithDetails(req.params.id);
    res.json(formatNote(updated));
  } catch (err) {
    req.log.error({ err }, "Failed to update note");
    res.status(500).json({ error: "Failed to update note" });
  }
});

router.delete("/:id", async (req, res) => {
  try {
    const existing = await db.query.notes.findFirst({
      where: and(eq(notes.id, req.params.id), eq(notes.isDeleted, false)),
    });
    if (!existing) {
      res.status(404).json({ error: "Note not found" });
      return;
    }
    await db.update(notes).set({ isDeleted: true, updatedAt: new Date() }).where(eq(notes.id, req.params.id));
    res.json({ success: true, message: "Note deleted" });
  } catch (err) {
    req.log.error({ err }, "Failed to delete note");
    res.status(500).json({ error: "Failed to delete note" });
  }
});

router.get("/:id/versions", async (req, res) => {
  try {
    const versions = await db.query.noteVersions.findMany({
      where: eq(noteVersions.noteId, req.params.id),
      with: { user: true },
      orderBy: [desc(noteVersions.createdAt)],
    });

    res.json(versions.map((v: any) => ({
      ...v,
      createdAt: v.createdAt?.toISOString() ?? null,
      user: v.user ? { ...v.user, createdAt: v.user.createdAt?.toISOString() ?? null } : null,
    })));
  } catch (err) {
    req.log.error({ err }, "Failed to get note versions");
    res.status(500).json({ error: "Failed to get note versions" });
  }
});

router.get("/:id/ai-result", async (req, res) => {
  try {
    const result = await db.query.noteAiResults.findFirst({
      where: eq(noteAiResults.noteId, req.params.id),
    });
    if (!result) {
      res.status(404).json({ error: "No AI result found" });
      return;
    }
    res.json({
      ...result,
      keyExtraction: JSON.parse(result.keyExtraction ?? "{}"),
      generatedAt: result.generatedAt?.toISOString() ?? null,
    });
  } catch (err) {
    req.log.error({ err }, "Failed to get AI result");
    res.status(500).json({ error: "Failed to get AI result" });
  }
});

router.post("/:id/rerun-ai", async (req, res) => {
  try {
    const note = await db.query.notes.findFirst({
      where: and(eq(notes.id, req.params.id), eq(notes.isDeleted, false)),
    });
    if (!note) {
      res.status(404).json({ error: "Note not found" });
      return;
    }
    // Fire and forget
    processNoteAi(note.id, note.content).catch(() => {});
    res.status(202).json({ success: true, message: "AI processing started" });
  } catch (err) {
    req.log.error({ err }, "Failed to trigger AI rerun");
    res.status(500).json({ error: "Failed to trigger AI rerun" });
  }
});

export default router;
