/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Palette } from "lucide-react";
import Chatbot from "./components/Chatbot";
import ColoringBookForm from "./components/ColoringBookForm";

export default function App() {
  return (
    <div className="min-h-screen bg-[#FDFBF7] text-neutral-900 font-sans selection:bg-indigo-100 selection:text-indigo-900 flex flex-col">
      <header className="bg-white border-b border-neutral-200 sticky top-0 z-10 px-6 py-4 flex items-center gap-3">
        <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white shrink-0 shadow-sm shadow-indigo-200">
          <Palette className="w-5 h-5" />
        </div>
        <div>
          <h1 className="font-bold tracking-tight text-xl text-neutral-900 leading-tight">
            ColorCraft
          </h1>
          <p className="text-xs text-neutral-500 font-medium tracking-wide uppercase">
            AI Coloring Book Studio
          </p>
        </div>
      </header>

      <main className="flex-1 w-full max-w-7xl mx-auto p-6 md:p-8 grid lg:grid-cols-[1fr_400px] gap-8 h-[calc(100vh-73px)]">
        <section className="h-full">
          <ColoringBookForm />
        </section>

        <aside className="h-[600px] lg:h-full">
          <Chatbot />
        </aside>
      </main>
    </div>
  );
}
