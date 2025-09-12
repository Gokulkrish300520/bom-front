"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Layers,
  Users,
  BookOpen,
  Box,
  Calendar,
  Settings,
  Plus,
  Flag,
} from "lucide-react";

type NavItem = {
  id: string;
  label: string;
  href: string;
  Icon: React.ComponentType<any>;
};

const NAV_ITEMS: NavItem[] = [
  { id: "pipelines", label: "Pipelines", href: "/crm/pipelines", Icon: Layers },
  { id: "contacts", label: "Contacts", href: "/crm/contacts", Icon: Users },
  {
    id: "companies",
    label: "Companies",
    href: "/crm/company",
    Icon: BookOpen,
  },
  { id: "products", label: "Products", href: "", Icon: Box },
  {
    id: "activities",
    label: "Activities",
    href: "",
    Icon: Calendar,
  },
  { id: "reports", label: "Reports", href: "", Icon: Flag },
  { id: "settings", label: "Settings", href: "", Icon: Settings },
];

export default function Sidebar() {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);

  return (
    <aside
      className={`hidden md:flex flex-col ${
        collapsed ? "w-14" : "w-52"
      } bg-[#0f2230] text-white transition-all duration-200 sticky top-12 z-40 h-[calc(100vh-3rem)]`}
      aria-label="left sidebar"
    >
      {/* Workspace / Brand */}
      <div className="flex items-center justify-between px-2 py-2 border-b border-white/10">
        <div
          className={`flex items-center gap-2 ${
            collapsed ? "justify-center w-full" : ""
          }`}
        >
          <div className="w-7 h-7 rounded-sm bg-emerald-400 flex items-center justify-center font-bold text-[#042018] text-xs">
            B
          </div>
          {!collapsed && (
            <div className="flex flex-col leading-tight">
              <span className="text-xs font-medium">Team Pipelines</span>
              <span className="text-[10px] text-white/60">Sales Pipeline</span>
            </div>
          )}
        </div>

        {/* Collapse toggle */}
        <button
          className="ml-1 p-1 rounded hover:bg-white/10"
          onClick={() => setCollapsed((s) => !s)}
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          <Plus
            size={12}
            className={`${collapsed ? "rotate-45" : "rotate-0"} transition`}
          />
        </button>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-auto px-1 py-2">
        <ul className="space-y-1">
          {NAV_ITEMS.map((it) => {
            const isActive = pathname?.startsWith(it.href);
            return (
              <li key={it.id}>
                <Link
                  href={it.href}
                  className={`flex items-center gap-2 py-1.5 px-2 rounded-md mx-1 text-xs hover:bg-white/10 transition ${
                    isActive ? "bg-white/10 font-medium" : "text-white/80"
                  }`}
                >
                  <span className="flex items-center justify-center w-6">
                    <it.Icon size={16} />
                  </span>
                  {!collapsed && <span>{it.label}</span>}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* User */}
      <div className="px-2 py-2 border-t border-white/10">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-full bg-white/10 flex items-center justify-center text-xs">
            G
          </div>
          {!collapsed && <div className="text-xs">Glonix</div>}
        </div>
      </div>
    </aside>
  );
}
