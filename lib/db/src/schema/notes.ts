import {
  pgTable, text, uuid, timestamp, boolean, integer, pgEnum, check
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { companies } from "./companies";
import { users } from "./users";

export const noteCategoryEnum = pgEnum("note_category", ["generic", "pipeline", "portfolio"]);
export const noteStageEnum = pgEnum("note_stage", ["initial", "final", "closed"]);

export const notes = pgTable("notes", {
  id: uuid("id").primaryKey().defaultRandom(),
  companyId: uuid("company_id").references(() => companies.id),
  userId: uuid("user_id").notNull().references(() => users.id),
  content: text("content").notNull(),
  category: noteCategoryEnum("category").notNull(),
  stageAtTimeOfNote: noteStageEnum("stage_at_time_of_note"),
  noteDate: timestamp("note_date").notNull(),
  includeInWeekly: boolean("include_in_weekly").notNull().default(false),
  isDeleted: boolean("is_deleted").notNull().default(false),
  versionCount: integer("version_count").notNull().default(1),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
}, (t) => [
  check(
    "portfolio_stage_must_be_closed",
    sql`NOT (${t.category} = 'portfolio' AND ${t.stageAtTimeOfNote} IS DISTINCT FROM 'closed')`
  ),
]);

export const insertNoteSchema = createInsertSchema(notes).omit({ id: true, createdAt: true, updatedAt: true, isDeleted: true, versionCount: true });
export type InsertNote = z.infer<typeof insertNoteSchema>;
export type Note = typeof notes.$inferSelect;

export const noteVersions = pgTable("note_versions", {
  id: uuid("id").primaryKey().defaultRandom(),
  noteId: uuid("note_id").notNull().references(() => notes.id),
  contentSnapshot: text("content_snapshot").notNull(),
  userId: uuid("user_id").notNull().references(() => users.id),
  editReason: text("edit_reason"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertNoteVersionSchema = createInsertSchema(noteVersions).omit({ id: true, createdAt: true });
export type InsertNoteVersion = z.infer<typeof insertNoteVersionSchema>;
export type NoteVersion = typeof noteVersions.$inferSelect;

export const sentimentEnum = pgEnum("sentiment", ["positive", "neutral", "negative"]);
export const aiSourceEnum = pgEnum("ai_source", ["ai", "manual"]);

export const noteAiResults = pgTable("note_ai_results", {
  id: uuid("id").primaryKey().defaultRandom(),
  noteId: uuid("note_id").notNull().unique().references(() => notes.id),
  sentiment: sentimentEnum("sentiment").notNull(),
  keyExtraction: text("key_extraction").notNull(),
  source: aiSourceEnum("source").notNull().default("ai"),
  generatedAt: timestamp("generated_at").notNull().defaultNow(),
});

export const insertNoteAiResultSchema = createInsertSchema(noteAiResults).omit({ id: true, generatedAt: true });
export type InsertNoteAiResult = z.infer<typeof insertNoteAiResultSchema>;
export type NoteAiResult = typeof noteAiResults.$inferSelect;

export const quarterlySummaries = pgTable("quarterly_summaries", {
  id: uuid("id").primaryKey().defaultRandom(),
  companyId: uuid("company_id").notNull().references(() => companies.id),
  year: integer("year").notNull(),
  quarter: integer("quarter").notNull(),
  summaryText: text("summary_text").notNull(),
  overallSentiment: sentimentEnum("overall_sentiment").notNull(),
  keyThemes: text("key_themes").notNull(),
  risks: text("risks").notNull(),
  generatedAt: timestamp("generated_at").notNull().defaultNow(),
});

export const insertQuarterlySummarySchema = createInsertSchema(quarterlySummaries).omit({ id: true, generatedAt: true });
export type InsertQuarterlySummary = z.infer<typeof insertQuarterlySummarySchema>;
export type QuarterlySummary = typeof quarterlySummaries.$inferSelect;
