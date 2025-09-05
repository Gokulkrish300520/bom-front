"use client";

import { Plus, ChevronDown, MoreVertical, ChevronLeft, ChevronRight } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { fetchWithAuth } from "@/auth/tokenservice";

type CustomerType = {
  id: number;
  name: string;
  email: string;
  company_name: string;
  address: string;
  phone: string;
  created_at: string;
};

type ProformaStatus = "draft" | "sent" | "accepted" | "rejected";

type Invoice = {
  id: string;
  customer: CustomerType;
  invoice_number: string;
  date: string; // ISO date
  due_date: string;
  amount: string | number;
  status: ProformaStatus;
  notes: string;
  created_at: string;
};

export default function InvoiceListPage() {
  const [statusFilter, setStatusFilter] = useState("Invoices");
  const [filterOpen, setFilterOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [page, setPage] = useState(1);
  const [nextPageUrl, setNextPageUrl] = useState<string | null>(null);
  const [prevPageUrl, setPrevPageUrl] = useState<string | null>(null);

  const getStatusStyle = (status: string) => {
    switch (status.toLowerCase()) {
      case "draft":
        return "bg-gray-100 text-gray-700 border border-gray-300";
      case "sent":
        return "bg-yellow-100 text-yellow-800 border border-yellow-300";
      case "paid":
        return "bg-green-100 text-green-700 border border-green-300";
      case "overdue":
        return "bg-red-100 text-red-700 border border-red-300";
      default:
        return "bg-gray-100 text-gray-700";
    }
  };

  const baseApiUrl = "https://bpm-production.up.railway.app/api/invoices/";

  async function loadInvoices(url?: string, pageNumber = 1) {
    setLoading(true);
    setError("");
    try {
      let apiUrl = url || `${baseApiUrl}?page=${pageNumber}`;
      if (statusFilter !== "Invoices" && !url) {
        apiUrl += `&status=${statusFilter.toLowerCase()}`;
      }
      const res = await fetchWithAuth(apiUrl);
      if (!res.ok) throw new Error("Failed to fetch invoices");
      const data = await res.json();
      setInvoices(data.results);
      setNextPageUrl(data.next);
      setPrevPageUrl(data.previous);
    } catch (err) {
      setError("Failed to load invoices");
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadInvoices(undefined, page);
  }, [statusFilter, page]);

  const filteredInvoices =
    statusFilter === "Invoices"
      ? invoices
      : invoices.filter(
          (inv) => inv.status.toLowerCase() === statusFilter.toLowerCase()
        );

   return (
    <div className="min-h-screen p-6 bg-[#f3fdf5]">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-green-900">All Invoices</h1>
        <Link
          href="/books/sales/invoice/new"
          className="flex items-center gap-2 px-5 py-2 font-medium text-white bg-green-600 rounded-lg shadow-sm hover:bg-green-700"
        >
          <Plus size={16} /> New
        </Link>
      </div>

      {/* Table */}
      <div className="overflow-hidden bg-white border border-green-100 shadow-sm rounded-xl">
        <table className="w-full text-sm">
          <thead className="bg-green-200 text-green-900">
            <tr>
              <th className="px-4 py-3 font-semibold text-left">Date</th>
              <th className="px-4 py-3 font-semibold text-left">Invoice Number</th>
              <th className="px-4 py-3 font-semibold text-left">Customer</th>
              <th className="px-4 py-3 font-semibold text-left">Due Date</th>
              <th className="px-4 py-3 font-semibold text-right">Amount</th>
              <th className="px-4 py-3 font-semibold text-left">Status</th>
            </tr>
          </thead>
          <tbody>
            {filteredInvoices.map((inv) => (
              <tr key={inv.id} className="transition border-b hover:bg-green-50">
                <td className="px-4 py-3">{inv.invoice_number}</td>
                <td className="px-4 py-3 font-medium text-green-700">{inv.customer.name}</td>
                <td className="px-4 py-3">{inv.date}</td>
                <td className="px-4 py-3">{inv.due_date}</td>
                <td className="px-4 py-3 font-medium text-right">₹{inv.amount.toLocaleString()}</td>
                <td className="px-4 py-3">
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusStyle(
                      inv.status
                    )}`}
                  >
                    {inv.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between mt-6 text-sm text-gray-600">
        <span>
          Showing {filteredInvoices.length} of {invoices.length}
        </span>
        <div className="flex gap-1">
          <button
            disabled={page === 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            className={`flex items-center gap-1 border px-3 py-1.5 rounded-lg hover:bg-green-50 transition ${
              page === 1 ? "opacity-50 cursor-not-allowed" : ""
            }`}
          >
            <ChevronLeft size={14} /> Prev
          </button>
          <button className="border px-3 py-1.5 rounded-lg bg-green-600 text-white shadow-sm">
            {page}
          </button>
          <button
            onClick={() => setPage((p) => p + 1)}
            className="flex items-center gap-1 border px-3 py-1.5 rounded-lg hover:bg-green-50 transition"
          >
            Next <ChevronRight size={14} />
          </button>
        </div>
      </div>
    </div>
  );
}