"use client";

import { Plus } from "lucide-react";

export default function SecondarySidebar() {
  return (
    <aside className="h-full flex flex-col bg-[#124265] text-white border-r border-white/10 w-48">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-white/10">
        <h2 className="text-xs font-medium tracking-wide">Team Pipelines</h2>
        <button className="p-1 hover:bg-white/10 rounded">
          <Plus size={14} />
        </button>
      </div>

      {/* Items */}
      <nav className="flex-1 overflow-auto px-2 py-2 text-xs">
        <ul className="space-y-1">
          <li>
            <button className="w-full flex items-center px-2 py-1.5 rounded hover:bg-white/10 transition">
              Clone from a Template
            </button>
          </li>
          <li>
            <button className="w-full flex items-center px-2 py-1.5 rounded hover:bg-white/10 transition">
              For Teams
            </button>
          </li>
          <li>
            <button className="w-full flex items-center px-2 py-1.5 rounded hover:bg-white/10 transition">
              For Industries
            </button>
          </li>
        </ul>
      </nav>
    </aside>
  );
}
