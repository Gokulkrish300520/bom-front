"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { LogOut,LayoutDashboard } from "lucide-react";
import {
  Package,
  Banknote,
  FileText,
  ShoppingCart,
  PieChart,
  ChevronDown,
  ChevronRight,
  Repeat,
} from "lucide-react"; // Added Repeat for Transactions icon
import { useState, useEffect,useRef } from "react";

export default function BooksLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [expanded, setExpanded] = useState<string | null>(null);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLogout = async () => {
    try {
      const refresh = localStorage.getItem("refresh"); // stored refresh token
      if (!refresh) {
        router.push("/login");
        return;
      }

      await fetch("https://web-production-6baf3.up.railway.app/api/auth/logout/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ refresh }),
      });

      // Clear tokens from storage
      localStorage.removeItem("access");
      localStorage.removeItem("refresh");

      router.push("/login"); // redirect after logout
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  const menuItems = [
    {
      name: "Items",
      icon: <Package size={18} />,
      subItems: [
        { name: "Items", href: "/books/items/item" },
        { name: "Inventory Adjustments", href: "/books/items/inventory" },
      ],
    },
    // {
    //   name: "Banking",
    //   icon: <Banknote size={18} />,
    //   subItems: [],
    //   href: "/books/banking",
    // },
    {
      name: "Sales",
      icon: <FileText size={18} />,
      subItems: [
        { name: "Customers", href: "/books/sales/customers" },
        { name: "Quotes", href: "/books/sales/quotes" },
        { name: "Proforma Invoices", href: "/books/sales/proforma-invoice" },
        { name: "Invoice", href: "/books/sales/invoice" },
        { name: "Delivery Challan", href: "/books/sales/challans" },
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
      name: "Transactions",
      icon: <Repeat size={18} />,
      subItems: [],
      href: "/books/transactions",
    },
    {
      name: "Reports",
      icon: <PieChart size={18} />,
      subItems: [],
      href: "/books/reports",
    },
  ];

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
        <div className="px-4 py-2 border-b border-green-700">
          <Link href="/books" className="text-lg font-semibold text-green-600 cursor-pointer">
            Books
          </Link>
        </div>

        {/* Menu */}
        <nav className="flex-1 py-2 overflow-y-auto">
          {menuItems.map((item) => {
            const isActiveParent =
              (item.href && pathname === item.href) ||
              item.subItems.some((sub) => pathname === sub.href);

            return (
              <div key={item.name}>
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
        
        <div className="flex-1 flex flex-col bg-gray-50">
        {/* Top Navbar */}
        <div className="h-11 bg-green-700 flex justify-end items-center px-4 shadow-md">
          <div className="relative" ref={dropdownRef}>
            <div
              className="w-8 h-8 rounded-full bg-gray-200 cursor-pointer"
              onClick={() => setDropdownOpen((prev) => !prev)}
            />
            {dropdownOpen && (
              <div className="absolute right-0 mt-2 w-44 bg-white shadow-md rounded-md py-2 z-50">
                <button
                  onClick={() => router.push("/dashboard")}
                  className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 w-full text-left"
                >
                  <LayoutDashboard size={16} />
                  Go to Dashboard
                </button>
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-gray-100 w-full text-left"
                >
                  <LogOut size={16} />
                  Logout
                </button>
              </div>
            )}
          </div>
        </div>

      {/* Main content */}
      <div className="flex-1 p-6 bg-gray-50">{children}</div>
    </div>
    </div>
  );
}
