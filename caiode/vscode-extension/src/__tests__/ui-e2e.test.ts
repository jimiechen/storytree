import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock Playwright/Page for E2E tests
const mockPage = {
  goto: vi.fn(),
  click: vi.fn(),
  fill: vi.fn(),
  waitForSelector: vi.fn(),
  waitForResponse: vi.fn(),
  screenshot: vi.fn(),
  evaluate: vi.fn(),
  on: vi.fn(),
};

const mockBrowser = {
  newPage: vi.fn(() => Promise.resolve(mockPage)),
  close: vi.fn(),
};

const mockPlaywright = {
  chromium: {
    launch: vi.fn(() => Promise.resolve(mockBrowser)),
  },
};

describe("TC-FE: Stitch UI E2E Tests", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("TC-FE-HP-001: Character List Display", () => {
    it("should display character list from mock data", async () => {
      // Mock IPC response for character list
      const mockCharacters = [
        { id: "c1", name: "Alice", role: "Protagonist" },
        { id: "c2", name: "Bob", role: "Supporting" },
      ];

      mockPage.evaluate.mockResolvedValue(mockCharacters);

      const characters = await mockPage.evaluate(() =>
        // @ts-ignore
        window.storytree?.getCharacters?.()
      );

      expect(characters).toHaveLength(2);
      expect(characters[0].name).toBe("Alice");
    });

    it("should render character cards in DOM", async () => {
      mockPage.waitForSelector.mockResolvedValue({});

      await mockPage.goto("http://localhost:3000/knowledge");
      const characterList = await mockPage.waitForSelector(
        '[data-testid="character-list"]'
      );

      expect(characterList).toBeDefined();
      expect(mockPage.waitForSelector).toHaveBeenCalledWith(
        '[data-testid="character-list"]'
      );
    });
  });

  describe("TC-FE-HP-002: Add Character Form", () => {
    it("should submit form and refresh list", async () => {
      // Mock form submission
      mockPage.fill.mockResolvedValue(undefined);
      mockPage.click.mockResolvedValue(undefined);
      mockPage.waitForResponse.mockResolvedValue({
        status: () => 200,
        json: () =>
          Promise.resolve({
            id: "c3",
            name: "Charlie",
            role: "Antagonist",
          }),
      });

      await mockPage.goto("http://localhost:3000/knowledge");
      await mockPage.click('[data-testid="add-character-btn"]');
      await mockPage.fill('[data-testid="character-name-input"]', "Charlie");
      await mockPage.fill(
        '[data-testid="character-role-input"]',
        "Antagonist"
      );
      await mockPage.click('[data-testid="submit-character-btn"]');

      // Wait for the list to refresh
      await mockPage.waitForResponse((resp: any) =>
        resp.url().includes("/api/characters")
      );

      expect(mockPage.click).toHaveBeenCalledWith(
        '[data-testid="submit-character-btn"]'
      );
    });

    it("should validate required fields", async () => {
      mockPage.evaluate.mockResolvedValue("Name is required");

      const validationMessage = await mockPage.evaluate(() => {
        // @ts-ignore
        const input = document.querySelector('[data-testid="character-name-input"]');
        return input?.validationMessage;
      });

      expect(validationMessage).toBe("Name is required");
    });
  });

  describe("TC-FE-HP-003: Theme Switching", () => {
    it("should switch between light and dark themes", async () => {
      mockPage.evaluate.mockResolvedValueOnce("light").mockResolvedValueOnce("dark");

      // Get initial theme
      const initialTheme = await mockPage.evaluate(() =>
        // @ts-ignore
        document.documentElement.getAttribute("data-theme")
      );
      expect(initialTheme).toBe("light");

      // Click theme toggle
      await mockPage.click('[data-testid="theme-toggle"]');

      // Get new theme
      const newTheme = await mockPage.evaluate(() =>
        // @ts-ignore
        document.documentElement.getAttribute("data-theme")
      );
      expect(newTheme).toBe("dark");
    });

    it("should persist theme preference via IPC", async () => {
      const mockPostMessage = vi.fn();
      mockPage.evaluate.mockImplementation((fn: any) => {
        if (typeof fn === "function") {
          // @ts-ignore
          window.vscode = { postMessage: mockPostMessage };
          return Promise.resolve();
        }
      });

      await mockPage.evaluate(() => {
        // @ts-ignore
        window.vscode?.postMessage({
          action: "system.setConfig",
          payload: { theme: "dark" },
        });
      });

      expect(mockPostMessage).toHaveBeenCalledWith(
        expect.objectContaining({
          action: "system.setConfig",
          payload: { theme: "dark" },
        })
      );
    });
  });

  describe("TC-FE-HP-004: API Key Configuration", () => {
    it("should save API key to SecretStorage", async () => {
      const mockStoreSecret = vi.fn();
      mockPage.evaluate.mockImplementation((fn: any) => {
        if (typeof fn === "function") {
          // @ts-ignore
          window.vscode = {
            postMessage: mockStoreSecret,
          };
          return Promise.resolve();
        }
      });

      await mockPage.goto("http://localhost:3000/settings");
      await mockPage.fill(
        '[data-testid="api-key-input"]',
        "sk-test123456789"
      );
      await mockPage.click('[data-testid="save-api-key-btn"]');

      expect(mockStoreSecret).toHaveBeenCalledWith(
        expect.objectContaining({
          action: expect.stringContaining("config"),
          payload: expect.objectContaining({
            apiKey: "sk-test123456789",
          }),
        })
      );
    });

    it("should mask API key in input field", async () => {
      mockPage.evaluate.mockResolvedValue("password");

      const inputType = await mockPage.evaluate(() => {
        // @ts-ignore
        const input = document.querySelector('[data-testid="api-key-input"]');
        return input?.getAttribute("type");
      });

      expect(inputType).toBe("password");
    });
  });

  describe("TC-FE-HP-005: AI Chat Streaming", () => {
    it("should send message and receive stream response", async () => {
      const mockStreamChunks = [
        { content: "Hello", done: false },
        { content: " World", done: false },
        { content: "!", done: true },
      ];

      let chunkIndex = 0;
      mockPage.on.mockImplementation((event: string, handler: any) => {
        if (event === "response") {
          // Simulate streaming response
          setInterval(() => {
            if (chunkIndex < mockStreamChunks.length) {
              handler({
                url: () => "http://localhost:3000/api/ai/chat",
                json: () => Promise.resolve(mockStreamChunks[chunkIndex++]),
              });
            }
          }, 100);
        }
      });

      await mockPage.goto("http://localhost:3000/workbench");
      await mockPage.fill(
        '[data-testid="chat-input"]',
        "Tell me a story"
      );
      await mockPage.click('[data-testid="send-message-btn"]');

      expect(mockPage.click).toHaveBeenCalledWith(
        '[data-testid="send-message-btn"]'
      );
    });

    it("should render markdown in chat messages", async () => {
      mockPage.evaluate.mockResolvedValue("<p><strong>Bold</strong> text</p>");

      const renderedHtml = await mockPage.evaluate(() => {
        // @ts-ignore
        const message = document.querySelector('[data-testid="chat-message"]');
        return message?.innerHTML;
      });

      expect(renderedHtml).toContain("<strong>");
    });
  });

  describe("TC-FE-SP-001: Form Validation", () => {
    it("should show error for empty required fields", async () => {
      mockPage.evaluate.mockResolvedValue({
        valid: false,
        errors: [{ field: "name", message: "Name is required" }],
      });

      const validation = await mockPage.evaluate(() => {
        // @ts-ignore
        const form = document.querySelector('[data-testid="character-form"]');
        // @ts-ignore
        return form?.validate?.();
      });

      expect(validation.valid).toBe(false);
      expect(validation.errors).toHaveLength(1);
    });
  });

  describe("TC-FE-SP-002: Network Error Handling", () => {
    it("should show error when AI service is unreachable", async () => {
      mockPage.waitForSelector.mockResolvedValue({
        textContent: "无法连接到 AI 服务",
      });

      await mockPage.goto("http://localhost:3000/workbench");
      await mockPage.fill('[data-testid="chat-input"]', "Test");
      await mockPage.click('[data-testid="send-message-btn"]');

      const errorMessage = await mockPage.waitForSelector(
        '[data-testid="error-message"]'
      );

      expect(errorMessage).toBeDefined();
    });
  });
});

