/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Utility / pure-function tests – fast, no network/DOM required.
 */

import { describe, it, expect } from "vitest";

// ── Inline the helpers so tests are self-contained ───────────────────────────
function sanitise(input: string): string {
  return input.trim().slice(0, 500).replace(/[<>]/g, "");
}

function trimHistory<T>(history: T[], maxTurns = 10): T[] {
  const max = maxTurns * 2;
  return history.length > max ? history.slice(-max) : history;
}

function createMessageId(): string {
  return `${Date.now()}-${Math.random()}`;
}

// ── sanitise ──────────────────────────────────────────────────────────────────
describe("sanitise()", () => {
  it("trims leading and trailing whitespace", () => {
    expect(sanitise("  hello  ")).toBe("hello");
  });

  it("strips < and > characters", () => {
    expect(sanitise("<script>alert('xss')</script>")).toBe("scriptalert('xss')/script");
  });

  it("truncates input to 500 characters", () => {
    const long = "a".repeat(600);
    expect(sanitise(long).length).toBe(500);
  });

  it("returns empty string for whitespace-only input", () => {
    expect(sanitise("   ")).toBe("");
  });

  it("leaves normal text unchanged", () => {
    expect(sanitise("How do I register to vote?")).toBe("How do I register to vote?");
  });

  it("handles special characters that are NOT < or >", () => {
    expect(sanitise("NOTA & EVM!")).toBe("NOTA & EVM!");
  });
});

// ── trimHistory ───────────────────────────────────────────────────────────────
describe("trimHistory()", () => {
  const makeHistory = (n: number) =>
    Array.from({ length: n }, (_, i) => ({ role: "user", text: `msg${i}` }));

  it("returns full history when under limit", () => {
    const h = makeHistory(10);
    expect(trimHistory(h, 10)).toHaveLength(10);
  });

  it("trims to last maxTurns*2 entries when over limit", () => {
    const h = makeHistory(30);
    expect(trimHistory(h, 10)).toHaveLength(20);
  });

  it("returns empty array for empty input", () => {
    expect(trimHistory([], 10)).toHaveLength(0);
  });

  it("keeps the MOST RECENT entries when trimming", () => {
    const h = makeHistory(25);
    const result = trimHistory(h, 10) as Array<{ text: string }>;
    expect(result[0].text).toBe("msg5"); // first of last 20
    expect(result[result.length - 1].text).toBe("msg24");
  });
});

// ── createMessageId ───────────────────────────────────────────────────────────
describe("createMessageId()", () => {
  it("returns a non-empty string", () => {
    expect(typeof createMessageId()).toBe("string");
    expect(createMessageId().length).toBeGreaterThan(0);
  });

  it("generates unique IDs on successive calls", () => {
    const ids = new Set(Array.from({ length: 100 }, () => createMessageId()));
    expect(ids.size).toBe(100);
  });
});
