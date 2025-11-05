"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const breadcrumbNameMap: Record<string, string> = {
  books:"Books",
  purchase: "Purchase",
  sales: "Sales",
  gst:"Gst",
  nongst:"Non-gst",
  edit: "Edit",
  new: "New",
  view: "View",
};

export default function Breadcrumb() {
  const pathname = usePathname(); // e.g. "/purchase/gst-bills/edit"
  const parts = pathname.split("/").filter(Boolean);

  return (
    <nav aria-label="Breadcrumb" className="text-sm mb-4">
      <ol className="flex space-x-2">
        <li>
          <Link href="/dashboard" className="text-green-600 hover:underline">
            Dashboard
          </Link>
        </li>

        {parts.map((part, index) => {
          const href = "/" + parts.slice(0, index + 1).join("/");
          const isLast = index === parts.length - 1;

          const label = breadcrumbNameMap[part.toLowerCase()] || part;

          return (
            <li key={href} className="flex items-center space-x-2">
              <span>/</span>
              {isLast ? (
                <span className="text-gray-500">{label}</span>
              ) : (
                <Link href={href} className="text-green-600 hover:underline">
                  {label}
                </Link>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