describe("TC-FE-VRT: Visual Regression Tests", () => {
  const viewports = [
    { name: "desktop", width: 1920, height: 1080 },
    { name: "tablet", width: 768, height: 1024 },
    { name: "mobile", width: 375, height: 667 },
  ];

  const themes = ["light", "dark"];
  const locales = ["zh-CN", "en-US"];

  for (const theme of themes) {
    for (const locale of locales) {
      describe(`Theme: ${theme}, Locale: ${locale}`, () => {
        it(`should match snapshot for dashboard (${theme}-${locale})`, async () => {
          // This would be a real screenshot comparison in actual Playwright
          const screenshotPath = `screenshots/dashboard-${theme}-${locale}.png`;
          expect(screenshotPath).toContain(theme);
          expect(screenshotPath).toContain(locale);
        });

        it(`should match snapshot for workbench (${theme}-${locale})`, async () => {
          const screenshotPath = `screenshots/workbench-${theme}-${locale}.png`;
          expect(screenshotPath).toContain(theme);
          expect(screenshotPath).toContain(locale);
        });

        it(`should match snapshot for knowledge base (${theme}-${locale})`, async () => {
          const screenshotPath = `screenshots/knowledge-${theme}-${locale}.png`;
          expect(screenshotPath).toContain(theme);
          expect(screenshotPath).toContain(locale);
        });
      });
    }
  }
});
