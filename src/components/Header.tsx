"use client";

import { Building2 } from "lucide-react";

export default function Header() {
  return (
    <header className="bg-white dark:bg-slate-800 shadow-sm border-b border-slate-200 dark:border-slate-700">
      <div className="container mx-auto max-w-4xl px-4 py-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary-600 rounded-lg">
            <Building2 className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900 dark:text-white">
              Byggesak Chatbot
            </h1>
            <p className="text-sm text-slate-600 dark:text-slate-400">
              Stavanger & Sandnes Kommune
            </p>
          </div>
        </div>
      </div>
    </header>
  );
}
