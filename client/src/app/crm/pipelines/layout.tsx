"use client";

import { usePathname, useRouter } from "next/navigation";
import { BarChart3 } from "lucide-react";

const navItems = ["dashboard", "rfq","feasibility","quotation", "negotiation", "closed-deals", "preprocess", "postprocess", "payment-pending","completed-projects"]; // add others later

export default function PipelinesLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const activeTab = pathname.split("/").pop() || "dashboard";

  
  return (
    <div>
      <nav className="mx-auto  bg-white px-6 shadow-sm border-b sticky top-0 z-50">
  <div className="">
    <div className="flex gap-1 overflow-x-auto justify-around">
      {navItems.map((item) => (
        <button
          key={item}
          onClick={() => router.push(`/crm/pipelines/${item}`)}
          className={`px-4 py-3 text-sm font-medium whitespace-nowrap border-b-2 transition-colors duration-300 ${
            activeTab === item
              ? "text-white border-green-500 bg-blue-900"
              : "text-gray-600 border-transparent hover:text-gray-900 hover:border-blue-500"
          }`}
        >
          {item === "dashboard" && <BarChart3 size={16} className="inline mr-2" />}
          {item.charAt(0).toUpperCase() + item.slice(1).replace("-", " ")}
        </button>
      ))}
    </div>
  </div>
</nav>


      <main className=" mx-auto px-6 py-8">{children}</main>
    </div>
  );
}
