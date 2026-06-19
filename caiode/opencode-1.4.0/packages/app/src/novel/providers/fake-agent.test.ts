import { describe, it, expect } from "bun:test";
import { FakeAgentProvider } from "./fake-agent";

describe("FakeAgentProvider", () => {
  const createProvider = () => new FakeAgentProvider();

  // 场景 1: AI 续写成功
  it("场景1: AI续写成功", async () => {
    const provider = createProvider();
    const task = await provider.submitTask({
      type: "continue-writing",
      chapterId: "ch-001",
      text: "正常输入",
    });

    expect(task.type).toBe("continue-writing");
    expect(task.status).toBeOneOf(["pending", "running"]);

    await new Promise((resolve) => setTimeout(resolve, 2500));

    const updated = provider.getTask(task.id);
    expect(updated?.status).toBe("completed"); // 修正#6: 'success' → 'completed'
    expect(updated?.output).toBeDefined();
    expect(updated?.output?.text.length).toBeGreaterThan(0);
  });

  // 场景 2: AI 改写成功
  it("场景2: AI改写成功", async () => {
    const provider = createProvider();
    const task = await provider.submitTask({
      type: "rewrite-selection",
      chapterId: "ch-002",
      text: "测试改写",
      selectedText: "选中内容",
    });

    expect(task.type).toBe("rewrite-selection");

    await new Promise((resolve) => setTimeout(resolve, 2500));

    const updated = provider.getTask(task.id);
    expect(updated?.status).toBe("completed"); // 修正#6
    expect(updated?.output).toBeDefined();
  });

  // 场景 3: AI 总结成功
  it("场景3: AI总结成功", async () => {
    const provider = createProvider();
    const task = await provider.submitTask({
      type: "summarize-chapter",
      chapterId: "ch-003",
      text: "测试总结",
    });

    expect(task.type).toBe("summarize-chapter");

    await new Promise((resolve) => setTimeout(resolve, 2500));

    const updated = provider.getTask(task.id);
    expect(updated?.status).toBe("completed"); // 修正#6
    expect(updated?.output?.text.length).toBeGreaterThan(0);
  });

  // 场景 4: 角色语气改写
  it("场景4: 角色语气改写", async () => {
    const provider = createProvider();
    const task = await provider.submitTask({
      type: "character-voice",
      chapterId: "ch-004",
      text: "测试配音",
      characterId: "char-001",
    });

    expect(task.type).toBe("character-voice");

    await new Promise((resolve) => setTimeout(resolve, 2500));

    const updated = provider.getTask(task.id);
    expect(updated?.status).toBe("completed"); // 修正#6
    expect(updated?.output).toBeDefined();
  });

  // 场景 5: 任务失败
  it("场景5: 任务失败", async () => {
    const provider = createProvider();
    const task = await provider.submitTask({
      type: "continue-writing",
      chapterId: "ch-005",
      text: "fail",
    });

    await new Promise((resolve) => setTimeout(resolve, 1000));

    const updated = provider.getTask(task.id);
    expect(updated?.status).toBe("failed");
    expect(updated?.error).toContain("Mock Error");
  });

  // 场景 6: 用户取消
  it("场景6: 用户取消", async () => {
    const provider = createProvider();
    const task = await provider.submitTask({
      type: "continue-writing",
      chapterId: "ch-006",
      text: "正常输入",
    });

    await provider.cancelTask(task.id);

    const updated = provider.getTask(task.id);
    expect(updated?.status).toBe("cancelled");
  });

  // 场景 7: 权限不足
  it("场景7: 权限不足", async () => {
    const provider = createProvider();
    const task = await provider.submitTask({
      type: "continue-writing",
      chapterId: "ch-007",
      text: "sudo admin",
    });

    await new Promise((resolve) => setTimeout(resolve, 500));

    const updated = provider.getTask(task.id);
    expect(updated?.status).toBe("denied");
    expect(updated?.error).toContain("无权");
  });

  // 场景 8: 配额不足
  it("场景8: 配额不足", async () => {
    const provider = createProvider();
    // 连续调用 11 次
    for (let i = 0; i < 10; i++) {
      await provider.submitTask({
        type: "continue-writing",
        chapterId: "ch-008",
        text: "x",
      });
    }

    const task = await provider.submitTask({
      type: "continue-writing",
      chapterId: "ch-008",
      text: "x",
    });

    await new Promise((resolve) => setTimeout(resolve, 500));

    const updated = provider.getTask(task.id);
    expect(updated?.status).toBe("quota");
    expect(updated?.error).toContain("上限");
  });

  // 场景 9: 长任务处理 (默认行为)
  it("场景9: 长任务处理", async () => {
    const provider = createProvider();
    const task = await provider.submitTask({
      type: "continue-writing",
      chapterId: "ch-009",
      text: "正常输入",
    });

    expect(task.status).toBeOneOf(["pending", "running"]);

    await new Promise((resolve) => setTimeout(resolve, 2000));

    const updated = provider.getTask(task.id);
    expect(updated?.status).toBe("completed"); // 修正#6
    expect(updated?.duration).toBeGreaterThan(0);
  });

  // 额外测试: 任务状态订阅
  it("should notify listeners on status change", async () => {
    const provider = createProvider();
    const statusChanges: string[] = [];

    provider.onTaskUpdate((task) => {
      statusChanges.push(task.status);
    });

    await provider.submitTask({
      type: "continue-writing",
      chapterId: "ch-010",
      text: "正常输入",
    });

    await new Promise((resolve) => setTimeout(resolve, 3000));

    expect(statusChanges.length).toBeGreaterThanOrEqual(2);
    expect(statusChanges).toContain("running");
    expect(statusChanges).toContain("completed"); // 修正#6: 'success' → 'completed'
  });

  // 额外测试: 字数统计
  it("should track word count in output", async () => {
    const provider = createProvider();
    const task = await provider.submitTask({
      type: "continue-writing",
      chapterId: "ch-011",
      text: "正常输入",
    });

    await new Promise((resolve) => setTimeout(resolve, 2500));

    const updated = provider.getTask(task.id);
    expect(updated?.output?.wordCount ?? 0).toBeGreaterThan(0);
  });
});
