import { describe, expect, it } from "bun:test"
import {
  NovelProjectID,
  NovelGenre,
  NovelProjectStatus,
  NovelProject,
  CreateNovelProjectInput,
  UpdateNovelProjectInput,
} from "./schema"

describe("NovelProjectID", () => {
  it("accepts valid novel project IDs", () => {
    expect(NovelProjectID.safeParse("novel_proj_abc123").success).toBe(true)
    expect(NovelProjectID.safeParse("novel_proj_xyz-789").success).toBe(true)
    expect(NovelProjectID.safeParse("novel_proj_lz1a2b3c").success).toBe(true)
  })

  it("rejects invalid IDs", () => {
    expect(NovelProjectID.safeParse("proj_abc").success).toBe(false)
    expect(NovelProjectID.safeParse("novel_proj_").success).toBe(false)
    expect(NovelProjectID.safeParse("").success).toBe(false)
    expect(NovelProjectID.safeParse("novel_proj_with spaces").success).toBe(false)
  })
})

describe("NovelGenre", () => {
  it("accepts all defined genres", () => {
    const genres = ["玄幻", "都市", "穿越", "科幻", "仙侠", "悬疑", "古言", "其他"]
    for (const g of genres) {
      expect(NovelGenre.safeParse(g).success).toBe(true)
    }
  })

  it("rejects unknown genres", () => {
    expect(NovelGenre.safeParse("武侠").success).toBe(false)
    expect(NovelGenre.safeParse("").success).toBe(false)
    expect(NovelGenre.safeParse("romance").success).toBe(false)
  })
})

describe("NovelProjectStatus", () => {
  it("accepts valid statuses", () => {
    expect(NovelProjectStatus.safeParse("active").success).toBe(true)
    expect(NovelProjectStatus.safeParse("archived").success).toBe(true)
    expect(NovelProjectStatus.safeParse("draft").success).toBe(true)
  })

  it("rejects invalid statuses", () => {
    expect(NovelProjectStatus.safeParse("deleted").success).toBe(false)
    expect(NovelProjectStatus.safeParse("").success).toBe(false)
  })
})

describe("CreateNovelProjectInput", () => {
  it("accepts minimal valid input", () => {
    const result = CreateNovelProjectInput.safeParse({
      name: "我的第一部小说",
      genre: "玄幻",
    })
    expect(result.success).toBe(true)
  })

  it("accepts full valid input", () => {
    const result = CreateNovelProjectInput.safeParse({
      name: "仙途漫漫",
      genre: "仙侠",
      description: "一个修仙者的成长故事",
      protagonist: {
        name: "李明",
        gender: "male",
        age: 18,
        personality: "坚韧不拔",
      },
      targetAudience: "general",
      writingStyle: "literary",
      storyTheme: "growth",
      customSettings: "自定义世界设定",
    })
    expect(result.success).toBe(true)
  })

  it("rejects empty name", () => {
    const result = CreateNovelProjectInput.safeParse({
      name: "",
      genre: "玄幻",
    })
    expect(result.success).toBe(false)
  })

  it("rejects name exceeding 100 chars", () => {
    const result = CreateNovelProjectInput.safeParse({
      name: "a".repeat(101),
      genre: "玄幻",
    })
    expect(result.success).toBe(false)
  })

  it("rejects missing genre", () => {
    const result = CreateNovelProjectInput.safeParse({
      name: "测试小说",
    })
    expect(result.success).toBe(false)
  })

  it("rejects invalid protagonist gender", () => {
    const result = CreateNovelProjectInput.safeParse({
      name: "测试",
      genre: "都市",
      protagonist: { name: "主角", gender: "unknown" },
    })
    expect(result.success).toBe(false)
  })
})

describe("UpdateNovelProjectInput", () => {
  it("accepts partial updates", () => {
    expect(UpdateNovelProjectInput.safeParse({ name: "新名称" }).success).toBe(true)
    expect(UpdateNovelProjectInput.safeParse({ status: "active" }).success).toBe(true)
    expect(UpdateNovelProjectInput.safeParse({ chapterCount: 10 }).success).toBe(true)
  })

  it("accepts empty object (no-op update)", () => {
    expect(UpdateNovelProjectInput.safeParse({}).success).toBe(true)
  })

  it("rejects invalid status", () => {
    expect(UpdateNovelProjectInput.safeParse({ status: "invalid" }).success).toBe(false)
  })

  it("rejects negative word count", () => {
    expect(UpdateNovelProjectInput.safeParse({ totalWordCount: -1 }).success).toBe(false)
  })
})

describe("NovelProject", () => {
  it("accepts a complete project object", () => {
    const result = NovelProject.safeParse({
      id: "novel_proj_abc123",
      name: "测试小说",
      genre: "玄幻",
      description: "描述",
      totalWordCount: 0,
      chapterCount: 0,
      characterCount: 0,
      lastUpdated: Date.now(),
      status: "draft",
    })
    expect(result.success).toBe(true)
  })

  it("rejects project with invalid id", () => {
    const result = NovelProject.safeParse({
      id: "invalid_id",
      name: "测试",
      genre: "玄幻",
      description: "",
      totalWordCount: 0,
      chapterCount: 0,
      characterCount: 0,
      lastUpdated: Date.now(),
      status: "draft",
    })
    expect(result.success).toBe(false)
  })
})
