"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Package,
  Banknote,
  FileText,
  ShoppingCart,
  PieChart,
  ChevronDown,
  ChevronRight,
} from "lucide-react";
import { useState, useEffect } from "react";

export default function BooksLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [expanded, setExpanded] = useState<string | null>(null);

  const menuItems = [
    {
      name: "Items",
      icon: <Package size={18} />,
      subItems: [
        { name: "Items", href: "/books/items" },
        { name: "Inventory Adjustments", href: "/books/items/adjustments" },
      ],
    },
    {
      name: "Banking",
      icon: <Banknote size={18} />,
      subItems: [],
      href: "/books/banking",
    },
    {
      name: "Sales",
      icon: <FileText size={18} />,
      subItems: [
        { name: "Customers", href: "/books/sales/customers" },
        { name: "Quotes", href: "/books/sales/quotes" },
        { name: "proforma Invoices", href: "/books/sales/proforma-invoice" },
        { name: "Invoice", href: "/books/sales/invoice" },
        { name: "Delivery Challan", href: "/books/sales/challans" },
        { name: "Customers_trans", href: "/books/sales/customers_trans"}
      ],
    },
    {
      name: "Purchase",
      icon: <ShoppingCart size={18} />,
      subItems: [
        { name: "Vendors", href: "/books/purchase/vendors" },
        { name: "Bills", href: "/books/purchase/bills" },
      ],

    },
    {
      name: "Reports",
      icon: <PieChart size={18} />,
      subItems: [],
      href: "/books/reports",
    },
  ];

  // Auto-expand parent if current route matches a subItem
  useEffect(() => {
    menuItems.forEach((item) => {
      if (item.subItems.some((sub) => pathname === sub.href)) {
        setExpanded(item.name);
      }
    });
  }, [pathname]);

  const toggleExpand = (menuName: string) => {
    setExpanded(expanded === menuName ? null : menuName);
  };

  return (
    <div className="flex min-h-screen font-sans">
      {/* Sidebar */}
      <div className="flex flex-col w-64 bg-white border-r border-gray-200">
        {/* Logo */}
        <div className="px-4 py-3 border-b border-gray-200">
          <h1 className="text-lg font-semibold text-green-600">Zoho Books</h1>
        </div>

        {/* Menu */}
        <nav className="flex-1 py-2 overflow-y-auto">
          {menuItems.map((item) => {
            const isActiveParent =
              (item.href && pathname === item.href) ||
              item.subItems.some((sub) => pathname === sub.href);

            return (
              <div key={item.name}>
                {/* Parent item */}
                {item.subItems.length > 0 ? (
                  <div
                    onClick={() => toggleExpand(item.name)}
                    className={`flex items-center justify-between px-4 py-2 cursor-pointer text-sm font-medium transition-colors ${
                      isActiveParent
                        ? "bg-green-100 text-green-600 border-l-4 border-green-500"
                        : "text-gray-700 hover:bg-gray-100"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      {item.icon}
                      <span>{item.name}</span>
                    </div>
                    {expanded === item.name ? (
                      <ChevronDown size={16} />
                    ) : (
                      <ChevronRight size={16} />
                    )}
                  </div>
                ) : (
                  <Link
                    href={item.href || "#"}
                    className={`flex items-center gap-3 px-4 py-2 text-sm font-medium transition-colors ${
                      isActiveParent
                        ? "bg-green-100 text-green-600 border-l-4 border-green-500"
                        : "text-gray-700 hover:bg-gray-100"
                    }`}
                  >
                    {item.icon}
                    {item.name}
                  </Link>
                )}

                {/* Submenu */}
                {expanded === item.name && item.subItems.length > 0 && (
                  <div className="mt-1 ml-10">
                    {item.subItems.map((sub) => (
                      <Link
                        key={sub.name}
                        href={sub.href}
                        className={`block py-1 text-sm transition-colors ${
                          pathname === sub.href
                            ? "text-green-600 font-medium"
                            : "text-gray-600 hover:text-green-600"
                        }`}
                      >
                        {sub.name}
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </nav>
      </div>

      {/* Main content */}
      <div className="flex-1 p-6 bg-gray-50">{children}</div>
    </div>
  );
}
