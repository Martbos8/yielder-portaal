import { describe, it, expect, beforeEach, vi } from "vitest";
import { cache, cached, CacheTTL } from "../cache";

describe("MemoryCache", () => {
  beforeEach(() => {
    cache.clear();
  });

  it("returns null for missing keys", () => {
    expect(cache.get("nonexistent")).toBeNull();
  });

  it("stores and retrieves values", () => {
    cache.set("key1", { foo: "bar" }, CacheTTL.HOUR);
    expect(cache.get<{ foo: string }>("key1")).toEqual({ foo: "bar" });
  });

  it("returns null for expired entries", () => {
    vi.useFakeTimers();
    cache.set("key1", "value", 100);

    expect(cache.get("key1")).toBe("value");

    vi.advanceTimersByTime(101);
    expect(cache.get("key1")).toBeNull();

    vi.useRealTimers();
  });

  it("invalidates by exact key", () => {
    cache.set("foo", 1, CacheTTL.HOUR);
    cache.set("bar", 2, CacheTTL.HOUR);

    cache.invalidate("foo");

    expect(cache.get("foo")).toBeNull();
    expect(cache.get("bar")).toBe(2);
  });

  it("invalidates by prefix wildcard", () => {
    cache.set("products:active", [1], CacheTTL.HOUR);
    cache.set("products:categories", [2], CacheTTL.HOUR);
    cache.set("dashboard:stats", [3], CacheTTL.HOUR);

    cache.invalidate("products:*");

    expect(cache.get("products:active")).toBeNull();
    expect(cache.get("products:categories")).toBeNull();
    expect(cache.get("dashboard:stats")).toEqual([3]);
  });

  it("clears all entries", () => {
    cache.set("a", 1, CacheTTL.HOUR);
    cache.set("b", 2, CacheTTL.HOUR);

    cache.clear();

    expect(cache.size).toBe(0);
    expect(cache.get("a")).toBeNull();
  });

  it("tracks size correctly", () => {
    expect(cache.size).toBe(0);
    cache.set("a", 1, CacheTTL.HOUR);
    expect(cache.size).toBe(1);
    cache.set("b", 2, CacheTTL.HOUR);
    expect(cache.size).toBe(2);
  });

  it("handles null-like values correctly", () => {
    cache.set("zero", 0, CacheTTL.HOUR);
    cache.set("empty", "", CacheTTL.HOUR);
    cache.set("false", false, CacheTTL.HOUR);

    // 0, "", and false are falsy but not null — cache.get uses strict null check
    expect(cache.get("zero")).toBe(0);
    expect(cache.get("empty")).toBe("");
    expect(cache.get("false")).toBe(false);
  });
});

describe("cached()", () => {
  beforeEach(() => {
    cache.clear();
  });

  it("calls fetcher on first access", async () => {
    const fetcher = vi.fn().mockResolvedValue([1, 2, 3]);

    const result = await cached("test", CacheTTL.HOUR, fetcher);

    expect(result).toEqual([1, 2, 3]);
    expect(fetcher).toHaveBeenCalledTimes(1);
  });

  it("returns cached value on second access", async () => {
    const fetcher = vi.fn().mockResolvedValue([1, 2, 3]);

    await cached("test", CacheTTL.HOUR, fetcher);
    const result = await cached("test", CacheTTL.HOUR, fetcher);

    expect(result).toEqual([1, 2, 3]);
    expect(fetcher).toHaveBeenCalledTimes(1);
  });

  it("calls fetcher again after TTL expires", async () => {
    vi.useFakeTimers();
    const fetcher = vi.fn()
      .mockResolvedValueOnce("first")
      .mockResolvedValueOnce("second");

    const r1 = await cached("test", 100, fetcher);
    expect(r1).toBe("first");

    vi.advanceTimersByTime(101);

    const r2 = await cached("test", 100, fetcher);
    expect(r2).toBe("second");
    expect(fetcher).toHaveBeenCalledTimes(2);

    vi.useRealTimers();
  });

  it("propagates fetcher errors", async () => {
    const fetcher = vi.fn().mockRejectedValue(new Error("fetch failed"));

    await expect(cached("test", CacheTTL.HOUR, fetcher)).rejects.toThrow("fetch failed");
  });
});

describe("CacheTTL constants", () => {
  it("has expected values", () => {
    expect(CacheTTL.SHORT).toBe(2 * 60 * 1000);
    expect(CacheTTL.MEDIUM).toBe(5 * 60 * 1000);
    expect(CacheTTL.LONG).toBe(30 * 60 * 1000);
    expect(CacheTTL.HOUR).toBe(60 * 60 * 1000);
    expect(CacheTTL.DAY).toBe(24 * 60 * 60 * 1000);
  });
});
