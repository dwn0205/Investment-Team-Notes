import { db } from "@workspace/db";
import { notes, noteAiResults } from "@workspace/db";
import { eq } from "drizzle-orm";
import { processNoteAi } from "../lib/ai.js";

async function main() {
  // Only process notes missing the developments field
  const allNotes = await db.select({ id: notes.id, content: notes.content }).from(notes);
  const results = await db.select({ noteId: noteAiResults.noteId, keyExtraction: noteAiResults.keyExtraction }).from(noteAiResults);
  const resultMap = new Map(results.map(r => [r.noteId, r.keyExtraction]));

  const pending = allNotes.filter(n => {
    const ke = resultMap.get(n.id);
    if (!ke) return true;
    try {
      const parsed = JSON.parse(ke);
      return !Array.isArray(parsed.developments);
    } catch { return true; }
  });

  if (pending.length === 0) {
    console.log("All notes already have developments. Nothing to do.");
    process.exit(0);
  }

  console.log(`Re-running AI on ${pending.length} notes missing developments…`);

  let done = 0;
  for (const note of pending) {
    try {
      await processNoteAi(note.id, note.content);
      done++;
      console.log(`  [${done}/${pending.length}] ✓ ${note.id}`);
    } catch (err) {
      console.error(`  [${done}/${pending.length}] ✗ ${note.id}`, err);
    }
  }

  console.log(`\nDone. ${done}/${pending.length} notes re-processed.`);
  process.exit(0);
}

main();
