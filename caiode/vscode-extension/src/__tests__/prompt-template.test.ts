import { describe, it, expect, vi, beforeEach } from "vitest";
import { PromptTemplateEngine } from "../core/ai/prompt-template";
import type { PromptDefinition, PromptTemplateVariables } from "../core/ai/prompt-template";

describe("PromptTemplateEngine", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  describe("Built-in Templates", () => {
    it("should have all 5 built-in templates registered", () => {
      const all = PromptTemplateEngine.list();
      const ids = all.map((t) => t.id);
      expect(ids).toContain("chapter_continue");
      expect(ids).toContain("character_dialogue");
      expect(ids).toContain("outline_expand");
      expect(ids).toContain("text_polish");
      expect(ids).toContain("style_transfer");
    });

    it("should retrieve each built-in template by ID", () => {
      expect(PromptTemplateEngine.get("chapter_continue")).toBeDefined();
      expect(PromptTemplateEngine.get("character_dialogue")).toBeDefined();
      expect(PromptTemplateEngine.get("outline_expand")).toBeDefined();
      expect(PromptTemplateEngine.get("text_polish")).toBeDefined();
      expect(PromptTemplateEngine.get("style_transfer")).toBeDefined();
    });

    it("should return undefined for non-existent template", () => {
      expect(PromptTemplateEngine.get("non_existent")).toBeUndefined();
    });
  });

  describe("Variable Interpolation ({{var}})", () => {
    it("should replace simple variables in user template", () => {
      const result = PromptTemplateEngine.render("text_polish", {
        original_text: "Hello world",
      });
      expect(result).not.toBeNull();
      expect(result!.userPrompt).toContain("Hello world");
    });

    it("should replace multiple variables simultaneously", () => {
      const result = PromptTemplateEngine.render("character_dialogue", {
        character_list: "- Alice (protagonist)\n- Bob (antagonist)",
        location: "A dark forest",
        time_of_day: "midnight",
        mood: "tense",
        topic: "a confrontation about a stolen artifact",
        previous_context: "",
      });
      expect(result).not.toBeNull();
      expect(result!.userPrompt).toContain("Alice (protagonist)");
      expect(result!.userPrompt).toContain("dark forest");
      expect(result!.userPrompt).toContain("midnight");
      expect(result!.userPrompt).toContain("tense");
    });

    it("should leave unreplaced variables as {{var}} placeholders", () => {
      const result = PromptTemplateEngine.render("text_polish", {});
      expect(result).not.toBeNull();
      expect(result!.userPrompt).toContain("{{original_text}}");
    });

    it("should track which variables were used", () => {
      const result = PromptTemplateEngine.render("text_polish", {
        original_text: "test text",
        focus_areas: "clarity and flow",
      });
      expect(result!.variablesUsed).toContain("original_text");
      expect(result!.variablesUsed).toContain("focus_areas");
    });
  });

  describe("Conditional Rendering ({{#if}} / {{/if}})", () => {
    it("should include content when condition variable is truthy string", () => {
      const result = PromptTemplateEngine.render("chapter_continue", {
        project_name: "Star Journey",
        genre: "sci-fi",
        chapter_title: "The Launch",
        chapter_summary: "Hero prepares for space travel.",
        existing_content: "She looked up at the stars...",
        has_outline: true,
        outline_content: "1. Preparation\n2. Launch sequence\n3. First orbit",
        word_count_target: 2000,
      });
      expect(result).not.toBeNull();
      expect(result!.userPrompt).toContain("Follow the outline below");
      expect(result!.userPrompt).toContain("Preparation");
      expect(result!.userPrompt).toContain("Target approximately 2000 words");
    });

    it("should exclude content when condition variable is falsy", () => {
      const result = PromptTemplateEngine.render("chapter_continue", {
        project_name: "Test",
        genre: "fantasy",
        chapter_title: "Chapter 1",
        chapter_summary: "Beginning",
        existing_content: "Once upon a time...",
        has_outline: false,
      });
      expect(result).not.toBeNull();
      expect(result!.userPrompt).not.toContain("Follow the outline below");
    });

    it("should exclude content when condition variable is missing/undefined", () => {
      const result = PromptTemplateEngine.render("text_polish", {
        original_text: "some text",
      });
      expect(result).not.toBeNull();
      expect(result!.userPrompt).not.toContain("Focus on these areas");
    });

    it("should treat empty string as falsy", () => {
      const result = PromptTemplateEngine.render("character_dialogue", {
        character_list: "A and B",
        location: "park",
        time_of_day: "noon",
        mood: "happy",
        topic: "lunch",
        previous_context: "",
        character_traits: "",
      });
      expect(result).not.toBeNull();
      expect(result!.userPrompt).not.toContain("Keep these traits in mind");
    });

    it("should treat zero as falsy", () => {
      const tpl: PromptDefinition = {
        id: "test-zero",
        name: "Zero Test",
        description: "test",
        userTemplate: "{{#if count}}Count is {{count}}{{/if}}No count shown.",
        category: "test",
      };
      PromptTemplateEngine.register(tpl);

      const resultFalsy = PromptTemplateEngine.render("test-zero", { count: 0 });
      expect(resultFalsy!.userPrompt).toBe("No count shown.");

      const resultTruthy = PromptTemplateEngine.render("test-zero", { count: 5 });
      expect(resultTruthy!.userPrompt).toContain("Count is 5");

      PromptTemplateEngine.remove("test-zero");
    });
  });

  describe("System/User Role Separation", () => {
    it("should return separate system prompt when defined", () => {
      const result = PromptTemplateEngine.render("chapter_continue", {
        project_name: "P",
        genre: "g",
        chapter_title: "C",
        chapter_summary: "s",
        existing_content: "content",
      });
      expect(result).not.toBeNull();
      expect(result!.systemPrompt).toBeTruthy();
      expect(result!.systemPrompt).toContain("expert fiction writer");
    });

    it("should return empty system prompt for templates without systemTemplate", () => {
      const customTpl: PromptDefinition = {
        id: "custom-no-sys",
        name: "Custom No System",
        description: "test",
        userTemplate: "Just user content with {{var1}}",
        category: "test",
      };
      PromptTemplateEngine.register(customTpl);

      const result = PromptTemplateEngine.render("custom-no-sys", { var1: "value" });
      expect(result!.systemPrompt).toBe("");
      expect(result!.userPrompt).toContain("value");

      PromptTemplateEngine.remove("custom-no-sys");
    });

    it("should always return non-empty user prompt from template", () => {
      const result = PromptTemplateEngine.render("style_transfer", {
        source_text: "Original prose here",
        target_style: "Hemingway",
      });
      expect(result).not.toBeNull();
      expect(result!.userPrompt.length).toBeGreaterThan(0);
    });
  });

  describe("Template Management", () => {
    it("should register custom template", () => {
      const custom: PromptDefinition = {
        id: "my-custom-tpl",
        name: "My Template",
        description: "Custom test template",
        systemTemplate: "You are a bot.",
        userTemplate: "Process: {{input}}",
        category: "custom",
      };
      PromptTemplateEngine.register(custom);
      expect(PromptTemplateEngine.hasTemplate("my-custom-tpl")).toBe(true);
      expect(PromptTemplateEngine.get("my-custom-tpl")?.name).toBe("My Template");
      PromptTemplateEngine.remove("my-custom-tpl");
    });

    it("should remove custom template", () => {
      const custom: PromptDefinition = {
        id: "temp-remove-me",
        name: "Temp",
        description: "temp",
        userTemplate: "{{x}}",
        category: "test",
      };
      PromptTemplateEngine.register(custom);
      expect(PromptTemplateEngine.hasTemplate("temp-remove-me")).toBe(true);
      expect(PromptTemplateEngine.remove("temp-remove-me")).toBe(true);
      expect(PromptTemplateEngine.hasTemplate("temp-remove-me")).toBe(false);
    });

    it("should return false when removing non-existent template", () => {
      expect(PromptTemplateEngine.remove("does-not-exist")).toBe(false);
    });

    it("listByCategory should filter correctly", () => {
      const writingTpls = PromptTemplateEngine.listByCategory("writing");
      expect(writingTpls.length).toBeGreaterThanOrEqual(2);
      writingTpls.forEach((t) => expect(t.category).toBe("writing"));

      const editingTpls = PromptTemplateEngine.listByCategory("editing");
      editingTpls.forEach((t) => expect(t.category).toBe("editing"));
    });

    it("render should return null for unregistered template ID", () => {
      expect(PromptTemplateEngine.render("totally-fake-id", {})).toBeNull();
    });
  });

  describe("Built-in Template Content Verification", () => {
    it("chapter_continue should contain key sections", () => {
      const tpl = PromptTemplateEngine.get("chapter_continue")!;
      expect(tpl.userTemplate).toContain("Project Information");
      expect(tpl.userTemplate).toContain("Current Chapter");
      expect(tpl.userTemplate).toContain("Existing Content");
      expect(tpl.systemTemplate).toContain("fiction writer");
    });

    it("character_dialogue should include character and scene fields", () => {
      const tpl = PromptTemplateEngine.get("character_dialogue")!;
      expect(tpl.userTemplate).toContain("Characters Involved");
      expect(tpl.userTemplate).toContain("Scene Context");
      expect(tpl.userTemplate).toContain("Conversation Topic");
    });

    it("outline_expand should request chapter-level structure", () => {
      const tpl = PromptTemplateEngine.get("outline_expand")!;
      expect(tpl.userTemplate).toContain("High-Level Outline");
      expect(tpl.userTemplate).toContain("chapter-level structure");
      expect(tpl.userTemplate).toContain("Word count estimate");
    });

    it("text_polish should ask for minimal changes", () => {
      const tpl = PromptTemplateEngine.get("text_polish")!;
      expect(tpl.userTemplate).toContain("polished version");
      expect(tpl.userTemplate).toContain("minimal changes");
    });

    it("style_transfer should preserve factual content", () => {
      const tpl = PromptTemplateEngine.get("style_transfer")!;
      expect(tpl.userTemplate).toContain("Target Style");
      expect(tpl.userTemplate).toContain("maintain all factual content");
    });
  });

  describe("Complex Rendering Scenarios", () => {
    it("should handle deeply nested variable replacement", () => {
      const result = PromptTemplateEngine.render("chapter_continue", {
        project_name: "The Great Novel",
        genre: "literary fiction",
        chapter_title: "Beginnings",
        chapter_summary: "Where everything starts",
        existing_content: "It was the best of times, it was the worst of times.",
        has_outline: true,
        outline_content: "I. The Call\nII. The Journey\nIII. The Return",
        word_count_target: 5000,
      });
      expect(result).not.toBeNull();
      expect(result!.userPrompt).toContain("The Great Novel");
      expect(result!.userPrompt).toContain("literary fiction");
      expect(result!.userPrompt).toContain("Beginnings");
      expect(result!.userPrompt).toContain("best of times");
      expect(result!.userPrompt).toContain("The Call");
      expect(result!.userPrompt).toContain("5000");
    });

    it("should handle numeric variable values converted to strings", () => {
      const custom: PromptDefinition = {
        id: "num-test",
        name: "Num Test",
        description: "test",
        userTemplate: "Value: {{num_val}}, Bool: {{bool_val}}",
        category: "test",
      };
      PromptTemplateEngine.register(custom);

      const result = PromptTemplateEngine.render("num-test", {
        num_val: 42,
        bool_val: true,
      });
      expect(result!.userPrompt).toContain("Value: 42");
      expect(result!.userPrompt).toContain("Bool: true");

      PromptTemplateEngine.remove("num-test");
    });
  });
});
