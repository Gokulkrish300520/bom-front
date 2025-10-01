"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { fetchWithAuth } from "@/auth/tokenservice";

export default function EditItemPage() {
  const { id } = useParams();
  const router = useRouter();
  const [item, setItem] = useState<any>(null);
  const [vendors, setVendors] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const units = ["Nos", "Kgs", "Litres"];

  useEffect(() => {
    async function fetchItem() {
      try {
        const res = await fetchWithAuth(
          `https://web-production-6baf3.up.railway.app/api/items/${id}/`
        );
        if (!res.ok) throw new Error("Failed to fetch item data");
        const data = await res.json();
        setItem(data);
        const vRes = await fetchWithAuth(
          `https://web-production-6baf3.up.railway.app/api/vendors/`
        );
        if (!vRes.ok) throw new Error("Failed to fetch vendors");
        const vData = await vRes.json();
        setVendors(vData.results || []);
      } catch (err) {
        setError("Failed to load item");
      } finally {
        setLoading(false);
      }
    }
    fetchItem();
  }, [id]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetchWithAuth(
        `https://web-production-6baf3.up.railway.app/api/items/${id}/`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(item),
        }
      );
      if (!res.ok) throw new Error("Failed to update item");
      router.push(`/books/items/item/${id}`); // back to detail page
    } catch (err) {
      alert("Error updating item");
    } finally {
      setSaving(false);
    }
  }

  if (loading)
    return (
      <div className="text-center p-6 text-green-700 font-semibold">
        Loading items for editing...
      </div>
    );
  if (error)
    return (
      <div className="p-6 text-red-600 font-semibold">Error: {error}</div>
    );

  return (
    <div className="min-h-screen flex items-start justify-center bg-green-50 py-10">
      <div className="w-full max-w-2xxl bg-white p-8 rounded-xl shadow-md">
        <h2 className="text-2xl font-bold mb-6 text-green-800">Edit Item</h2>
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Name */}
          <div>
            <label className="block text-green-800 font-medium mb-1">
              Name
            </label>
            <input
              type="text"
              value={item.name || ""}
              onChange={(e) => setItem({ ...item, name: e.target.value })}
              className="w-full border border-green-300 px-3 py-2 rounded-lg focus:ring-2 focus:ring-green-200 focus:outline-none"
            />
          </div>
          {/* Unit */}
          <div>
            <label className="block text-green-800 font-medium mb-1">
              Unit
            </label>
            <select
              value={item.unit || ""}
              onChange={(e) => setItem({ ...item, unit: e.target.value })}
              className="w-full border border-green-300 px-3 py-2 rounded-lg focus:ring-2 focus:ring-green-200 focus:outline-none"
            >
              <option value="">-- Select Unit --</option>
              {units.map((u) => (
                <option key={u} value={u}>
                  {u}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-green-800 font-medium mb-1">
            HSN No
            </label>
            <input
              type="text"
              value={item.hsn_code || ""}
              onChange={(e) => setItem({ ...item, hsn_code: e.target.value })}
              className="w-full border border-green-300 px-3 py-2 rounded-lg focus:ring-2 focus:ring-green-200 focus:outline-none"
            />
          </div>
          {/* Sales Description */}
          <div>
            <label className="block text-green-800 font-medium mb-1">
              Sales Description
            </label>
            <textarea
              value={item.sales_description || ""}
              onChange={(e) =>
                setItem({ ...item, sales_description: e.target.value })
              }
              className="w-full border border-green-300 px-3 py-2 rounded-lg focus:ring-2 focus:ring-green-200 focus:outline-none"
              rows={3}
            />
          </div>
          {/* Manage Purchase Info */}
          <div>
            <label className="inline-flex items-center text-green-700">
              <input
                type="checkbox"
                checked={item.manage_purchase_info || false}
                onChange={(e) =>
                  setItem({
                    ...item,
                    manage_purchase_info: e.target.checked,
                  })
                }
                className="mr-2 accent-green-600"
              />
              Manage Purchase Info
            </label>
          </div>
          {/* Purchase Description */}
          <div>
            <label className="block text-green-800 font-medium mb-1">
              Purchase Description
            </label>
            <textarea
              value={item.purchase_description || ""}
              onChange={(e) =>
                setItem({ ...item, purchase_description: e.target.value })
              }
              className="w-full border border-green-300 px-3 py-2 rounded-lg focus:ring-2 focus:ring-green-200 focus:outline-none"
              rows={3}
            />
          </div>
          {/* Preferred Vendor */}
          <div>
            <label className="block text-green-800 font-medium mb-1">
              Preferred Vendor
            </label>
            <select
              value={item.preferred_vendor || ""}
              onChange={(e) =>
                setItem({ ...item, preferred_vendor: Number(e.target.value) })
              }
              className="w-full border border-green-300 px-3 py-2 rounded-lg focus:ring-2 focus:ring-green-200 focus:outline-none"
            >
              <option value="">-- Select Vendor --</option>
              {vendors.map((vendor) => (
                <option key={vendor.id} value={vendor.id}>
                  {vendor.display_name}
                </option>
              ))}
            </select>
          </div>
          {/* Track Inventory */}
          <div>
            <label className="inline-flex items-center text-green-700">
              <input
                type="checkbox"
                checked={item.track_inventory || false}
                onChange={(e) =>
                  setItem({ ...item, track_inventory: e.target.checked })
                }
                className="mr-2 accent-green-600"
              />
              Track Inventory
            </label>
          </div>
          {/* Opening Stock Rate per Unit */}
          <div>
            <label className="block text-green-800 font-medium mb-1">
              Opening Stock Rate/Unit
            </label>
            <input
              type="number"
              step="0.01"
              value={item.opening_stock_rate_per_unit || ""}
              onChange={(e) =>
                setItem({
                  ...item,
                  opening_stock_rate_per_unit: e.target.value,
                })
              }
              className="w-full border border-green-300 px-3 py-2 rounded-lg focus:ring-2 focus:ring-green-200 focus:outline-none"
            />
          </div>
          {/* Reorder Point */}
          <div>
            <label className="block text-green-800 font-medium mb-1">
              Reorder Point
            </label>
            <input
              type="number"
              step="0.01"
              value={item.reorder_point || ""}
              onChange={(e) =>
                setItem({ ...item, reorder_point: e.target.value })
              }
              className="w-full border border-green-300 px-3 py-2 rounded-lg focus:ring-2 focus:ring-green-200 focus:outline-none"
            />
          </div>
          {/* Buttons */}
          <div className="flex gap-4 pt-4">
            <button
              type="submit"
              disabled={saving}
              className="bg-green-600 text-white px-6 py-2 rounded-lg font-semibold hover:bg-green-700 transition"
            >
              {saving ? "Saving..." : "Save"}
            </button>
            <button
              type="button"
              onClick={() => router.push(`/books/items/item/${id}`)}
              className="border border-green-400 px-6 py-2 rounded-lg font-semibold text-green-700 bg-green-50 hover:bg-green-200 transition"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
