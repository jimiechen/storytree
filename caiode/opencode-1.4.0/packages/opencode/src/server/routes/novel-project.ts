import { Hono, type Context } from "hono"
import { describeRoute, validator, resolver } from "hono-openapi"
import { eq, and, isNull, isNotNull, like, or } from "drizzle-orm"
import z from "zod"
import { Database } from "../../storage/db"
import { NovelProjectTable } from "../../novel/novel-project.sql"
import {
  NovelProject,
  NovelProjectID,
  CreateNovelProjectInput,
  UpdateNovelProjectInput,
} from "../../novel/schema"
import { Instance } from "../../project/instance"
import { errors } from "../error"
import { lazy } from "../../util/lazy"

type ProjectRow = typeof NovelProjectTable.$inferSelect

function workspaceId(): string {
  return Instance.directory
}

function rowToProject(row: ProjectRow) {
  return {
    id: row.id,
    name: row.name,
    genre: row.genre as z.infer<typeof NovelProject>["genre"],
    description: row.description,
    totalWordCount: row.total_word_count,
    chapterCount: row.chapter_count,
    characterCount: row.character_count,
    lastUpdated: row.time_updated,
    status: row.status as "active" | "archived" | "draft",
  }
}

function notFound(c: Context, message = "not found") {
  return c.json({ error: "NotFoundError", message }, 404)
}

function generateId(): string {
  return `novel_proj_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`
}

