import { describe, it, expect } from "vitest";
import { createRequest } from "../types/ipc-protocol";

/**
 * TC-IPC-EC-002: 嵌套对象深度 > 5 层的序列化性能测试
 * 目标: 序列化时间 < 50ms
 */
describe("TC-IPC-EC-002: Nested Object Serialization Performance", () => {
  it("should serialize deeply nested objects (>5 levels) within 50ms", () => {
    // Create a deeply nested object (7 levels)
    const createNestedObject = (depth: number): unknown => {
      if (depth === 0) {
        return { value: "leaf", data: "x".repeat(100) };
      }
      return {
        level: depth,
        child: createNestedObject(depth - 1),
        metadata: { timestamp: Date.now(), index: depth },
      };
    };

    const deepPayload = createNestedObject(7);

    // Measure serialization time
    const startTime = performance.now();

    const request = createRequest("perf-test", "test.deep", deepPayload);
    const serialized = JSON.stringify(request);

    const endTime = performance.now();
    const duration = endTime - startTime;

    // Verify the object was properly serialized
    expect(serialized).toContain("level");
    expect(serialized).toContain("leaf");

    // Performance assertion: must complete within 50ms
    expect(duration).toBeLessThan(50);

    console.log(`[TC-IPC-EC-002] Serialization of 7-level nested object took ${duration.toFixed(2)}ms`);
  });

  it("should handle extremely deep nesting (10 levels) within 50ms", () => {
    const createDeepNested = (depth: number): unknown => {
      if (depth === 0) return { end: true };
      return { level: depth, nested: createDeepNested(depth - 1) };
    };

    const payload = createDeepNested(10);

    const startTime = performance.now();
    const request = createRequest("perf-test-2", "test.veryDeep", payload);
    const serialized = JSON.stringify(request);
    const endTime = performance.now();
    const duration = endTime - startTime;

    expect(serialized).toBeDefined();
    expect(duration).toBeLessThan(50);

    console.log(`[TC-IPC-EC-002] Serialization of 10-level nested object took ${duration.toFixed(2)}ms`);
  });
});
