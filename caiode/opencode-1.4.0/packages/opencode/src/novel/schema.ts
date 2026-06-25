import z from "zod"

export const NovelProjectID = z.string().regex(/^novel_proj_[a-zA-Z0-9_-]+$/)

export const NovelGenre = z.enum([
  "玄幻",
  "都市",
  "穿越",
  "科幻",
  "仙侠",
  "悬疑",
  "古言",
  "其他",
])

export const NovelProjectStatus = z.enum(["active", "archived", "draft"])

export const NovelProject = z.object({
  id: NovelProjectID,
  name: z.string(),
  genre: NovelGenre,
  description: z.string(),
  totalWordCount: z.number().int().min(0),
  chapterCount: z.number().int().min(0),
  characterCount: z.number().int().min(0),
  lastUpdated: z.number(),
  status: NovelProjectStatus,
})

export const CreateNovelProjectInput = z.object({
  name: z.string().min(1).max(100),
  genre: NovelGenre,
  description: z.string().max(2000).optional(),
  protagonist: z
    .object({
      name: z.string(),
      gender: z.enum(["male", "female"]),
      age: z.number().int().positive().optional(),
      personality: z.string().optional(),
    })
    .optional(),
  targetAudience: z.enum(["general", "male", "female"]).optional(),
  writingStyle: z
    .enum([
      "default",
      "humorous",
      "dark",
      "decisive",
      "literary",
      "fast-paced",
      "slow-paced",
      "mystery",
      "passionate",
      "light",
      "heartbreaking",
      "custom",
    ])
    .optional(),
  storyTheme: z
    .enum([
      "default",
      "revenge",
      "growth",
      "love",
      "adventure",
      "redemption",
      "power",
      "friendship",
      "survival",
      "exploration",
      "competition",
      "family",
      "custom",
    ])
    .optional(),
  customSettings: z.string().optional(),
})

export const UpdateNovelProjectInput = z.object({
  name: z.string().min(1).max(100).optional(),
  description: z.string().max(2000).optional(),
  status: NovelProjectStatus.optional(),
  totalWordCount: z.number().int().min(0).optional(),
  chapterCount: z.number().int().min(0).optional(),
  characterCount: z.number().int().min(0).optional(),
})
