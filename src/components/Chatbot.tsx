/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Chatbot v2 – Decision engine + intent-aware + session-step tracking
 * + quick replies from server + voter type selector + ARIA improvements
 */

import { useState, useRef, useEffect, useCallback, KeyboardEvent } from "react";
import {
  Send, Bot, Trash2, Sparkles, AlertCircle, User, Info,
  ChevronDown, MapPin, Zap,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

// ── Types ─────────────────────────────────────────────────────────────────────
interface Message {
  id: string;
  text: string;
  sender: "user" | "bot";
  timestamp: Date;
  intent?: string;
  poweredBy?: "gemini" | "fallback" | "decision-engine";
  quickReplies?: string[];
}

interface HistoryEntry {
  role: "user" | "model";
  parts: Array<{ text: string }>;
}

type VoterType = "citizen" | "nri" | "service" | "unknown";
type Language = "en" | "hi" | "te" | "ta" | "mr" | "bn";

interface UserContext {
  isFirstTimeVoter: boolean;
  language: Language;
  voterType: VoterType;
  state: string;
  sessionStep?: string;
}

// ── Constants ─────────────────────────────────────────────────────────────────
const MAX_HISTORY_TURNS = 10;

const LANGUAGES: { code: Language; label: string; nativeName: string }[] = [
  { code: "en", label: "English", nativeName: "English" },
  { code: "hi", label: "Hindi", nativeName: "हिन्दी" },
  { code: "te", label: "Telugu", nativeName: "తెలుగు" },
  { code: "ta", label: "Tamil", nativeName: "தமிழ்" },
  { code: "mr", label: "Marathi", nativeName: "मराठी" },
  { code: "bn", label: "Bengali", nativeName: "বাংলা" },
];

const VOTER_TYPES: { value: VoterType; label: string; desc: string }[] = [
  { value: "citizen", label: "Indian Citizen", desc: "Voting within India" },
  { value: "nri", label: "NRI / Overseas", desc: "Indian citizen abroad" },
  { value: "service", label: "Service Voter", desc: "Armed forces / Govt service" },
  { value: "unknown", label: "Not sure", desc: "" },
];

const INITIAL_BOT_TEXT =
  "Hello! I'm ElectionAssist 🗳️ — your smart civic guide for Indian elections.\n\nI can help with voter registration, polling procedures, your rights, and more. I'll guide you step by step where possible!\n\nWhat would you like to know today?";

const DEFAULT_QUICK_REPLIES = ["How to register to vote?", "Find my polling booth", "What ID do I need?", "What is NOTA?"];

// ── Helpers ───────────────────────────────────────────────────────────────────
function createMessage(
  text: string,
  sender: "user" | "bot",
  extras?: Partial<Message>
): Message {
  return {
    id: `${Date.now()}-${Math.random()}`,
    text,
    sender,
    timestamp: new Date(),
    ...extras,
  };
}

function trimHistory(history: HistoryEntry[]): HistoryEntry[] {
  const maxEntries = MAX_HISTORY_TURNS * 2;
  return history.length > maxEntries ? history.slice(-maxEntries) : history;
}

const INTENT_LABELS: Record<string, string> = {
  registration: "📋 Registration",
  eligibility: "✅ Eligibility",
  voting_process: "🗳️ Voting Process",
  id_documents: "🪪 ID Documents",
  nota: "✖️ NOTA",
  postal_ballot: "📬 Postal Ballot",
  violations: "🚨 Violations",
  evm: "🖥️ EVM",
  mcc: "📜 MCC",
  results: "📊 Results",
  first_time: "🌟 First-Time Voter",
  polling_booth: "📍 Polling Booth",
  general: "ℹ️ General",
};

const ENGINE_LABELS = {
  "decision-engine": { label: "Guided Flow", color: "bg-emerald-600" },
  "gemini": { label: "Gemini AI", color: "bg-blue-600" },
  "fallback": { label: "Assistant", color: "bg-slate-600" },
};

// ── Component ─────────────────────────────────────────────────────────────────
export default function Chatbot() {
  const [messages, setMessages] = useState<Message[]>([
    createMessage(INITIAL_BOT_TEXT, "bot", { quickReplies: DEFAULT_QUICK_REPLIES }),
  ]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [poweredBy, setPoweredBy] = useState<"gemini" | "fallback" | "decision-engine" | null>(null);
  const [showContextPanel, setShowContextPanel] = useState(true);
  const [showLangMenu, setShowLangMenu] = useState(false);
  const [userContext, setUserContext] = useState<UserContext>({
    isFirstTimeVoter: false,
    language: "en",
    voterType: "unknown",
    state: "",
    sessionStep: undefined,
  });

  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const historyRef = useRef<HistoryEntry[]>([]);

  // Auto-scroll
  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, isTyping]);

  // Close lang menu on outside click
  useEffect(() => {
    const handler = () => setShowLangMenu(false);
    if (showLangMenu) document.addEventListener("click", handler);
    return () => document.removeEventListener("click", handler);
  }, [showLangMenu]);

  const sendMessage = useCallback(
    async (text?: string) => {
      const messageText = (text ?? input).trim();
      if (!messageText || isTyping) return;

      setError(null);
      setInput("");
      setIsTyping(true);
      setMessages((prev) => [...prev, createMessage(messageText, "user")]);

      // Auto-detect first-time voter intent
      const lowerText = messageText.toLowerCase();
      const isFirstTime =
        !userContext.isFirstTimeVoter &&
        (lowerText.includes("first time") ||
          lowerText.includes("never voted") ||
          lowerText.includes("new voter") ||
          lowerText.includes("first voter"));

      const ctxToSend = isFirstTime
        ? { ...userContext, isFirstTimeVoter: true }
        : userContext;

      if (isFirstTime) setUserContext(ctxToSend);

      try {
        const response = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            message: messageText,
            history: trimHistory(historyRef.current),
            userContext: ctxToSend,
          }),
        });

        if (!response.ok) {
          const errBody = await response.json().catch(() => ({}));
          throw new Error(errBody.error ?? `Server error ${response.status}`);
        }

        const data: {
          response: string;
          powered_by?: "gemini" | "fallback" | "decision-engine";
          intent?: string;
          nextStep?: string;
          quickReplies?: string[];
        } = await response.json();

        // Update session step if decision engine responded
        if (data.nextStep !== undefined) {
          setUserContext((c) => ({ ...c, sessionStep: data.nextStep }));
        }

        historyRef.current = trimHistory([
          ...historyRef.current,
          { role: "user", parts: [{ text: messageText }] },
          { role: "model", parts: [{ text: data.response }] },
        ]);

        if (data.powered_by) setPoweredBy(data.powered_by);

        setMessages((prev) => [
          ...prev,
          createMessage(data.response, "bot", {
            intent: data.intent,
            poweredBy: data.powered_by,
            quickReplies: data.quickReplies?.length ? data.quickReplies : undefined,
          }),
        ]);
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Unknown error";
        setError(`Could not reach the assistant. ${msg}`);
      } finally {
        setIsTyping(false);
        inputRef.current?.focus();
      }
    },
    [input, isTyping, userContext]
  );

  const clearChat = useCallback(() => {
    setMessages([createMessage(INITIAL_BOT_TEXT, "bot", { quickReplies: DEFAULT_QUICK_REPLIES })]);
    historyRef.current = [];
    setError(null);
    setPoweredBy(null);
    setUserContext((c) => ({ ...c, sessionStep: undefined }));
    inputRef.current?.focus();
  }, []);

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); }
  };

  const selectedLang = LANGUAGES.find((l) => l.code === userContext.language) ?? LANGUAGES[0];
  const engineInfo = poweredBy ? ENGINE_LABELS[poweredBy] : null;

  // Get last bot message's quick replies
  const lastBotMsg = [...messages].reverse().find((m) => m.sender === "bot");
  const activeQuickReplies = lastBotMsg?.quickReplies ?? DEFAULT_QUICK_REPLIES;

  return (
    <section
      aria-label="Election Assistant Chatbot"
      className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-lg flex flex-col"
      style={{ height: "640px" }}
    >
      {/* ── Header ─────────────────────────────────────────────────────── */}
      <header className="bg-slate-900 text-white px-4 py-3 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center" aria-hidden="true">
            <Bot className="w-4 h-4 text-white" />
          </div>
          <div>
            <p className="text-sm font-bold leading-tight flex items-center gap-2">
              ElectionAssist
              {engineInfo && (
                <span className={`inline-flex items-center gap-1 ${engineInfo.color} text-[9px] px-2 py-0.5 rounded-full font-bold tracking-wide`} title={`Response by: ${engineInfo.label}`}>
                  {poweredBy === "decision-engine" ? <Zap className="w-2.5 h-2.5" aria-hidden="true" /> : <Sparkles className="w-2.5 h-2.5" aria-hidden="true" />}
                  {engineInfo.label}
                </span>
              )}
            </p>
            <p className="text-[10px] text-slate-400 leading-tight">
              {userContext.isFirstTimeVoter ? "First-time voter mode 🌟" : "Civic Information · Always neutral"}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          {/* Language selector */}
          <div className="relative">
            <button
              onClick={(e) => { e.stopPropagation(); setShowLangMenu((v) => !v); }}
              className="text-slate-400 hover:text-white transition-colors p-1.5 rounded-lg hover:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-400 flex items-center gap-1 text-[10px] font-bold"
              aria-label="Select language"
              aria-expanded={showLangMenu}
            >
              {selectedLang.nativeName}
              <ChevronDown className="w-3 h-3" aria-hidden="true" />
            </button>
            <AnimatePresence>
              {showLangMenu && (
                <motion.div
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -4 }}
                  className="absolute right-0 top-full mt-1 bg-slate-800 border border-slate-700 rounded-lg shadow-xl z-50 min-w-[140px]"
                  onClick={(e) => e.stopPropagation()}
                >
                  {LANGUAGES.map((lang) => (
                    <button
                      key={lang.code}
                      onClick={() => { setUserContext((c) => ({ ...c, language: lang.code })); setShowLangMenu(false); }}
                      className={`w-full text-left px-3 py-2 text-xs hover:bg-slate-700 transition-colors flex items-center justify-between gap-3 ${userContext.language === lang.code ? "text-blue-400 font-bold" : "text-slate-300"}`}
                    >
                      <span>{lang.label}</span>
                      <span className="text-[11px] opacity-70">{lang.nativeName}</span>
                    </button>
                  ))}
                  <p className="px-3 py-2 text-[10px] text-slate-500 border-t border-slate-700">
                    AI responses will adapt to your language preference.
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
          <button
            onClick={clearChat}
            className="text-slate-400 hover:text-white transition-colors p-1.5 rounded-lg hover:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-400"
            aria-label="Clear chat history"
            title="Clear chat"
          >
            <Trash2 className="w-4 h-4" aria-hidden="true" />
          </button>
        </div>
      </header>

      {/* ── Context panel ──────────────────────────────────────────────────── */}
      <AnimatePresence>
        {showContextPanel && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="bg-blue-50 border-b border-blue-100 px-3 py-2 shrink-0"
          >
            <div className="flex items-center justify-between mb-1.5">
              <div className="flex items-center gap-1.5">
                <Info className="w-3 h-3 text-blue-600" aria-hidden="true" />
                <span className="text-[10px] text-blue-700 font-semibold">Personalise your experience</span>
              </div>
              <button
                onClick={() => setShowContextPanel(false)}
                className="text-slate-400 hover:text-slate-600 text-xs focus:outline-none"
                aria-label="Dismiss"
              >×</button>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {/* First-time toggle */}
              <button
                onClick={() => setUserContext((c) => ({ ...c, isFirstTimeVoter: !c.isFirstTimeVoter }))}
                className={`text-[10px] font-bold px-2 py-0.5 rounded-full border transition-colors focus:outline-none focus:ring-2 focus:ring-blue-400 ${userContext.isFirstTimeVoter ? "bg-blue-600 text-white border-blue-600" : "bg-white text-blue-600 border-blue-300 hover:bg-blue-50"}`}
                aria-pressed={userContext.isFirstTimeVoter}
              >
                {userContext.isFirstTimeVoter ? "✓ First-time voter" : "First-time voter?"}
              </button>
              {/* Voter type */}
              {VOTER_TYPES.filter((v) => v.value !== "unknown").map((vt) => (
                <button
                  key={vt.value}
                  onClick={() => setUserContext((c) => ({ ...c, voterType: c.voterType === vt.value ? "unknown" : vt.value }))}
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full border transition-colors focus:outline-none focus:ring-2 focus:ring-blue-400 ${userContext.voterType === vt.value ? "bg-slate-700 text-white border-slate-700" : "bg-white text-slate-500 border-slate-200 hover:bg-slate-50"}`}
                  aria-pressed={userContext.voterType === vt.value}
                  title={vt.desc}
                >
                  {vt.label}
                </button>
              ))}
              {/* State input */}
              <div className="flex items-center gap-1 bg-white border border-slate-200 rounded-full px-2 py-0.5">
                <MapPin className="w-2.5 h-2.5 text-slate-400" aria-hidden="true" />
                <input
                  type="text"
                  value={userContext.state}
                  onChange={(e) => setUserContext((c) => ({ ...c, state: e.target.value.slice(0, 30) }))}
                  placeholder="Your state…"
                  className="text-[10px] text-slate-600 bg-transparent outline-none w-20"
                  aria-label="Enter your state"
                  maxLength={30}
                />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Messages ────────────────────────────────────────────────────── */}
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto p-4 space-y-3"
        role="log"
        aria-live="polite"
        aria-label="Conversation"
        aria-atomic="false"
      >
        <AnimatePresence initial={false}>
          {messages.map((msg) => (
            <motion.div
              key={msg.id}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.18 }}
              className={`flex ${msg.sender === "user" ? "justify-end" : "justify-start"}`}
            >
              <div className={`flex gap-2 max-w-[92%] ${msg.sender === "user" ? "flex-row-reverse" : "flex-row"}`}>
                {/* Avatar */}
                <div
                  className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${msg.sender === "bot" ? "bg-blue-100 text-blue-600" : "bg-slate-200 text-slate-600"}`}
                  aria-hidden="true"
                >
                  {msg.sender === "bot" ? <Bot className="w-3.5 h-3.5" /> : <User className="w-3.5 h-3.5" />}
                </div>

                <div className="flex flex-col gap-1">
                  {/* Bubble */}
                  <div
                    className={`px-3 py-2 rounded-2xl text-xs leading-relaxed shadow-sm ${
                      msg.sender === "user"
                        ? "bg-blue-600 text-white rounded-tr-sm"
                        : "bg-slate-100 text-slate-700 rounded-tl-sm"
                    }`}
                  >
                    <p className="whitespace-pre-wrap break-words">{msg.text}</p>
                    <div className={`flex items-center justify-between gap-2 mt-1`}>
                      <time
                        dateTime={msg.timestamp.toISOString()}
                        className={`text-[9px] ${msg.sender === "user" ? "text-blue-200" : "text-slate-400"}`}
                      >
                        {msg.timestamp.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                      </time>
                      {msg.intent && msg.sender === "bot" && (
                        <span className="text-[9px] text-slate-400 font-medium">
                          {INTENT_LABELS[msg.intent] ?? msg.intent}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {/* Typing indicator */}
        {isTyping && (
          <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex gap-2 items-center"
            role="status"
            aria-label="Assistant is typing"
          >
            <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center" aria-hidden="true">
              <Bot className="w-3.5 h-3.5 text-blue-600" />
            </div>
            <div className="bg-slate-100 px-3 py-2.5 rounded-2xl rounded-tl-sm flex items-center gap-1">
              {[0, 0.12, 0.24].map((delay, i) => (
                <span key={i} className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: `${delay}s` }} aria-hidden="true" />
              ))}
            </div>
          </motion.div>
        )}

        {/* Error */}
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              role="alert"
              className="flex items-start gap-2 bg-red-50 border border-red-100 text-red-700 rounded-xl px-3 py-2 text-xs"
            >
              <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" aria-hidden="true" />
              <span>{error}</span>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ── Input area ──────────────────────────────────────────────────── */}
      <div className="border-t border-slate-100 bg-slate-50 px-3 pt-2 pb-3 shrink-0">
        {/* Dynamic quick replies from last bot message */}
        <div className="flex flex-wrap gap-1.5 mb-2" role="group" aria-label="Suggested questions">
          {activeQuickReplies.map((q) => (
            <button
              key={q}
              onClick={() => sendMessage(q)}
              disabled={isTyping}
              className="text-[10px] bg-white border border-slate-200 px-2.5 py-1 rounded-full text-slate-500 hover:bg-blue-50 hover:border-blue-300 hover:text-blue-700 transition-colors disabled:opacity-40 focus:outline-none focus:ring-2 focus:ring-blue-400"
            >
              {q}
            </button>
          ))}
        </div>

        <div className="flex gap-2">
          <label htmlFor="chat-input" className="sr-only">Type your election question</label>
          <input
            id="chat-input"
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask about voting, registration, rights…"
            disabled={isTyping}
            maxLength={500}
            className="flex-1 bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-slate-100 disabled:text-slate-400 transition-colors"
            aria-label="Type your election question"
          />
          <button
            onClick={() => sendMessage()}
            disabled={!input.trim() || isTyping}
            aria-label="Send message"
            className="bg-blue-600 text-white px-3 py-2 rounded-xl hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors focus:outline-none focus:ring-2 focus:ring-blue-400"
          >
            <Send className="w-4 h-4" aria-hidden="true" />
          </button>
        </div>
        <p className="text-[9px] text-slate-400 mt-1.5 text-center">
          For official information, visit{" "}
          <a href="https://eci.gov.in" target="_blank" rel="noopener noreferrer" className="underline hover:text-blue-600">
            eci.gov.in
          </a>{" "}
          · Helpline: <a href="tel:1950" className="underline hover:text-blue-600">1950</a>
        </p>
      </div>
    </section>
  );
}
