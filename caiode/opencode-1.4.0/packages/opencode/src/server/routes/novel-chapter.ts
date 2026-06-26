import { Hono, type Context } from "hono"
import { describeRoute, validator, resolver } from "hono-openapi"
import { eq, and, isNull, isNotNull } from "drizzle-orm"
import z from "zod"
import { Database } from "../../storage/db"
import { NovelChapterTable } from "../../novel/novel-chapter.sql"
import {
  NovelChapter,
  NovelChapterID,
  NovelProjectID,
  CreateNovelChapterInput,
  UpdateNovelChapterInput,
} from "../../novel/schema"
import { errors } from "../error"
import { lazy } from "../../util/lazy"

type ChapterRow = typeof NovelChapterTable.$inferSelect

function rowToChapter(row: ChapterRow) {
  return {
    id: row.id,
    projectId: row.project_id,
    title: row.title,
    orderIndex: row.order_index,
    status: row.status as "draft" | "revising" | "completed" | "published",
    wordCount: row.word_count,
    content: row.content,
    summary: row.summary ?? undefined,
    outline: row.outline ?? { goal: "", conflict: "", keyPlot: "" },
    extractedInfo: row.extracted_info ?? undefined,
    informationState: row.information_state ?? undefined,
    aiSuggestions: row.ai_suggestions ?? undefined,
    createdAt: row.time_created,
    updatedAt: row.time_updated,
    lastEditedAt: row.last_edited_at ?? undefined,
  }
}

function notFound(c: Context, message = "chapter not found") {
  return c.json({ error: "NotFoundError", message }, 404)
}

function generateId(): string {
  return `novel_chap_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`
}

