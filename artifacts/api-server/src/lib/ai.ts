import { db } from "@workspace/db";
import { noteAiResults } from "@workspace/db";
import { openai } from "@workspace/integrations-openai-ai-server";
import { eq } from "drizzle-orm";
import { logger } from "./logger.js";

export async function processNoteAi(noteId: string, content: string): Promise<void> {
  try {
    const prompt = `You are an investment analyst. Analyze the following deal note and extract key information.

Note content:
${content}

Respond with valid JSON only, no markdown, in this exact format:
{
  "sentiment": "positive" | "neutral" | "negative",
  "sentimentScore": <number between -1.0 and 1.0>,
  "risks": ["risk1", "risk2"],
  "themes": ["theme1", "theme2"],
  "developments": ["development1", "development2"],
  "metrics": {}
}

Guidelines:
- sentiment: overall tone (positive = opportunity/progress, negative = concerns/issues, neutral = factual/mixed)
- sentimentScore: precise score where -1.0 = extremely negative, 0.0 = perfectly neutral, 1.0 = extremely positive. Must be consistent with the sentiment label (positive → 0.1 to 1.0, neutral → -0.1 to 0.1, negative → -1.0 to -0.1)
- risks: specific risks or concerns mentioned (max 5)
- themes: key investment themes or topics (max 5)
- developments: notable recent changes, news, or evolving situations mentioned in the note — what is actively shifting or in motion (max 5)
- metrics: any specific numbers mentioned (e.g. { "revenue": "$10M", "growth": "15%" })`;

    const completion = await openai.chat.completions.create({
      model: "gpt-5.2",
      max_completion_tokens: 2048,
      messages: [{ role: "user", content: prompt }],
    });

    const rawText = completion.choices[0]?.message?.content ?? "{}";
    let parsed: any;
    try {
      const cleaned = rawText.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
      parsed = JSON.parse(cleaned);
    } catch {
      logger.warn({ noteId }, "Failed to parse AI response JSON");
      return;
    }

    const keyExtraction = JSON.stringify({
      risks: parsed.risks ?? [],
      themes: parsed.themes ?? [],
      developments: parsed.developments ?? [],
      metrics: parsed.metrics ?? {},
    });

    const sentimentScore =
      typeof parsed.sentimentScore === "number" &&
      parsed.sentimentScore >= -1 &&
      parsed.sentimentScore <= 1
        ? parsed.sentimentScore
        : null;

    // Upsert AI result
    const existing = await db.query.noteAiResults.findFirst({
      where: eq(noteAiResults.noteId, noteId),
    });

    if (existing) {
      await db.update(noteAiResults).set({
        sentiment: parsed.sentiment ?? "neutral",
        sentimentScore,
        keyExtraction,
        generatedAt: new Date(),
      }).where(eq(noteAiResults.noteId, noteId));
    } else {
      await db.insert(noteAiResults).values({
        noteId,
        sentiment: parsed.sentiment ?? "neutral",
        sentimentScore,
        keyExtraction,
        source: "ai",
      });
    }

    logger.info({ noteId, sentiment: parsed.sentiment, sentimentScore }, "AI processing complete");
  } catch (err) {
    logger.warn({ err, noteId }, "AI processing failed — skipping");
  }
}
