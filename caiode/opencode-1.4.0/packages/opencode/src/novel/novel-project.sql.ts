import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core"
import { Timestamps } from "../storage/schema.sql"

/**
 * Novel Project table — stores user-created novel projects (not code projects).
 * Independent from opencode's ProjectTable which represents git worktrees.
 *
 * workspace_id isolates projects per workspace directory (Instance.directory).
 * deleted_at implements soft-delete (trash): null = active, non-null = in trash.
 */
export const NovelProjectTable = sqliteTable("novel_project", {
  id: text().primaryKey(),
  workspace_id: text().notNull(),
  name: text().notNull(),
  genre: text().notNull(),
  description: text().notNull().default(""),
  total_word_count: integer().notNull().default(0),
  chapter_count: integer().notNull().default(0),
  character_count: integer().notNull().default(0),
  status: text().notNull().default("draft"),
  deleted_at: integer(),
  protagonist: text({ mode: "json" }).$type<{
    name: string
    gender: string
    age?: number
    personality?: string
  }>(),
  target_audience: text(),
  writing_style: text(),
  story_theme: text(),
  custom_settings: text(),
  ...Timestamps,
})