export const NovelChapterRoutes = lazy(() =>
  new Hono()
    .get(
      "/",
      describeRoute({
        summary: "List novel chapters",
        description: "List all non-deleted chapters of a novel project.",
        operationId: "novel.chapter.list",
        responses: {
          200: {
            description: "List of chapters",
            content: { "application/json": { schema: resolver(NovelChapter.array()) } },
          },
        },
      }),
      validator("param", z.object({ projectId: NovelProjectID })),
      async (c) => {
        const { projectId } = c.req.valid("param")
        const rows = Database.use((d) =>
          d
            .select()
            .from(NovelChapterTable)
            .where(
              and(
                eq(NovelChapterTable.project_id, projectId),
                isNull(NovelChapterTable.deleted_at),
              ),
            )
            .orderBy(NovelChapterTable.order_index)
            .all(),
        )
        return c.json(rows.map(rowToChapter))
      },
    )
    .get(
      "/trash",
      describeRoute({
        summary: "List deleted chapters (trash)",
        operationId: "novel.chapter.trash.list",
        responses: {
          200: {
            description: "List of deleted chapters",
            content: { "application/json": { schema: resolver(NovelChapter.array()) } },
          },
        },
      }),
      validator("param", z.object({ projectId: NovelProjectID })),
      async (c) => {
        const { projectId } = c.req.valid("param")
        const rows = Database.use((d) =>
          d
            .select()
            .from(NovelChapterTable)
            .where(
              and(
                eq(NovelChapterTable.project_id, projectId),
                isNotNull(NovelChapterTable.deleted_at),
              ),
            )
            .all(),
        )
        return c.json(rows.map(rowToChapter))
      },
    )
    .get(
      "/:id",
      describeRoute({
        summary: "Get chapter by id",
        operationId: "novel.chapter.get",
        responses: {
          200: {
            description: "Chapter detail",
            content: { "application/json": { schema: resolver(NovelChapter) } },
          },
          ...errors(404),
        },
      }),
      validator("param", z.object({ projectId: NovelProjectID, id: NovelChapterID })),
      async (c) => {
        const { id } = c.req.valid("param")
        const row = Database.use((d) =>
          d.select().from(NovelChapterTable).where(eq(NovelChapterTable.id, id)).get(),
        )
        if (!row || row.deleted_at) return notFound(c)
        return c.json(rowToChapter(row))
      },
    )
    .post(
      "/",
      describeRoute({
        summary: "Create chapter",
        operationId: "novel.chapter.create",
        responses: {
          201: {
            description: "Created chapter",
            content: { "application/json": { schema: resolver(NovelChapter) } },
          },
          ...errors(400),
        },
      }),
      validator("param", z.object({ projectId: NovelProjectID })),
      validator("json", CreateNovelChapterInput),
      async (c) => {
        const { projectId } = c.req.valid("param")
        const input = c.req.valid("json")
        const id = generateId()
        const now = Date.now()
        const orderIndex = input.orderIndex ?? 0
        Database.use((d) =>
          d.insert(NovelChapterTable).values({
            id,
            project_id: projectId,
            title: input.title,
            order_index: orderIndex,
            status: "draft",
            word_count: 0,
            content: input.content ?? "",
            summary: null,
            outline: null,
            extracted_info: null,
            information_state: null,
            ai_suggestions: null,
            last_edited_at: null,
            deleted_at: null,
            time_created: now,
            time_updated: now,
          }).run(),
        )
        const created = Database.use((d) =>
          d.select().from(NovelChapterTable).where(eq(NovelChapterTable.id, id)).get(),
        )!
        return c.json(rowToChapter(created), 201)
      },
    )
    .patch(
      "/:id",
      describeRoute({
        summary: "Update chapter",
        operationId: "novel.chapter.update",
        responses: {
          200: {
            description: "Updated chapter",
            content: { "application/json": { schema: resolver(NovelChapter) } },
          },
          ...errors(400, 404),
        },
      }),
      validator("param", z.object({ projectId: NovelProjectID, id: NovelChapterID })),
      validator("json", UpdateNovelChapterInput),
      async (c) => {
        const { id } = c.req.valid("param")
        const input = c.req.valid("json")
        const existing = Database.use((d) =>
          d.select().from(NovelChapterTable).where(eq(NovelChapterTable.id, id)).get(),
        )
        if (!existing || existing.deleted_at) return notFound(c)
        const update: Record<string, unknown> = { time_updated: Date.now() }
        if (input.title !== undefined) update.title = input.title
        if (input.content !== undefined) update.content = input.content
        if (input.status !== undefined) update.status = input.status
        if (input.summary !== undefined) update.summary = input.summary
        if (input.wordCount !== undefined) update.word_count = input.wordCount
        if (input.orderIndex !== undefined) update.order_index = input.orderIndex
        update.last_edited_at = Date.now()
        Database.use((d) =>
          d.update(NovelChapterTable).set(update).where(eq(NovelChapterTable.id, id)).run(),
        )
        const updated = Database.use((d) =>
          d.select().from(NovelChapterTable).where(eq(NovelChapterTable.id, id)).get(),
        )!
        return c.json(rowToChapter(updated))
      },
    )
    .delete(
      "/:id",
      describeRoute({
        summary: "Soft delete chapter (move to trash)",
        operationId: "novel.chapter.delete",
        responses: {
          204: { description: "Deleted" },
          ...errors(404),
        },
      }),
      validator("param", z.object({ projectId: NovelProjectID, id: NovelChapterID })),
      async (c) => {
        const { id } = c.req.valid("param")
        const existing = Database.use((d) =>
          d.select().from(NovelChapterTable).where(eq(NovelChapterTable.id, id)).get(),
        )
        if (!existing || existing.deleted_at) return notFound(c)
        const now = Date.now()
        Database.use((d) =>
          d
            .update(NovelChapterTable)
            .set({ deleted_at: now, time_updated: now })
            .where(eq(NovelChapterTable.id, id))
            .run(),
        )
        return c.body(null, 204)
      },
    )
    .post(
      "/:id/restore",
      describeRoute({
        summary: "Restore chapter from trash",
        operationId: "novel.chapter.restore",
        responses: {
          200: {
            description: "Restored chapter",
            content: { "application/json": { schema: resolver(NovelChapter) } },
          },
          ...errors(404),
        },
      }),
      validator("param", z.object({ projectId: NovelProjectID, id: NovelChapterID })),
      async (c) => {
        const { id } = c.req.valid("param")
        const existing = Database.use((d) =>
          d.select().from(NovelChapterTable).where(eq(NovelChapterTable.id, id)).get(),
        )
        if (!existing || !existing.deleted_at) return notFound(c)
        const now = Date.now()
        Database.use((d) =>
          d
            .update(NovelChapterTable)
            .set({ deleted_at: null, time_updated: now })
            .where(eq(NovelChapterTable.id, id))
            .run(),
        )
        const restored = Database.use((d) =>
          d.select().from(NovelChapterTable).where(eq(NovelChapterTable.id, id)).get(),
        )!
        return c.json(rowToChapter(restored))
      },
    ),
)
