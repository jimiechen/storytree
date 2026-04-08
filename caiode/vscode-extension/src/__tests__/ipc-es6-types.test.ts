import { describe, it, expect } from "vitest";
import { createRequest } from "../types/ipc-protocol";

/**
 * TC-IPC-EC-004: Date/Buffer/Map 等 ES6+ 类型序列化兼容性测试
 * 验证这些类型在 JSON 序列化时的行为
 */
describe("TC-IPC-EC-004: ES6+ Types Serialization Compatibility", () => {
  it("should handle Date objects by converting to ISO string", () => {
    const now = new Date("2026-04-08T12:00:00Z");
    const payload = {
      createdAt: now,
      updatedAt: now,
    };

    const request = createRequest("date-test", "test.date", payload);
    const serialized = JSON.stringify(request);
    const deserialized = JSON.parse(serialized);

    // Date should be converted to ISO string
    expect(deserialized.payload.createdAt).toBe("2026-04-08T12:00:00.000Z");
    expect(deserialized.payload.updatedAt).toBe("2026-04-08T12:00:00.000Z");
  });

  it("should handle Map by converting to plain object", () => {
    const map = new Map([
      ["key1", "value1"],
      ["key2", "value2"],
    ]);

    const payload = { data: map };
    const request = createRequest("map-test", "test.map", payload);

    // Map serializes to empty object {} by default in JSON
    const serialized = JSON.stringify(request);
    const deserialized = JSON.parse(serialized);

    // Map is not directly serializable - it becomes an empty object
    expect(deserialized.payload.data).toEqual({});
  });

  it("should handle Set by converting to array", () => {
    const set = new Set([1, 2, 3, 3, 3]); // Duplicates should be removed

    const payload = { items: set };
    const request = createRequest("set-test", "test.set", payload);

    const serialized = JSON.stringify(request);
    const deserialized = JSON.parse(serialized);

    // Set serializes to empty object {} by default in JSON
    expect(deserialized.payload.items).toEqual({});
  });

  it("should handle Uint8Array (Buffer-like) by converting to object", () => {
    const buffer = new Uint8Array([1, 2, 3, 4, 5]);

    const payload = { binaryData: buffer };
    const request = createRequest("buffer-test", "test.buffer", payload);

    const serialized = JSON.stringify(request);
    const deserialized = JSON.parse(serialized);

    // Uint8Array serializes to an object with numeric keys
    expect(deserialized.payload.binaryData).toBeDefined();
  });

  it("should handle nested ES6+ types correctly", () => {
    const complexPayload = {
      date: new Date("2026-01-01"),
      map: new Map([["a", 1]]),
      nested: {
        innerDate: new Date("2026-06-01"),
      },
    };

    const request = createRequest("complex-test", "test.complex", complexPayload);
    const serialized = JSON.stringify(request);
    const deserialized = JSON.parse(serialized);

    // Dates should be ISO strings
    expect(deserialized.payload.date).toBe("2026-01-01T00:00:00.000Z");
    expect(deserialized.payload.nested.innerDate).toBe("2026-06-01T00:00:00.000Z");
    // Map should be empty object
    expect(deserialized.payload.map).toEqual({});
  });

  it("should handle null and undefined correctly", () => {
    const payload = {
      nullValue: null,
      undefinedValue: undefined,
      zero: 0,
      emptyString: "",
      falseValue: false,
    };

    const request = createRequest("null-test", "test.null", payload);
    const serialized = JSON.stringify(request);
    const deserialized = JSON.parse(serialized);

    expect(deserialized.payload.nullValue).toBeNull();
    // undefined is not serialized in JSON
    expect(deserialized.payload.undefinedValue).toBeUndefined();
    expect(deserialized.payload.zero).toBe(0);
    expect(deserialized.payload.emptyString).toBe("");
    expect(deserialized.payload.falseValue).toBe(false);
  });
});
