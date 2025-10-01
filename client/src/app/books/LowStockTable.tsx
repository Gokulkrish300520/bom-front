"use client";

import { useState, useEffect } from "react";
import { fetchWithAuth } from "@/auth/tokenservice";

interface Item {
  id: number;
  name: string;
  unit: string;
  opening_stock: string;
  current_stock: string;
  reorder_point: string;
  calculatedStock?: number;
}

export default function LowStockTable() {
  // You can add filters here if needed, e.g., item name filter
  const [items, setItems] = useState<Item[]>([]);

  useEffect(() => {
    fetchWithAuth("https://web-production-6baf3.up.railway.app/api/items/low_stock")
      .then((res) => res.json())
      .then((data) => {
        const processedItems = data.map((item: Item) => ({
          ...item,
          calculatedStock:
            parseFloat(item.opening_stock) + parseFloat(item.current_stock),
        }));
        setItems(processedItems);
      })
      .catch(console.error);
  }, []);

  return (
    <div className="p-8 bg-white rounded-lg shadow-lg max-w-5xl mx-auto">
      <h2 className="text-3xl font-extrabold mb-6 text-brand-primary border-b-4 border-brand-accent pb-2 text-center">
        Low Stock Items
      </h2>

  <div className="overflow-x-auto">
    <table className="w-full table-fixed border-collapse border border-gray-300 rounded">
      <thead className="bg-green-600 text-gray-700 uppercase font-semibold text-sm select-none">
        <tr>
          <th className="border border-gray-300 px-4 py-3 text-left w-1/3">Item Name</th>
          <th className="border border-gray-300 px-4 py-3 text-left w-1/6">Unit</th>
          <th className="border border-gray-300 px-4 py-3 text-left w-1/6">Current Stock</th>
          <th className="border border-gray-300 px-4 py-3 text-left w-1/6">Reorder Point</th>
        </tr>
      </thead>
    </table>

    <div className="max-h-[400px] overflow-y-auto overflow-x-hidden border border-gray-300 rounded-b">
      <table className="w-full table-fixed border-collapse border border-gray-300 rounded-b">
        <tbody className="text-gray-800">
          {items.length > 0 ? (
            items.map((item) => {
              const isLowStock = (item.calculatedStock ?? 0) < parseFloat(item.reorder_point);
              return (
                <tr
                  key={item.id}
                  className={`border-b border-gray-200 ${isLowStock ? "bg-red-200" : "hover:bg-red-300 cursor-pointer"} transition`}
                >
                  <td className="border border-gray-300 px-4 py-3 w-1/3 flex items-center space-x-3">
                    {isLowStock && (
                      <span className="inline-block w-3 h-3 bg-red-500 rounded-full animate-pulse" />
                    )}
                    <span>{item.name}</span>
                  </td>
                  <td className="border border-gray-300 px-4 py-3 w-1/6">{item.unit}</td>
                  <td className={`border border-gray-300 px-4 py-3 w-1/6 font-semibold ${isLowStock ? "text-red-600" : ""}`}>
                    {item.calculatedStock?.toFixed(2) ?? "0"}
                  </td>
                  <td className="border border-gray-300 px-4 py-3 w-1/6">{item.reorder_point}</td>
                </tr>
              );
            })
          ) : (
            <tr>
              <td colSpan={4} className="text-center py-6 text-gray-500">
                All items are sufficiently stocked.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  </div>
</div>

  );
}
