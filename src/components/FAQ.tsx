/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * FAQ – Searchable, accessible accordion with tag filtering.
 */

import { useState, useEffect, useMemo, useCallback } from "react";
import { Plus, Minus, HelpCircle, Search, RefreshCw } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface FAQItem {
  question: string;
  answer: string;
  tags?: string[];
}

const ALL_TAG = "all";

export default function FAQ() {
  const [faqs, setFaqs] = useState<FAQItem[]>([]);
  const [openIndex, setOpenIndex] = useState<number | null>(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [query, setQuery] = useState("");
  const [activeTag, setActiveTag] = useState(ALL_TAG);

  const fetchFAQ = useCallback(() => {
    setLoading(true);
    setError(false);
    fetch("/api/faq")
      .then((res) => {
        if (!res.ok) throw new Error();
        return res.json() as Promise<FAQItem[]>;
      })
      .then((data) => { setFaqs(data); setLoading(false); })
      .catch(() => { setError(true); setLoading(false); });
  }, []);

  useEffect(() => { fetchFAQ(); }, [fetchFAQ]);

  // Collect unique tags
  const allTags: string[] = useMemo(() => {
    const set = new Set<string>();
    faqs.forEach((f) => f.tags?.forEach((t) => set.add(t)));
    return [ALL_TAG, ...Array.from(set)];
  }, [faqs]);

  // Filtered FAQ
  const filteredFAQs = useMemo(() => {
    const q = query.toLowerCase().trim();
    return faqs.filter((faq) => {
      const matchesTag =
        activeTag === ALL_TAG || (faq.tags ?? []).includes(activeTag);
      const matchesQuery =
        !q ||
        faq.question.toLowerCase().includes(q) ||
        faq.answer.toLowerCase().includes(q);
      return matchesTag && matchesQuery;
    });
  }, [faqs, query, activeTag]);

  const toggle = (index: number) =>
    setOpenIndex(openIndex === index ? null : index);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-3" role="status">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-blue-600" aria-hidden="true" />
        <span className="text-sm text-slate-500">Loading FAQ…</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-4" role="alert">
        <p className="text-slate-600 font-semibold">Unable to load FAQ.</p>
        <button
          onClick={fetchFAQ}
          className="flex items-center gap-2 text-sm font-bold text-blue-600 hover:text-blue-800 focus:outline-none focus:ring-2 focus:ring-blue-400 rounded"
        >
          <RefreshCw className="w-4 h-4" aria-hidden="true" />
          Try again
        </button>
      </div>
    );
  }

  return (
    <section aria-label="Frequently Asked Questions" className="max-w-3xl mx-auto py-6">
      <header className="mb-8">
        <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
          <HelpCircle className="w-6 h-6 text-blue-700" aria-hidden="true" />
          Frequently Asked Questions
        </h2>
        <p className="text-slate-500 text-sm mt-1">
          Quick, reliable answers to the most common election questions.
        </p>
      </header>

      {/* Search */}
      <div className="relative mb-4">
        <Search
          className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400"
          aria-hidden="true"
        />
        <label htmlFor="faq-search" className="sr-only">Search FAQ</label>
        <input
          id="faq-search"
          type="search"
          value={query}
          onChange={(e) => { setQuery(e.target.value); setOpenIndex(null); }}
          placeholder="Search questions…"
          className="w-full bg-white border border-slate-200 rounded-xl pl-9 pr-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          aria-label="Search frequently asked questions"
        />
      </div>

      {/* Tag filter */}
      <div
        className="flex flex-wrap gap-2 mb-6"
        role="group"
        aria-label="Filter by topic"
      >
        {allTags.map((tag) => (
          <button
            key={tag}
            onClick={() => { setActiveTag(tag); setOpenIndex(null); }}
            aria-pressed={activeTag === tag}
            className={`text-xs font-semibold px-3 py-1 rounded-full border transition-colors focus:outline-none focus:ring-2 focus:ring-blue-400 capitalize ${
              activeTag === tag
                ? "bg-blue-600 text-white border-blue-600"
                : "bg-white text-slate-600 border-slate-200 hover:border-blue-300 hover:text-blue-700"
            }`}
          >
            {tag === ALL_TAG ? "All Topics" : tag}
          </button>
        ))}
      </div>

      {/* Results count */}
      <p className="text-xs text-slate-400 mb-4" aria-live="polite" aria-atomic="true">
        {filteredFAQs.length === 0
          ? "No results found."
          : `Showing ${filteredFAQs.length} of ${faqs.length} questions`}
      </p>

      {filteredFAQs.length === 0 ? (
        <div className="text-center py-10 text-slate-400">
          <p className="font-semibold">No matches found.</p>
          <button
            onClick={() => { setQuery(""); setActiveTag(ALL_TAG); }}
            className="mt-2 text-sm text-blue-600 hover:underline focus:outline-none focus:ring-2 focus:ring-blue-400 rounded"
          >
            Clear filters
          </button>
        </div>
      ) : (
        <dl className="space-y-2.5">
          {filteredFAQs.map((faq, index) => {
            const isOpen = openIndex === index;
            const btnId = `faq-btn-${index}`;
            const panelId = `faq-panel-${index}`;

            return (
              <div
                key={`${activeTag}-${index}`}
                className={`bg-white border rounded-xl transition-shadow ${
                  isOpen
                    ? "border-blue-200 shadow-md shadow-blue-50"
                    : "border-slate-200 hover:border-slate-300"
                }`}
              >
                <dt>
                  <button
                    id={btnId}
                    onClick={() => toggle(index)}
                    aria-expanded={isOpen}
                    aria-controls={panelId}
                    className="w-full flex items-start justify-between p-5 text-left focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-inset rounded-xl gap-4"
                  >
                    <span
                      className={`text-sm font-semibold leading-snug ${
                        isOpen ? "text-blue-700" : "text-slate-800"
                      }`}
                    >
                      {faq.question}
                    </span>
                    <span
                      className={`shrink-0 mt-0.5 ${isOpen ? "text-blue-600" : "text-slate-400"}`}
                      aria-hidden="true"
                    >
                      {isOpen ? (
                        <Minus className="w-4 h-4" />
                      ) : (
                        <Plus className="w-4 h-4" />
                      )}
                    </span>
                  </button>
                </dt>
                <AnimatePresence>
                  {isOpen && (
                    <motion.dd
                      id={panelId}
                      role="region"
                      aria-labelledby={btnId}
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="overflow-hidden m-0"
                    >
                      <div className="px-5 pb-5 border-t border-slate-100 pt-3">
                        <p className="text-sm text-slate-600 leading-relaxed">
                          {faq.answer}
                        </p>
                        {faq.tags && faq.tags.length > 0 && (
                          <div className="flex flex-wrap gap-1.5 mt-3" aria-label="Topics">
                            {faq.tags.map((tag) => (
                              <span
                                key={tag}
                                className="text-[10px] bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full capitalize"
                              >
                                {tag}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </motion.dd>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </dl>
      )}
    </section>
  );
}
