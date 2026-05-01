/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Vote } from "lucide-react";

interface NavbarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

const TABS = [
  { id: "guide", label: "Election Guide" },
  { id: "faq",   label: "FAQ" },
  { id: "chatbot", label: "Chatbot" },
];

export default function Navbar({ activeTab, setActiveTab }: NavbarProps) {
  return (
    <nav
      className="sticky top-0 z-50 bg-white border-b border-slate-200 px-4 md:px-8 py-3 flex justify-between items-center shadow-sm"
      aria-label="Main navigation"
    >
      {/* Logo */}
      <button
        className="flex items-center gap-3 cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500 rounded"
        onClick={() => setActiveTab("guide")}
        aria-label="Go to Election Guide home"
      >
        <div
          className="w-8 h-8 bg-blue-700 rounded flex items-center justify-center"
          aria-hidden="true"
        >
          <Vote className="w-4 h-4 text-white" />
        </div>
        <span className="text-xl font-bold text-slate-800 tracking-tight">
          ElectionAssist
        </span>
      </button>

      {/* Desktop tabs */}
      <ul
        className="hidden md:flex gap-8 text-sm font-medium list-none m-0 p-0"
        role="tablist"
        aria-label="App sections"
      >
        {TABS.map((tab) => (
          <li key={tab.id} role="presentation">
            <button
              role="tab"
              aria-selected={activeTab === tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`transition-colors pb-1 border-b-2 focus:outline-none focus:ring-2 focus:ring-blue-400 rounded ${
                activeTab === tab.id
                  ? "text-blue-700 border-blue-700"
                  : "text-slate-600 border-transparent hover:text-blue-700"
              }`}
            >
              {tab.label}
            </button>
          </li>
        ))}
      </ul>

      {/* CTA */}
      <a
        href="https://electoralsearch.eci.gov.in/"
        target="_blank"
        rel="noopener noreferrer"
        className="hidden md:inline-flex bg-slate-800 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-slate-700 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-400"
        aria-label="Visit official election portal (opens in new tab)"
      >
        Official Portal ↗
      </a>

      {/* Mobile tabs */}
      <div className="md:hidden flex gap-1 ml-2" role="tablist" aria-label="App sections">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            role="tab"
            aria-selected={activeTab === tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`text-[10px] font-bold px-2 py-1 rounded focus:outline-none focus:ring-2 focus:ring-blue-400 ${
              activeTab === tab.id
                ? "bg-blue-50 text-blue-700"
                : "text-slate-500 hover:text-blue-700"
            }`}
          >
            {tab.id === "chatbot" ? "Chat" : tab.id === "guide" ? "Guide" : "FAQ"}
          </button>
        ))}
      </div>
    </nav>
  );
}
