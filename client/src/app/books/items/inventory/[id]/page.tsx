"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { fetchWithAuth } from "@/auth/tokenservice";

export default function InventoryAdjustmentDetail() {
  const { id } = useParams();
  const router = useRouter();
  const [adjustment, setAdjustment] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchAdjustment() {
      try {
        const res = await fetchWithAuth(`https://web-production-6baf3.up.railway.app/api/inventory-management/${id}/`);

        if (!res.ok) throw new Error(`Failed to fetch adjustment ${id}`);

        const data = await res.json();
        setAdjustment(data);
        setLoading(false);
      } catch (err: any) {
        setError(err.message || "Error loading adjustment");
        setLoading(false);
      }
    }
    if (id) fetchAdjustment();
  }, [id]);

  if (loading) return <div className="p-6 text-green-700 font-semibold">Loading adjustment details...</div>;

  if (error) return <div className="p-6 text-red-600 font-semibold">Error: {error}</div>;

  if (!adjustment) return <div className="p-6">No adjustment found.</div>;

  return (
  <div className="min-h-screen p-8 bg-green-50 flex justify-center items-start">
    <div className="max-w-3xl w-full bg-white p-8 rounded-lg shadow-lg">
      <h1 className="text-3xl font-bold text-green-900 mb-6">Inventory Adjustment Details</h1>

      <div className="space-y-4 text-green-900">
        <div className="flex justify-between border-b border-green-200 pb-2">
          <span className="font-semibold">Adjusted Item:</span>
          <span>{adjustment.adjusted_item_name || adjustment.adjusted_item}</span>
        </div>
        <div className="flex justify-between border-b border-green-200 pb-2">
          <span className="font-semibold">Added Quantity:</span>
          <span>{adjustment.added_restocked_quantity}</span>
        </div>
        <div className="flex justify-between border-b border-green-200 pb-2">
          <span className="font-semibold">Old Selling Price:</span>
          <span>₹{adjustment.old_selling_price}</span>
        </div>
        <div className="flex justify-between border-b border-green-200 pb-2">
          <span className="font-semibold">Updated Selling Price:</span>
          <span>₹{adjustment.updated_selling_price}</span>
        </div>
        <div className="flex justify-between border-b border-green-200 pb-2">
          <span className="font-semibold">Old Purchase Price:</span>
          <span>₹{adjustment.old_purchase_price}</span>
        </div>
        <div className="flex justify-between border-b border-green-200 pb-2">
          <span className="font-semibold">Updated Purchase Price:</span>
          <span>₹{adjustment.updated_purchase_price}</span>
        </div>
        <div className="flex justify-between border-b border-green-200 pb-2">
          <span className="font-semibold">Created By:</span>
          <span>{adjustment.created_by}</span>
        </div>
        <div className="flex justify-between">
          <span className="font-semibold">Created At:</span>
          <span>{new Date(adjustment.created_at).toLocaleString()}</span>
        </div>
      </div>

      <button
        className="mt-8 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
        onClick={() => router.back()}
      >
        Back
      </button>
    </div>
  </div>
);

}
