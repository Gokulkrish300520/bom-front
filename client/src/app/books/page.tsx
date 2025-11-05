"use client";

import { useState } from "react";

import { useRouter } from "next/navigation";
import LowStockTable from "./low-stock-items/page";
import PendingTransactionsTable from "./pending-transactions/page";
import Dealspage from "./deals/page";

export default function DashboardPage() {
  const router = useRouter();
  const [showLowStock, setShowLowStock] = useState(false);
  const [showPendingTransactions, setShowPendingTransactions] = useState(false);
  const [showDeals, setShowDeals] = useState(false);

  return (
    <div className="min-h-screen p-8  bg-green-50 flex flex-col items-center space-y-8">
      <h1 className="text-4xl font-bold mb-8 text-center">Books & Transactions Dashboard</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full max-w-6xl justify-center">
        {/* Low Stock Card */}
        <div
          className="bg-white p-6 rounded-xl shadow-lg cursor-pointer transform transition-all hover:scale-105 hover:shadow-2xl"
          onClick={() => router.push("/books/low-stock-items")}
        >
          <h2 className="text-2xl font-bold mb-2 text-green-700">Low Stock Items</h2>
          <p className="text-gray-600">View all items that are below their reorder point</p>
        </div>

        {/* Pending Transactions Card */}
        <div
          className="bg-white p-6 rounded-xl shadow-lg cursor-pointer transform transition-all hover:scale-105 hover:shadow-2xl"
          onClick={() => router.push("/books/pending-transactions")}
        >
          <h2 className="text-2xl font-bold mb-2 text-blue-700">Pending Transactions</h2>
          <p className="text-gray-600">Check all transactions that are yet to be fully paid</p>
        </div>

        {/* Manage Deals Card */}
        <div
          className="bg-white p-6 rounded-xl shadow-lg cursor-pointer transform transition-all hover:scale-105 hover:shadow-2xl"
          onClick={() => router.push("/books/deals")}
        >
          <h2 className="text-2xl font-bold mb-2 text-blue-700">Manage Deals</h2>
          <p className="text-gray-600">Check all Deals and Manage if made wrong</p>
        </div>
      </div>

      {/* Conditional Rendering of Tables */}
      <div className="w-full max-w-7xl mt-8 space-y-8">
        {/* Low Stock Table */}
        {showLowStock && (
          <div className="animate-slide-down bg-white p-6 rounded-lg shadow-lg">
            <LowStockTable />
          </div>
        )}

        {/* Pending Transactions Table */}
        {showPendingTransactions && (
          <div className="animate-slide-down bg-white p-6 rounded-lg shadow-lg">
            <PendingTransactionsTable />
          </div>
        )}

        {/* Pending Transactions Table */}
        {showDeals && (
          <div className="animate-slide-down bg-white p-6 rounded-lg shadow-lg">
            <Dealspage />
          </div>
        )}
      </div>

      <style jsx>{`
        @keyframes slideDown {
          0% {
            opacity: 0;
            transform: translateY(-20px);
          }
          100% {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-slide-down {
          animation: slideDown 0.5s ease-out forwards;
        }
      `}</style>
    </div>
  );
}