export const NovelProjectRoutes = lazy(() =>
  new Hono()
    .get(
      "/",
      describeRoute({
        summary: "List novel projects",
        description: "List all non-deleted novel projects in the current workspace.",
        operationId: "novel.project.list",
        responses: {
          200: {
            description: "List of novel projects",
            content: { "application/json": { schema: resolver(NovelProject.array()) } },
          },
        },
      }),
      async (c) => {
        const rows = Database.use((d) =>
          d
            .select()
            .from(NovelProjectTable)
            .where(
              and(
                eq(NovelProjectTable.workspace_id, workspaceId()),
                isNull(NovelProjectTable.deleted_at),
              ),
            )
            .all(),
        )
        return c.json(rows.map(rowToProject))
      },
    )
    .get(
      "/trash",
      describeRoute({
        summary: "List deleted novel projects (trash)",
        operationId: "novel.project.trash.list",
        responses: {
          200: {
            description: "List of deleted novel projects",
            content: { "application/json": { schema: resolver(NovelProject.array()) } },
          },
        },
      }),
      async (c) => {
        const rows = Database.use((d) =>
          d
            .select()
            .from(NovelProjectTable)
            .where(
              and(
                eq(NovelProjectTable.workspace_id, workspaceId()),
                isNotNull(NovelProjectTable.deleted_at),
              ),
            )
            .all(),
        )
        return c.json(rows.map(rowToProject))
      },
    )
    .get(
      "/search",
      describeRoute({
        summary: "Search novel projects by keyword",
        operationId: "novel.project.search",
        responses: {
          200: {
            description: "Matching novel projects",
            content: { "application/json": { schema: resolver(NovelProject.array()) } },
          },
        },
      }),
      validator("query", z.object({ q: z.string() })),
      async (c) => {
        const kw = `%${c.req.valid("query").q.toLowerCase()}%`
        const rows = Database.use((d) =>
          d
            .select()
            .from(NovelProjectTable)
            .where(
              and(
                eq(NovelProjectTable.workspace_id, workspaceId()),
                isNull(NovelProjectTable.deleted_at),
                or(
                  like(NovelProjectTable.name, kw),
                  like(NovelProjectTable.genre, kw),
                ),
              ),
            )
            .all(),
        )
        return c.json(rows.map(rowToProject))
      },
    )
    .get(
      "/:id",
      describeRoute({
        summary: "Get novel project by id",
        operationId: "novel.project.get",
        responses: {
          200: {
            description: "Novel project",
            content: { "application/json": { schema: resolver(NovelProject) } },
          },
          ...errors(404),
        },
      }),
      validator("param", z.object({ id: NovelProjectID })),
      async (c) => {
        const id = c.req.valid("param").id
        const row = Database.use((d) =>
          d.select().from(NovelProjectTable).where(eq(NovelProjectTable.id, id)).get(),
        )
        if (!row || row.deleted_at) return notFound(c)
        return c.json(rowToProject(row))
      },
    )
    .post(
      "/",
      describeRoute({
        summary: "Create novel project",
        operationId: "novel.project.create",
        responses: {
          201: {
            description: "Created novel project",
            content: { "application/json": { schema: resolver(NovelProject) } },
          },
          ...errors(400),
        },
      }),
      validator("json", CreateNovelProjectInput),
      async (c) => {
        const input = c.req.valid("json")
        const id = generateId()
        const now = Date.now()
        Database.use((d) =>
          d.insert(NovelProjectTable).values({
            id,
            workspace_id: workspaceId(),
            name: input.name,
            genre: input.genre,
            description: input.description ?? "",
            total_word_count: 0,
            chapter_count: 0,
            character_count: input.protagonist ? 1 : 0,
            status: "draft",
            deleted_at: null,
            protagonist: input.protagonist ?? null,
            target_audience: input.targetAudience ?? null,
            writing_style: input.writingStyle ?? null,
            story_theme: input.storyTheme ?? null,
            custom_settings: input.customSettings ?? null,
            time_created: now,
            time_updated: now,
          }).run(),
        )
        const created = Database.use((d) =>
          d.select().from(NovelProjectTable).where(eq(NovelProjectTable.id, id)).get(),
        )!
        return c.json(rowToProject(created), 201)
      },
    )
    .patch(
      "/:id",
      describeRoute({
        summary: "Update novel project",
        operationId: "novel.project.update",
        responses: {
          200: {
            description: "Updated novel project",
            content: { "application/json": { schema: resolver(NovelProject) } },
          },
          ...errors(400, 404),
        },
      }),
      validator("param", z.object({ id: NovelProjectID })),
      validator("json", UpdateNovelProjectInput),
      async (c) => {
        const id = c.req.valid("param").id
        const input = c.req.valid("json")
        const existing = Database.use((d) =>
          d.select().from(NovelProjectTable).where(eq(NovelProjectTable.id, id)).get(),
        )
        if (!existing || existing.deleted_at) return notFound(c)
        const update: Record<string, unknown> = { time_updated: Date.now() }
        if (input.name !== undefined) update.name = input.name
        if (input.description !== undefined) update.description = input.description
        if (input.status !== undefined) update.status = input.status
        if (input.totalWordCount !== undefined) update.total_word_count = input.totalWordCount
        if (input.chapterCount !== undefined) update.chapter_count = input.chapterCount
        if (input.characterCount !== undefined) update.character_count = input.characterCount
        Database.use((d) =>
          d.update(NovelProjectTable).set(update).where(eq(NovelProjectTable.id, id)).run(),
        )
        const updated = Database.use((d) =>
          d.select().from(NovelProjectTable).where(eq(NovelProjectTable.id, id)).get(),
        )!
        return c.json(rowToProject(updated))
      },
    )
    .delete(
      "/:id",
      describeRoute({
        summary: "Soft delete novel project (move to trash)",
        operationId: "novel.project.delete",
        responses: {
          204: { description: "Deleted" },
          ...errors(404),
        },
      }),
      validator("param", z.object({ id: NovelProjectID })),
      async (c) => {
        const id = c.req.valid("param").id
        const existing = Database.use((d) =>
          d.select().from(NovelProjectTable).where(eq(NovelProjectTable.id, id)).get(),
        )
        if (!existing || existing.deleted_at) return notFound(c)
        const now = Date.now()
        Database.use((d) =>
          d
            .update(NovelProjectTable)
            .set({ deleted_at: now, status: "archived", time_updated: now })
            .where(eq(NovelProjectTable.id, id))
            .run(),
        )
        return c.body(null, 204)
      },
    )
    .post(
      "/:id/restore",
      describeRoute({
        summary: "Restore novel project from trash",
        operationId: "novel.project.restore",
        responses: {
          200: {
            description: "Restored novel project",
            content: { "application/json": { schema: resolver(NovelProject) } },
          },
          ...errors(404),
        },
      }),
      validator("param", z.object({ id: NovelProjectID })),
      async (c) => {
        const id = c.req.valid("param").id
        const existing = Database.use((d) =>
          d.select().from(NovelProjectTable).where(eq(NovelProjectTable.id, id)).get(),
        )
        if (!existing || !existing.deleted_at) return notFound(c)
        const now = Date.now()
        Database.use((d) =>
          d
            .update(NovelProjectTable)
            .set({ deleted_at: null, status: "draft", time_updated: now })
            .where(eq(NovelProjectTable.id, id))
            .run(),
        )
        const restored = Database.use((d) =>
          d.select().from(NovelProjectTable).where(eq(NovelProjectTable.id, id)).get(),
        )!
        return c.json(rowToProject(restored))
      },
    ),
)
