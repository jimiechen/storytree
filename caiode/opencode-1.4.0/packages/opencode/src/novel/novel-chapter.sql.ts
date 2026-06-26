import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core"
import { Timestamps } from "../storage/schema.sql"

/**
 * Novel Chapter table — stores chapters of novel projects.
 * Belongs to a novel_project (project_id foreign key).
 * deleted_at implements soft-delete (trash): null = active, non-null = in trash.
 */
export const NovelChapterTable = sqliteTable("novel_chapter", {
  id: text().primaryKey(),
  project_id: text().notNull(),
  title: text().notNull(),
  order_index: integer().notNull().default(0),
  status: text().notNull().default("draft"),
  word_count: integer().notNull().default(0),
  content: text().notNull().default(""),
  summary: text(),
  outline: text({ mode: "json" }).$type<{
    goal: string
    conflict: string
    keyPlot: string
  }>(),
  extracted_info: text({ mode: "json" }),
  information_state: text({ mode: "json" }),
  ai_suggestions: text({ mode: "json" }),
  last_edited_at: integer(),
  deleted_at: integer(),
  ...Timestamps,
})
