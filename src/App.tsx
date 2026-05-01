/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState } from "react";
import Navbar from "./components/Navbar";
import Timeline from "./components/Timeline";
import Chatbot from "./components/Chatbot";
import FAQ from "./components/FAQ";
import Footer from "./components/Footer";
import { motion, AnimatePresence } from "motion/react";

type Tab = "guide" | "faq" | "chatbot";

const FADE = {
  initial: { opacity: 0, y: 8 },
  animate: { opacity: 1, y: 0 },
  exit:    { opacity: 0, y: -8 },
  transition: { duration: 0.25 },
};

export default function App() {
  const [activeTab, setActiveTab] = useState<Tab>("guide");

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-800 flex flex-col">
      <Navbar activeTab={activeTab} setActiveTab={setActiveTab} />

      <main id="main-content" className="flex-1 p-4 md:p-8">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8">

          {/* ── Left/main column ─────────────────────────────────── */}
          <div className="lg:col-span-8">
            <AnimatePresence mode="wait">
              {activeTab === "guide" && (
                <motion.div key="guide" {...FADE}>
                  <Timeline />
                </motion.div>
              )}
              {activeTab === "faq" && (
                <motion.div key="faq" {...FADE}>
                  <FAQ />
                </motion.div>
              )}
              {/* Mobile-only chatbot (lg+ sees it in sidebar) */}
              {activeTab === "chatbot" && (
                <motion.div key="chatbot-mobile" {...FADE} className="lg:hidden">
                  <Chatbot />
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* ── Sticky sidebar chatbot (desktop only) ────────────── */}
          <aside
            className="hidden lg:block lg:col-span-4"
            aria-label="Election Assistant chatbot sidebar"
          >
            <div className="sticky top-24">
              <Chatbot />
            </div>
          </aside>
        </div>
      </main>

      <Footer />
    </div>
  );
}
