import { relations } from "drizzle-orm";
import { companies } from "./schema/companies";
import { users } from "./schema/users";
import { notes, noteVersions, noteAiResults, quarterlySummaries } from "./schema/notes";

export const companiesRelations = relations(companies, ({ many }) => ({
  notes: many(notes),
  quarterlySummaries: many(quarterlySummaries),
}));

export const usersRelations = relations(users, ({ many }) => ({
  notes: many(notes),
  noteVersions: many(noteVersions),
}));

export const notesRelations = relations(notes, ({ one, many }) => ({
  company: one(companies, { fields: [notes.companyId], references: [companies.id] }),
  user: one(users, { fields: [notes.userId], references: [users.id] }),
  versions: many(noteVersions),
  aiResult: one(noteAiResults, { fields: [notes.id], references: [noteAiResults.noteId] }),
}));

export const noteVersionsRelations = relations(noteVersions, ({ one }) => ({
  note: one(notes, { fields: [noteVersions.noteId], references: [notes.id] }),
  user: one(users, { fields: [noteVersions.userId], references: [users.id] }),
}));

export const noteAiResultsRelations = relations(noteAiResults, ({ one }) => ({
  note: one(notes, { fields: [noteAiResults.noteId], references: [notes.id] }),
}));

export const quarterlySummariesRelations = relations(quarterlySummaries, ({ one }) => ({
  company: one(companies, { fields: [quarterlySummaries.companyId], references: [companies.id] }),
}));
