"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

export default function ItemsPage() {
  const router = useRouter();
  const [items, setItems] = useState<any[]>([]);

  // Load items from localStorage
  useEffect(() => {
    const storedItems = JSON.parse(localStorage.getItem("items") || "[]");
    setItems(storedItems);
  }, []);

  return (
    <div className="min-h-screen p-6 bg-green-50">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-green-900">All Items</h1>
        <button
          className="px-4 py-2 font-medium text-white bg-green-600 rounded-lg shadow hover:bg-green-700"
          onClick={() => router.push("/books/items/item/new")} // Navigate to new item page
        >
          + New
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full overflow-hidden text-left border-collapse rounded-lg shadow">
          <thead>
            <tr className="font-semibold text-green-900 bg-green-200">
              <th className="px-4 py-3">Name</th>
              <th className="px-4 py-3">Purchase Description</th>
              <th className="px-4 py-3">Purchase Rate</th>
              <th className="px-4 py-3">Rate</th>
              <th className="px-4 py-3">Stock on Hand</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item, idx) => (
              <tr
                key={idx}
                className={`${
                  idx % 2 === 0 ? "bg-green-50" : "bg-green-100"
                } hover:bg-green-200`}
              >
                <td className="px-4 py-3 font-medium">{item.name}</td>
                <td className="px-4 py-3">{item.purchaseDesc}</td>
                <td className="px-4 py-3">₹{Number(item.purchaseRate).toFixed(2)}</td>
                <td className="px-4 py-3">₹{Number(item.rate).toFixed(2)}</td>
                <td className="px-4 py-3">{item.stock}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}