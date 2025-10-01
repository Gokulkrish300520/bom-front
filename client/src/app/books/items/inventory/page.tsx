"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { fetchWithAuth } from "@/auth/tokenservice";

export default function InventoryAdjustmentsPage() {
  const [adjustments, setAdjustments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchAdjustments() {
      try {
        const res = await fetchWithAuth("https://web-production-6baf3.up.railway.app/api/inventory-management/", {
          method: "GET",
        });

        if (!res.ok) {
          throw new Error(`HTTP error! status: ${res.status}`);
        }

        const data = await res.json();

        const mappedAdjustments = data.results.map((adj: any) => ({
          id: adj.id,
          date: new Date(adj.created_at).toLocaleDateString(),
          adjusted_item_name: adj.adjusted_item_name || "",
          created_by: adj.created_by || "",
          created_time: new Date(adj.created_at).toLocaleTimeString(),
        }));

        setAdjustments(mappedAdjustments);
        setLoading(false);
      } catch (err: any) {
        setError(err.message || "Failed to load inventory adjustments");
        setLoading(false);
      }
    }

    fetchAdjustments();
  }, []);

  return (
    <div className="min-h-screen p-6 bg-green-50">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-green-900">Inventory Adjustments</h1>
        <Link
          href="/books/items/inventory/new"
          className="px-4 py-2 font-medium text-white bg-green-600 rounded-lg shadow hover:bg-green-700"
        >
          + New
        </Link>
      </div>

      {error && (
        <div className="mb-4 p-4 bg-red-100 text-red-700 rounded">{error}</div>
      )}

      {loading ? (
        <div className="text-center p-6 text-green-700 font-semibold">
          Loading inventory adjustments...
        </div>
      ) : (
        <div className="overflow-x-auto rounded-lg shadow">
          <table className="min-w-full border border-green-200 bg-white text-left text-sm text-green-900">
            <thead className="bg-green-200">
              <tr>
                <th className="border border-green-300 px-4 py-2">Date</th>
                <th className="border border-green-300 px-4 py-2">Adjusted Item Name</th>
                <th className="border border-green-300 px-4 py-2">Created By</th>
                <th className="border border-green-300 px-4 py-2">Created Time</th>
              </tr>
            </thead>
            <tbody>
              {adjustments.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-4 py-6 text-center text-green-600">
                    No data to display
                  </td>
                </tr>
              ) : (
                adjustments.map((adj, idx) => (
                  <tr
                    key={adj.id}
                    className={`hover:bg-green-100 ${
                      idx % 2 === 0 ? "bg-green-50" : "bg-green-100"
                    }`}
                  >
                    <td className="border border-green-300 px-4 py-2 align-middle">{adj.date}</td>
                    <td className="border border-green-300 px-4 py-2 align-middle">
                      <Link href={`/books/items/inventory/${adj.id}`} className="text-green-700 hover:underline">
                      {adj.adjusted_item_name}
                    </Link></td>
                    <td className="border border-green-300 px-4 py-2 align-middle">{adj.created_by}</td>
                    <td className="border border-green-300 px-4 py-2 align-middle">{adj.created_time}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
