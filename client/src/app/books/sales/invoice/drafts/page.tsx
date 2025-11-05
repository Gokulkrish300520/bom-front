"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { fetchWithAuth } from "@/auth/tokenservice";
import toast from "react-hot-toast";
import Breadcrumb from "@/app/breadcrumb";

type DraftInvoice = {
  id: number;
  invoice_number: string;
  customer_name: string;
  deal_no: string;
  invoice_date: string;
  total_amount: string;
  status: string;
};

export default function DraftListPage() {
  const [drafts, setDrafts] = useState<DraftInvoice[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadDrafts() {
      try {
        const res = await fetchWithAuth("https://web-production-6baf3.up.railway.app/api/draft-invoices/");
        const data = await res.json();
        setDrafts(data.results || []);
      } catch (err) {
        toast.error("Failed to load drafts");
      } finally {
        setLoading(false);
      }
    }
    loadDrafts();
  }, []);

  if (loading) return <div className="p-6 text-gray-600">Loading drafts...</div>;

  return (
    <div className="p-6 bg-green-50 min-h-screen">
      <Breadcrumb />
      <h1 className="text-3xl mb-6 font-semibold text-green-800">Draft Invoices</h1>

      {drafts.length === 0 ? (
        <p className="text-gray-600">No draft invoices found.</p>
      ) : (
        <div className="bg-white shadow rounded-lg overflow-hidden">
          <table className="w-full border-collapse">
            <thead className="bg-green-100 text-green-800">
              <tr>
                <th className="p-3 text-left">Invoice #</th>
                <th className="p-3 text-left">Customer Name</th>
                <th className="p-3 text-left">Deal No</th>
                <th className="p-3 text-left">Date</th>
                <th className="p-3 text-right">Total</th>
                <th className="p-3 text-center">Status</th>
                <th className="p-3 text-center">Actions</th>
              </tr>
            </thead>
            <tbody>
  {drafts.map((draft) => (
    <tr key={draft.id} className="hover:bg-green-50">
      <td className="p-3 text-blue-700 font-semibold">{draft.invoice_number}</td>
      <td className="p-3">{draft.customer_name}</td>
      <td className="p-3">{draft.deal_no}</td>
      <td className="p-3">{draft.invoice_date}</td>
      <td className="p-3 text-right">₹{draft.total_amount}</td>
      <td className="p-3 text-center">{draft.status}</td>
      <td className="p-3 text-center flex justify-center gap-2">
        <Link
          href={`/books/sales/invoice/drafts/${draft.id}/`}
          className="text-green-700 hover:underline"
        >
          View
        </Link>
        <Link
          href={`/books/sales/invoice/drafts/${draft.id}/edit`}
          className="text-blue-700 hover:underline"
        >
          Edit
        </Link>
        <button
          onClick={async () => {
            if (!confirm("Are you sure you want to delete this draft?")) return;
            try {
              await fetchWithAuth(
                `https://web-production-6baf3.up.railway.app/api/draft-invoices/${draft.id}/`,
                { method: "DELETE" }
              );
              toast.success("Draft deleted");
              setDrafts((prev) => prev.filter((d) => d.id !== draft.id));
            } catch {
              toast.error("Failed to delete draft");
            }
          }}
          className="text-red-600 hover:underline"
        >
          Delete
        </button>
      </td>
    </tr>
  ))}
</tbody>
          </table>
        </div>
      )}
    </div>
  );
}
