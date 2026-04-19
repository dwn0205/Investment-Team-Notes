import { Router } from "express";
import { db } from "@workspace/db";
import {
  notes, companies, quarterlySummaries, noteAiResults
} from "@workspace/db";
import { eq, and, gte, lte, or, isNull } from "drizzle-orm";
import { openai } from "@workspace/integrations-openai-ai-server";

const router = Router();

function getQuarterDateRange(year: number, quarter: number): { start: Date; end: Date } {
  const quarterMonths = [
    { start: 0, end: 2 },  // Q1: Jan–Mar
    { start: 3, end: 5 },  // Q2: Apr–Jun
    { start: 6, end: 8 },  // Q3: Jul–Sep
    { start: 9, end: 11 }, // Q4: Oct–Dec
  ];
  const { start: startMonth, end: endMonth } = quarterMonths[quarter - 1];
  const start = new Date(year, startMonth, 1);
  const end = new Date(year, endMonth + 1, 0, 23, 59, 59, 999);
  return { start, end };
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

router.get("/:companyId/:year/:quarter", async (req, res) => {
  const { companyId } = req.params;
  const year = parseInt(req.params.year);
  const quarter = parseInt(req.params.quarter);

  if (isNaN(year) || isNaN(quarter) || quarter < 1 || quarter > 4) {
    res.status(400).json({ error: "Invalid year or quarter" });
    return;
  }

  try {
    const company = await db.query.companies.findFirst({ where: eq(companies.id, companyId) });
    if (!company) {
      res.status(404).json({ error: "Company not found" });
      return;
    }

    const { start, end } = getQuarterDateRange(year, quarter);
    const quarterNotes = await db.query.notes.findMany({
      where: and(
        or(
          eq(notes.companyId, companyId),
          and(eq(notes.category, "generic"), isNull(notes.companyId))
        ),
        eq(notes.isDeleted, false),
        gte(notes.noteDate, start),
        lte(notes.noteDate, end)
      ),
      with: { company: true, user: true, aiResult: true },
      orderBy: [notes.noteDate],
    });

    const summary = await db.query.quarterlySummaries.findFirst({
      where: and(
        eq(quarterlySummaries.companyId, companyId),
        eq(quarterlySummaries.year, year),
        eq(quarterlySummaries.quarter, quarter)
      ),
    });

    res.json({
      summary: summary ? {
        ...summary,
        keyThemes: JSON.parse(summary.keyThemes ?? "[]"),
        risks: JSON.parse(summary.risks ?? "[]"),
        developments: JSON.parse(summary.developments ?? "[]"),
        generatedAt: summary.generatedAt?.toISOString() ?? null,
      } : null,
      notes: quarterNotes.map(formatNote),
      company: { ...company, createdAt: company.createdAt?.toISOString() ?? null },
    });
  } catch (err) {
    req.log.error({ err }, "Failed to get quarterly view");
    res.status(500).json({ error: "Failed to get quarterly view" });
  }
});

router.post("/:companyId/:year/:quarter/generate", async (req, res) => {
  const { companyId } = req.params;
  const year = parseInt(req.params.year);
  const quarter = parseInt(req.params.quarter);

  if (isNaN(year) || isNaN(quarter) || quarter < 1 || quarter > 4) {
    res.status(400).json({ error: "Invalid year or quarter" });
    return;
  }

  try {
    const company = await db.query.companies.findFirst({ where: eq(companies.id, companyId) });
    if (!company) {
      res.status(404).json({ error: "Company not found" });
      return;
    }

    const { start, end } = getQuarterDateRange(year, quarter);
    const quarterNotes = await db.query.notes.findMany({
      where: and(
        or(
          eq(notes.companyId, companyId),
          and(eq(notes.category, "generic"), isNull(notes.companyId))
        ),
        eq(notes.isDeleted, false),
        gte(notes.noteDate, start),
        lte(notes.noteDate, end)
      ),
      with: { user: true, aiResult: true },
      orderBy: [notes.noteDate],
    });

    if (quarterNotes.length === 0) {
      res.status(400).json({ error: "No notes found for this quarter" });
      return;
    }

    const noteContext = quarterNotes.map((n: any) => {
      const ai = n.aiResult ? JSON.parse(n.aiResult.keyExtraction ?? "{}") : null;
      const isGeneric = n.category === "generic" && !n.companyId;
      return `[${isGeneric ? "Market/Generic Note" : "Company Note"}]
Date: ${n.noteDate?.toISOString()?.split("T")[0]}
Author: ${n.user?.fullName} (${n.user?.role})
Content: ${n.content}
AI Sentiment: ${n.aiResult?.sentiment ?? "unknown"}
Risks: ${ai?.risks?.join(", ") ?? "none"}
Themes: ${ai?.themes?.join(", ") ?? "none"}
Developments: ${ai?.developments?.join(", ") ?? "none"}
---`;
    }).join("\n");

    const prompt = `You are an analyst for a private equity firm. Based on the following notes for ${company.name} in Q${quarter} ${year}, produce a concise quarterly investment summary.

Notes are labelled [Company Note] (specific to ${company.name}) or [Market/Generic Note] (broader market context relevant to all portfolio companies). Use both in your analysis — company notes for direct performance insights, market notes for macro context and external risk factors.

${noteContext}

Respond with valid JSON only, no markdown, in this exact format:
{
  "summaryText": "3-5 bullet points as a single string, each bullet starting with • ",
  "overallSentiment": "positive" | "neutral" | "negative",
  "keyThemes": ["theme1", "theme2", "theme3"],
  "risks": ["risk1", "risk2", "risk3"],
  "developments": ["development1", "development2", "development3"]
}

Guidelines:
- keyThemes: recurring investment themes across the quarter (max 5)
- risks: key risks or concerns surfaced this quarter (max 5)
- developments: notable changes, events, or shifts that occurred this quarter — what is actively in motion (max 5)`;

    const completion = await openai.chat.completions.create({
      model: "gpt-5.2",
      max_completion_tokens: 8192,
      messages: [{ role: "user", content: prompt }],
    });

    const rawText = completion.choices[0]?.message?.content ?? "{}";
    let parsed: any;
    try {
      const cleaned = rawText.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
      parsed = JSON.parse(cleaned);
    } catch {
      parsed = {
        summaryText: "• Summary generation encountered a formatting issue. Please try again.",
        overallSentiment: "neutral",
        keyThemes: [],
        risks: [],
      };
    }

    // Upsert
    const existing = await db.query.quarterlySummaries.findFirst({
      where: and(
        eq(quarterlySummaries.companyId, companyId),
        eq(quarterlySummaries.year, year),
        eq(quarterlySummaries.quarter, quarter)
      ),
    });

    let summary: any;
    if (existing) {
      [summary] = await db.update(quarterlySummaries)
        .set({
          summaryText: parsed.summaryText,
          overallSentiment: parsed.overallSentiment,
          keyThemes: JSON.stringify(parsed.keyThemes),
          risks: JSON.stringify(parsed.risks),
          developments: JSON.stringify(parsed.developments ?? []),
          generatedAt: new Date(),
        })
        .where(eq(quarterlySummaries.id, existing.id))
        .returning();
    } else {
      [summary] = await db.insert(quarterlySummaries).values({
        companyId,
        year,
        quarter,
        summaryText: parsed.summaryText,
        overallSentiment: parsed.overallSentiment,
        keyThemes: JSON.stringify(parsed.keyThemes),
        risks: JSON.stringify(parsed.risks),
        developments: JSON.stringify(parsed.developments ?? []),
      }).returning();
    }

    res.json({
      ...summary,
      keyThemes: JSON.parse(summary.keyThemes ?? "[]"),
      risks: JSON.parse(summary.risks ?? "[]"),
      developments: JSON.parse(summary.developments ?? "[]"),
      generatedAt: summary.generatedAt?.toISOString() ?? null,
    });
  } catch (err) {
    req.log.error({ err }, "Failed to generate quarterly summary");
    res.status(500).json({ error: "Failed to generate quarterly summary. Please try again." });
  }
});

export default router;
