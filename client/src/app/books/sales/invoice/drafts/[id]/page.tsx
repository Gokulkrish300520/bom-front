"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { fetchWithAuth } from "@/auth/tokenservice";
import Breadcrumb from "@/app/breadcrumb";

type DraftItemDetail = {
  id: number;
  item: number; // ID of the item
  quantity: number;
  rate: string;
  amount: string;
  invoice_item_number: number;
};

type DraftInvoice = {
  id: number;
  status: string;
  customer?: number | null;
  customer_name?: string | null;
  deal?: number | null;
  deal_no?: string | null;
  invoice_number: string;
  place_of_supply?: string;
  invoice_date: string;
  due_date?: string | null;
  subtotal_amount: string;
  gst_amount: string;
  adjustment_amount: string;
  total_amount: string;
  customer_notes?: string;
  terms_and_conditions?: string;
  item_details: DraftItemDetail[];
  created_at: string;
  updated_at: string;
};

export default function DraftViewPage() {
  const { id } = useParams();
  const router = useRouter();
  const [draft, setDraft] = useState<DraftInvoice | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function fetchDraft() {
      try {
        const res = await fetchWithAuth(
          `https://web-production-6baf3.up.railway.app/api/draft-invoices/${id}/`
        );
        if (!res.ok) throw new Error("Failed to fetch draft data");
        const data: DraftInvoice = await res.json();
        setDraft(data);
      } catch (err) {
        setError("Failed to load draft invoice");
        console.error(err);
      } finally {
        setLoading(false);
      }
    }

    fetchDraft();
  }, [id]);

  if (loading) return <p className="p-6">Loading draft invoice...</p>;
  if (error || !draft)
    return <p className="p-6 text-red-600">{error || "Draft not found"}</p>;

  return (
    <div className="w-full max-w-5xl mx-auto bg-white rounded-xl shadow p-8 mt-8">
      <div className="flex items-center justify-between mb-6">
        <Breadcrumb />
        <h2 className="text-2xl font-semibold text-green-800">
          Draft Invoice: {draft.invoice_number}
        </h2>
        <button
          className="text-green-700 border border-green-200 rounded px-4 py-1 hover:bg-green-50"
          onClick={() => router.back()}
        >
          Back
        </button>
      </div>

      {/* Basic Info */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
        <div>
          <span className="text-gray-700 font-medium">Customer Name:</span>{" "}
          <span className="text-gray-900">{draft.customer_name || "N/A"}</span>
        </div>
        <div>
          <span className="text-gray-700 font-medium">Deal No:</span>{" "}
          <span className="text-gray-900">{draft.deal_no || "N/A"}</span>
        </div>
        <div>
          <span className="text-gray-700 font-medium">Place of Supply:</span>{" "}
          <span className="text-gray-900">{draft.place_of_supply || "N/A"}</span>
        </div>
        <div>
          <span className="text-gray-700 font-medium">Invoice Date:</span>{" "}
          <span className="text-gray-900">{draft.invoice_date}</span>
        </div>
        <div>
          <span className="text-gray-700 font-medium">Due Date:</span>{" "}
          <span className="text-gray-900">{draft.due_date || "N/A"}</span>
        </div>
      </div>

      {/* Amounts */}
      <div className="mt-6">
        <h3 className="font-semibold text-green-700 mb-2">Amount Details</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
          <div>
            <span className="text-gray-700">Subtotal:</span>{" "}
            <span className="text-gray-900">₹{parseFloat(draft.subtotal_amount).toFixed(2)}</span>
          </div>
          <div>
            <span className="text-gray-700">GST:</span>{" "}
            <span className="text-gray-900">₹{parseFloat(draft.gst_amount).toFixed(2)}</span>
          </div>
          <div>
            <span className="text-gray-700">Adjustment:</span>{" "}
            <span className="text-gray-900">₹{parseFloat(draft.adjustment_amount).toFixed(2)}</span>
          </div>
          <div>
            <span className="text-gray-700">Total:</span>{" "}
            <span className="text-gray-900 font-bold">₹{parseFloat(draft.total_amount).toFixed(2)}</span>
          </div>
        </div>
      </div>

      {/* Notes & Terms */}
      {draft.customer_notes && (
        <div className="mt-6">
          <h3 className="font-semibold text-green-700 mb-2">Customer Notes</h3>
          <p>{draft.customer_notes}</p>
        </div>
      )}
      {draft.terms_and_conditions && (
        <div className="mt-6">
          <h3 className="font-semibold text-green-700 mb-2">Terms & Conditions</h3>
          <p>{draft.terms_and_conditions}</p>
        </div>
      )}

      {/* Item Details */}
      <div className="mt-6">
        <h3 className="font-semibold text-green-700 mb-2">Item Details</h3>
        {draft.item_details.length > 0 ? (
          <table className="w-full table-fixed text-sm mb-3 border border-gray-200">
            <thead>
              <tr className="bg-green-50 text-green-800">
                <th className="py-1 border">Item ID</th>
                <th className="py-1 border">Quantity</th>
                <th className="py-1 border">Rate</th>
                <th className="py-1 border">Amount</th>
                <th className="py-1 border">Item No</th>
              </tr>
            </thead>
            <tbody>
              {draft.item_details.map((item) => (
                <tr key={item.id} className="border-b text-center">
                  <td className="py-1">{item.item}</td>
                  <td className="py-1">{item.quantity}</td>
                  <td className="py-1">₹{parseFloat(item.rate).toFixed(2)}</td>
                  <td className="py-1">₹{parseFloat(item.amount).toFixed(2)}</td>
                  <td className="py-1">{item.invoice_item_number}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p className="text-gray-500">No items found.</p>
        )}
      </div>
    </div>
  );
}
