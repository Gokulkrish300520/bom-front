"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { fetchWithAuth } from "@/auth/tokenservice";
import { Trash2 } from "lucide-react";

export default function ItemsPage() {
  const router = useRouter();
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function fetchItems() {
    setLoading(true);
    setError("");
    try {
      const res = await fetchWithAuth("https://web-production-6baf3.up.railway.app/api/items/");

      if (!res.ok) {
        throw new Error("Failed to fetch items");
      }
      const data = await res.json();
      setItems(data.results || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(id: number) {
    if (!confirm("Are you sure you want to delete this item?")) return;

    try {
      const res = await fetchWithAuth(
        `https://web-production-6baf3.up.railway.app/api/items/${id}/`,
        { method: "DELETE" }
      );

      if (!res.ok) {
        throw new Error("Failed to delete item");
      }

      setItems((prev) => prev.filter((item) => item.id !== id));
      router.push('/books/items/item'); // Navigate back to items list
    } catch (err) {
      alert(err instanceof Error ? err.message : "Unknown error");
    }
  }

  useEffect(() => {
    fetchItems();
  }, []);

  return (
    <div className="min-h-screen p-6 bg-green-50">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-green-900">All Items</h1>
        <button
          className="px-4 py-2 font-medium text-white bg-green-600 rounded-lg shadow hover:bg-green-700"
          onClick={() => router.push("/books/items/item/new")}
        >
          + New
        </button>
      </div>

      {loading ? (
        <div className="text-center p-6 text-green-700 font-semibold">
          Loading items...
        </div>
      ) : error ? (
        <div className="mb-4 p-4 bg-red-100 text-red-700 rounded">{error}</div>
      ) : items.length === 0 ? (
        <div className="text-center py-10 text-green-700">No items found.</div>
      ) : (
        <div className="overflow-x-auto rounded-lg shadow">
          <table className="min-w-full border border-green-200 bg-white text-left text-sm text-green-900">
            <thead className="bg-green-200">
              <tr className="font-semibold text-green-900 bg-green-200">
                <th className="border border-green-300 px-4 py-2">Name</th>
                <th className="border border-green-300 px-4 py-2">HSN/SAC</th>
                <th className="border border-green-300 px-4 py-2">Purchase Rate</th>
                <th className="border border-green-300 px-4 py-2">Rate</th>
                <th className="border border-green-300 px-4 py-2">Opening Stock</th>
                <th className="border border-green-300 px-4 py-2">Stock on Hand</th>
                <th className="border border-green-300 px-4 py-2">Action</th>
              </tr>
            </thead>
            <tbody>
              {items.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-6 text-center text-green-600">
                    No data to display
                  </td>
                </tr>
              ) : (
                items.map((item, idx) => (
                  <tr
                    key={item.id}
                    className={`cursor-pointer ${idx % 2 === 0 ? "bg-green-50" : "bg-green-100"} hover:bg-green-200`}
                    onClick={() => router.push(`/books/items/item/${item.id}`)}
                  >
                    <td className="border border-green-300 px-4 py-2 font-medium text-green-700">{item.name}</td>
                    <td className="border border-green-300 px-4 py-2">{item.hsn_code || "-"}</td>
                    <td className="border border-green-300 px-4 py-2">{item.purchase_cost_price != null ? `₹${Number(item.purchase_cost_price).toFixed(2)}` : "-"}</td>
                    <td className="border border-green-300 px-4 py-2">{item.sales_selling_price != null ? `₹${Number(item.sales_selling_price).toFixed(2)}` : "-"}</td>
                    <td className="border border-green-300 px-4 py-2">{item.opening_stock ?? "-"}</td>
                    <td className="border border-green-300 px-4 py-2">
                  {item.opening_stock != null && item.current_stock != null
                    ? (parseFloat(item.opening_stock) + parseFloat(item.current_stock)).toFixed(2)
                    : "-"}
                </td>


                    <td className="border border-green-300 px-4 py-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDelete(item.id);
                        }}
                        className="p-2 text-red-600 rounded hover:bg-red-100"
                        title="Delete item"
                      >
                        <Trash2 size={18} />
                      </button>
                    </td>
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
