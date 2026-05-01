/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * FAQ filtering logic tests.
 */

import { describe, it, expect } from "vitest";

interface FAQItem {
  question: string;
  answer: string;
  tags?: string[];
}

const sampleFAQs: FAQItem[] = [
  { question: "How do I register to vote?", answer: "Visit eci.gov.in", tags: ["registration"] },
  { question: "What is NOTA?", answer: "None of the Above", tags: ["nota", "ballot"] },
  { question: "Who is eligible to vote?", answer: "Citizens 18+", tags: ["eligibility"] },
  { question: "Which IDs are accepted?", answer: "Voter ID, Aadhaar, etc.", tags: ["id", "documents"] },
];

function filterFAQs(faqs: FAQItem[], query: string, activeTag: string): FAQItem[] {
  const q = query.toLowerCase().trim();
  return faqs.filter((faq) => {
    const matchesTag = activeTag === "all" || (faq.tags ?? []).includes(activeTag);
    const matchesQuery =
      !q ||
      faq.question.toLowerCase().includes(q) ||
      faq.answer.toLowerCase().includes(q);
    return matchesTag && matchesQuery;
  });
}

describe("FAQ filterFAQs()", () => {
  it("returns all FAQs when tag is 'all' and query is empty", () => {
    expect(filterFAQs(sampleFAQs, "", "all")).toHaveLength(4);
  });

  it("filters by tag correctly", () => {
    const result = filterFAQs(sampleFAQs, "", "nota");
    expect(result).toHaveLength(1);
    expect(result[0].question).toContain("NOTA");
  });

  it("filters by search query (question match)", () => {
    const result = filterFAQs(sampleFAQs, "register", "all");
    expect(result.length).toBeGreaterThan(0);
    expect(result.some((f) => f.question.toLowerCase().includes("register"))).toBe(true);
  });

  it("filters by search query (answer match)", () => {
    const result = filterFAQs(sampleFAQs, "aadhaar", "all");
    expect(result).toHaveLength(1);
    expect(result[0].tags).toContain("id");
  });

  it("returns empty array when no matches", () => {
    expect(filterFAQs(sampleFAQs, "zzznomatch", "all")).toHaveLength(0);
  });

  it("combines tag and query filter (AND logic)", () => {
    const result = filterFAQs(sampleFAQs, "nota", "ballot");
    expect(result).toHaveLength(1);
  });

  it("tag + query with no overlap returns empty", () => {
    const result = filterFAQs(sampleFAQs, "register", "nota");
    expect(result).toHaveLength(0);
  });

  it("is case-insensitive", () => {
    const result = filterFAQs(sampleFAQs, "NOTA", "all");
    expect(result.length).toBeGreaterThan(0);
  });
});
