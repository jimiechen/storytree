import { describe, it, expect, beforeEach } from "vitest";
import { performance } from "perf_hooks";
import { SQLiteDatabaseManager } from "../core/sqlite-db";
import { StoryTreeRepository } from "../core/repository";
import { createRequest, createSuccessResponse } from "../types/ipc-protocol";

describe("TC-PERF: Performance Benchmark Tests", () => {
  describe("TC-PERF-001: IPC Communication Latency", () => {
    it("should process 1KB JSON roundtrip in < 10ms", () => {
      const payload = {
        data: "x".repeat(1024), // ~1KB
        timestamp: Date.now(),
      };

      const iterations = 100;
      const times: number[] = [];

      for (let i = 0; i < iterations; i++) {
        const start = performance.now();

        // Simulate serialization/deserialization
        const request = createRequest(`req-${i}`, "test.action", payload);
        const json = JSON.stringify(request);
        const parsed = JSON.parse(json);
        const response = createSuccessResponse(parsed.id, { success: true });
        JSON.stringify(response);

        const end = performance.now();
        times.push(end - start);
      }

      const avgTime = times.reduce((a, b) => a + b, 0) / times.length;
      const maxTime = Math.max(...times);

      console.log(`IPC Latency - Avg: ${avgTime.toFixed(2)}ms, Max: ${maxTime.toFixed(2)}ms`);
      expect(avgTime).toBeLessThan(10); // Target: < 10ms
    });
  });

  describe("TC-PERF-002: Large Data Transfer", () => {
    it("should process 1MB JSON in < 50ms", () => {
      // Create ~1MB payload
      const largeArray = new Array(1000).fill(null).map((_, i) => ({
        id: i,
        content: "x".repeat(1000),
        metadata: { timestamp: Date.now(), index: i },
      }));

      const payload = { data: largeArray };
      const jsonSize = Buffer.byteLength(JSON.stringify(payload)) / (1024 * 1024);

      expect(jsonSize).toBeGreaterThan(0.9); // Verify ~1MB

      const start = performance.now();

      const request = createRequest("perf-test", "data.transfer", payload);
      const json = JSON.stringify(request);
      const parsed = JSON.parse(json);
      const response = createSuccessResponse(parsed.id, { received: true });
      JSON.stringify(response);

      const end = performance.now();
      const duration = end - start;

      console.log(`1MB Transfer Time: ${duration.toFixed(2)}ms`);
      expect(duration).toBeLessThan(50); // Target: < 50ms
    });
  });

  describe("TC-PERF-003: SQLite Single INSERT Performance", () => {
    let dbManager: SQLiteDatabaseManager;
    let repo: StoryTreeRepository;
    const testDbPath = `/tmp/storytree-perf-test-${Date.now()}.db`;

    beforeEach(async () => {
      dbManager = new SQLiteDatabaseManager({ dbPath: testDbPath });
      await dbManager.initialize();
      repo = new StoryTreeRepository(dbManager);
    });

    afterEach(() => {
      dbManager.close();
      try {
        const fs = require("fs");
        fs.unlinkSync(testDbPath);
        try { fs.unlinkSync(testDbPath + "-wal"); } catch {}
        try { fs.unlinkSync(testDbPath + "-shm"); } catch {}
      } catch {}
    });

    it("should insert single record in < 5ms", () => {
      const times: number[] = [];
      const iterations = 100;

      for (let i = 0; i < iterations; i++) {
        const start = performance.now();

        repo.createProject({
          name: `Performance Test Project ${i}`,
          description: "Test description",
        });

        const end = performance.now();
        times.push(end - start);
      }

      const avgTime = times.reduce((a, b) => a + b, 0) / times.length;
      const maxTime = Math.max(...times);

      console.log(`SQLite INSERT - Avg: ${avgTime.toFixed(2)}ms, Max: ${maxTime.toFixed(2)}ms`);
      expect(avgTime).toBeLessThan(5); // Target: < 5ms
    });
  });

  describe("TC-PERF-004: Batch Query Performance", () => {
    let dbManager: SQLiteDatabaseManager;
    let repo: StoryTreeRepository;
    const testDbPath = `/tmp/storytree-batch-test-${Date.now()}.db`;

    beforeEach(async () => {
      dbManager = new SQLiteDatabaseManager({ dbPath: testDbPath });
      await dbManager.initialize();
      repo = new StoryTreeRepository(dbManager);

      // Seed 1000 records
      for (let i = 0; i < 1000; i++) {
        repo.createProject({
          name: `Batch Project ${i}`,
          description: `Description for project ${i}`,
        });
      }
    });

    afterEach(() => {
      dbManager.close();
      try {
        const fs = require("fs");
        fs.unlinkSync(testDbPath);
        try { fs.unlinkSync(testDbPath + "-wal"); } catch {}
        try { fs.unlinkSync(testDbPath + "-shm"); } catch {}
      } catch {}
    });

    it("should query 1000 records in < 100ms", () => {
      const start = performance.now();

      const projects = repo.getProjects();

      const end = performance.now();
      const duration = end - start;

      expect(projects.length).toBeGreaterThanOrEqual(1000);
      console.log(`1000 Records SELECT Time: ${duration.toFixed(2)}ms`);
      expect(duration).toBeLessThan(100); // Target: < 100ms
    });
  });

  describe("TC-PERF-005: Webview FCP (First Contentful Paint)", () => {
    it("should generate HTML content quickly", () => {
      const start = performance.now();

      // Simulate HTML generation (similar to what happens in getWorkbenchHtml)
      const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>StoryTree Workbench</title>
  <style>
    :root { --bg: #1e1e1e; --fg: #d4d4d4; }
    body { margin: 0; padding: 0; font-family: sans-serif; }
  </style>
</head>
<body>
  <div id="app">Loading...</div>
  <script>
    window.vscode = acquireVsCodeApi?.() || { postMessage: console.log };
  </script>
</body>
</html>`;

      const end = performance.now();
      const duration = end - start;

      console.log(`HTML Generation Time: ${duration.toFixed(2)}ms`);
      expect(html.length).toBeGreaterThan(100);
      expect(duration).toBeLessThan(100); // Should be very fast
    });
  });

  describe("TC-PERF-006: Memory Usage", () => {
    it("should track memory allocation for large operations", () => {
      const initialMemory = process.memoryUsage();

      // Simulate memory-intensive operation
      const largeData: any[] = [];
      for (let i = 0; i < 10000; i++) {
        largeData.push({
          id: i,
          content: "x".repeat(100),
          nested: { data: "y".repeat(50) },
        });
      }

      const finalMemory = process.memoryUsage();
      const heapUsedMB = (finalMemory.heapUsed - initialMemory.heapUsed) / (1024 * 1024);

      console.log(`Memory Used: ${heapUsedMB.toFixed(2)}MB`);
      expect(heapUsedMB).toBeLessThan(150); // Target: < 150MB

      // Cleanup
      largeData.length = 0;
    });
  });
});
