/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Timeline – Interactive, accessible election process stepper.
 * Fetches steps from the backend and renders them with full keyboard navigation.
 */

import { useEffect, useState, useCallback } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  UserPlus, FileCheck, Megaphone, Vote as VoteIcon, BarChart,
  ChevronRight, ChevronLeft, CheckCircle2, ExternalLink, RefreshCw,
} from "lucide-react";

// ── Types ─────────────────────────────────────────────────────────────────────
interface Step {
  id: string;
  title: string;
  description: string;
  icon: string;
  details: string[];
  deadline?: string;
  link?: string;
}

// ── Icon registry ─────────────────────────────────────────────────────────────
const ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  UserPlus, FileCheck, Megaphone, Vote: VoteIcon, BarChart,
};

// ── Component ─────────────────────────────────────────────────────────────────
export default function Timeline() {
  const [steps, setSteps] = useState<Step[]>([]);
  const [activeStep, setActiveStep] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const fetchSteps = useCallback(() => {
    setLoading(true);
    setError(false);
    fetch("/api/steps")
      .then((res) => {
        if (!res.ok) throw new Error("Failed to fetch");
        return res.json() as Promise<Step[]>;
      })
      .then((data) => { setSteps(data); setLoading(false); })
      .catch(() => { setError(true); setLoading(false); });
  }, []);

  useEffect(() => { fetchSteps(); }, [fetchSteps]);

  const goNext = useCallback(
    () => setActiveStep((p) => Math.min(p + 1, steps.length - 1)),
    [steps.length]
  );
  const goPrev = useCallback(
    () => setActiveStep((p) => Math.max(p - 1, 0)),
    []
  );

  // Keyboard navigation on the stepper
  const handleStepperKey = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "ArrowRight") { e.preventDefault(); goNext(); }
      if (e.key === "ArrowLeft")  { e.preventDefault(); goPrev(); }
      if (e.key === "Home")       { e.preventDefault(); setActiveStep(0); }
      if (e.key === "End")        { e.preventDefault(); setActiveStep(steps.length - 1); }
    },
    [goNext, goPrev, steps.length]
  );

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-3" role="status">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-blue-600" aria-hidden="true" />
        <span className="text-sm text-slate-500">Loading election guide…</span>
      </div>
    );
  }

  if (error || steps.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-4" role="alert">
        <p className="text-slate-600 font-semibold">Unable to load the election guide.</p>
        <button
          onClick={fetchSteps}
          className="flex items-center gap-2 text-sm font-bold text-blue-600 hover:text-blue-800 focus:outline-none focus:ring-2 focus:ring-blue-400 rounded"
        >
          <RefreshCw className="w-4 h-4" aria-hidden="true" />
          Try again
        </button>
      </div>
    );
  }

  const current = steps[activeStep];
  const Icon = ICON_MAP[current.icon] ?? VoteIcon;

  return (
    <div className="flex flex-col gap-8">
      {/* Page header */}
      <header>
        <span className="text-blue-600 font-bold text-xs uppercase tracking-widest">
          Official Election Roadmap
        </span>
        <h1 className="text-3xl font-extrabold text-slate-900 mt-1">
          Your Path to the Ballot Box
        </h1>
        <p className="text-slate-500 mt-2 max-w-2xl text-sm leading-relaxed">
          Navigate the election cycle with confidence. Follow each phase to
          ensure your voice is heard and your vote is counted.
        </p>
      </header>

      {/* Stepper card */}
      <section
        aria-label="Election process stepper"
        className="bg-white border border-slate-200 rounded-2xl p-6 md:p-8 shadow-sm"
      >
        {/* Progress bar */}
        <div
          className="w-full bg-slate-100 rounded-full h-1.5 mb-6"
          role="progressbar"
          aria-valuenow={activeStep + 1}
          aria-valuemin={1}
          aria-valuemax={steps.length}
          aria-label={`Step ${activeStep + 1} of ${steps.length}`}
        >
          <div
            className="bg-blue-600 h-1.5 rounded-full transition-all duration-500"
            style={{ width: `${((activeStep + 1) / steps.length) * 100}%` }}
          />
        </div>

        {/* Step dots — keyboard-navigable tabpanel */}
        <nav aria-label="Election phases" onKeyDown={handleStepperKey}>
          <ol className="relative flex justify-between" role="tablist">
            {steps.map((step, index) => {
              const isComplete = index < activeStep;
              const isActive = index === activeStep;
              return (
                <li
                  key={step.id}
                  className="flex flex-col items-center relative flex-1"
                  role="presentation"
                >
                  <button
                    role="tab"
                    onClick={() => setActiveStep(index)}
                    aria-selected={isActive}
                    aria-label={`${step.title}${isComplete ? " — completed" : isActive ? " — current" : ""}`}
                    tabIndex={isActive ? 0 : -1}
                    className={`timeline-dot transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 cursor-pointer ${
                      isComplete
                        ? "bg-green-500 text-white"
                        : isActive
                        ? "bg-blue-700 text-white shadow-[0_0_0_5px_rgba(29,78,216,0.15)]"
                        : "bg-slate-200 text-slate-500 hover:bg-slate-300"
                    }`}
                  >
                    {isComplete ? (
                      <CheckCircle2 className="w-4 h-4" aria-hidden="true" />
                    ) : (
                      <span aria-hidden="true">{index + 1}</span>
                    )}
                  </button>
                  {index < steps.length - 1 && (
                    <div
                      className="timeline-line transition-colors duration-500"
                      aria-hidden="true"
                      style={{ background: index < activeStep ? "#22c55e" : "#e2e8f0" }}
                    />
                  )}
                  <span
                    className={`mt-3 text-[10px] font-semibold text-center leading-tight transition-colors hidden sm:block ${
                      isActive ? "text-blue-700" : isComplete ? "text-slate-600" : "text-slate-400"
                    }`}
                    aria-hidden="true"
                  >
                    {step.title.split(" ").slice(-1)[0]}
                  </span>
                </li>
              );
            })}
          </ol>
        </nav>

        {/* Step detail panel */}
        <AnimatePresence mode="wait">
          <motion.div
            key={activeStep}
            role="tabpanel"
            aria-label={`Details for ${current.title}`}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.22 }}
            className="mt-8 pt-6 border-t border-slate-100 flex flex-col md:flex-row gap-5"
          >
            {/* Icon */}
            <div
              className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center shrink-0"
              aria-hidden="true"
            >
              <Icon className="w-6 h-6 text-blue-600" />
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-3 justify-between">
                <h2 className="text-base font-bold text-slate-900">
                  Phase {activeStep + 1} — {current.title}
                </h2>
                <span className="text-[10px] font-bold bg-blue-50 text-blue-700 px-2.5 py-1 rounded-full uppercase tracking-wider shrink-0">
                  {activeStep + 1} / {steps.length}
                </span>
              </div>

              <p className="text-sm text-slate-600 mt-2 leading-relaxed">
                {current.description}
              </p>

              {/* Deadline */}
              {current.deadline && (
                <p className="mt-2 text-xs text-amber-700 bg-amber-50 border border-amber-100 rounded-lg px-3 py-1.5 inline-flex items-center gap-1.5">
                  <span aria-hidden="true">⏰</span>
                  {current.deadline}
                </p>
              )}

              {/* Detail chips */}
              <ul className="mt-4 flex flex-wrap gap-2" aria-label="Key points">
                {current.details.map((detail) => (
                  <li
                    key={detail}
                    className="flex items-center gap-1.5 text-xs text-slate-600 bg-slate-50 px-3 py-1.5 rounded-full border border-slate-100"
                  >
                    <CheckCircle2 className="w-3 h-3 text-green-500 shrink-0" aria-hidden="true" />
                    {detail}
                  </li>
                ))}
              </ul>

              {/* Actions */}
              <div className="flex flex-wrap items-center gap-3 mt-5">
                <button
                  onClick={goPrev}
                  disabled={activeStep === 0}
                  aria-label="Go to previous phase"
                  className="flex items-center gap-1.5 text-xs font-semibold text-slate-600 border border-slate-200 px-3 py-1.5 rounded-lg hover:bg-slate-50 disabled:opacity-30 disabled:cursor-not-allowed transition-colors focus:outline-none focus:ring-2 focus:ring-blue-400"
                >
                  <ChevronLeft className="w-3.5 h-3.5" aria-hidden="true" />
                  Previous
                </button>
                <button
                  onClick={goNext}
                  disabled={activeStep === steps.length - 1}
                  aria-label="Go to next phase"
                  className="flex items-center gap-1.5 text-xs font-semibold text-blue-700 bg-blue-50 px-3 py-1.5 rounded-lg hover:bg-blue-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors focus:outline-none focus:ring-2 focus:ring-blue-400"
                >
                  Next phase
                  <ChevronRight className="w-3.5 h-3.5" aria-hidden="true" />
                </button>
                {current.link && (
                  <a
                    href={current.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 text-xs font-semibold text-slate-500 hover:text-blue-700 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-400 rounded ml-auto"
                    aria-label={`Official resource for ${current.title} (opens in new tab)`}
                  >
                    Official resource
                    <ExternalLink className="w-3 h-3" aria-hidden="true" />
                  </a>
                )}
              </div>
            </div>
          </motion.div>
        </AnimatePresence>
      </section>

      {/* Info cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="bg-gradient-to-br from-blue-900 to-blue-800 rounded-2xl p-6 text-white">
          <div className="flex justify-between items-start flex-wrap gap-2">
            <h3 className="font-bold text-base">Check Your Registration</h3>
            <span className="bg-blue-700 text-[10px] px-2 py-1 rounded-full uppercase font-bold tracking-wider">
              Live
            </span>
          </div>
          <p className="text-xs text-blue-200 mt-2 leading-relaxed">
            Verify your name on the electoral roll before the deadline. Missing
            registration = no vote.
          </p>
          <a
            href="https://electoralsearch.eci.gov.in/"
            target="_blank"
            rel="noopener noreferrer"
            className="mt-3 inline-flex items-center gap-1 text-xs font-bold text-white bg-blue-600 hover:bg-blue-500 px-3 py-1.5 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-white"
            aria-label="Check electoral registration (opens in new tab)"
          >
            Check Now <ExternalLink className="w-3 h-3" aria-hidden="true" />
          </a>
        </div>
        <div className="bg-white border border-slate-200 rounded-2xl p-6">
          <h3 className="font-bold text-slate-900">Voter Helpline</h3>
          <p className="text-xs text-slate-500 mt-1 leading-relaxed">
            Questions? Call the official Election Commission helpline — available
            nationwide, free of charge.
          </p>
          <p className="mt-3 text-2xl font-extrabold text-blue-700 tracking-tight">
            1950
          </p>
          <p className="text-[10px] text-slate-400 mt-0.5">
            National Voter Helpline · Election Commission of India
          </p>
        </div>
      </div>
    </div>
  );
}
