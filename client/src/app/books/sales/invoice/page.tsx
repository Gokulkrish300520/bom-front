"use client";

import { Plus, ChevronLeft, ChevronRight } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { fetchWithAuth } from "@/auth/tokenservice";

type CustomerType = {
  id: number;
  display_name: string;
  customer_type?: "business" | "individual";
  salutation?: "dr" | "mr" | "ms" | "mrs" | null;
  first_name?: string;
  last_name?: string;
  company_name?: string;
  email?: string;
  work_phone?: string;
  mobile?: string;
  pan?: string;
  currency?: "AED" | "AUD" | "BND" | "CAD" | "CNY" | "EUR" | "GBP" | "INR" | "JPY" | "SAR" | "USD" | "ZAR";
  opening_balance?: string | number;
  payment_terms?: "due_on_receipt" | "net_7" | "net_15" | "net_30" | "net_45";
  billing_attention?: string;
  billing_country?: string;
  billing_street1?: string;
  billing_street2?: string;
  billing_city?: string;
  billing_state?: string;
  billing_pin_code?: string;
  billing_phone?: string;
  billing_fax?: string;
  shipping_attention?: string;
  shipping_country?: string;
  shipping_street1?: string;
  shipping_street2?: string;
  shipping_city?: string;
  shipping_state?: string;
  shipping_pin_code?: string;
  shipping_phone?: string;
  shipping_fax?: string;
  custom_fields?: Record<string, any>;
  tags?: string[];
  remarks?: string;
  created_at?: string;
};


type InvoiceStatus = "draft" | "sent" | "paid" | "overdue" | "cancelled" | "partial";

type Invoice = {
  id: string;
  customer: CustomerType;
  invoice_number: string;
  invoice_date: string; // ISO date - renamed to match backend
  due_date: string;
  total_amount: number | string; // renamed and typed to match backend
  status: InvoiceStatus;
  notes: string;
  created_at: string;
};

export default function InvoiceListPage() {
  const [statusFilter, setStatusFilter] = useState("Invoices");
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [page, setPage] = useState(1);
  const [nextPageUrl, setNextPageUrl] = useState<string | null>(null);
  const [prevPageUrl, setPrevPageUrl] = useState<string | null>(null);
  

  const getStatusStyle = (status?: string) => {
  if (!status) return "bg-gray-100 text-gray-700 border border-gray-300";
  switch (status.toLowerCase()) {
    case "draft":
      return "bg-gray-100 text-gray-700 border border-gray-300";
    case "sent":
      return "bg-yellow-100 text-yellow-800 border border-yellow-300";
    case "paid":
      return "bg-green-100 text-green-700 border border-green-300";
    case "overdue":
      return "bg-red-100 text-red-700 border border-red-300";
    case "partial":
      return "bg-blue-100 text-blue-700 border border-blue-300";
    case "cancelled":
      return "bg-red-200 text-red-900 border border-red-400";
    default:
      return "bg-gray-100 text-gray-700";
  }
};


  const baseApiUrl = "https://bom-front-production.up.railway.app/api/invoices/";

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
      setInvoices(data.results || []);
      setNextPageUrl(data.next);
      setPrevPageUrl(data.previous);
      if (!url) {
        setPage(pageNumber);
      }
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

  const formatDate = (dateStr: string) => {
    try {
      return new Date(dateStr).toLocaleDateString();
    } catch {
      return dateStr;
    }
  };

  const handlePrevPage = () => {
    if (prevPageUrl) {
      loadInvoices(prevPageUrl);
      setPage((p) => Math.max(1, p - 1));
    }
  };

  const handleNextPage = () => {
    if (nextPageUrl) {
      loadInvoices(nextPageUrl);
      setPage((p) => p + 1);
    }
  };

  if (loading) return <p>Loading invoices...</p>;
  if (error) return <p className="text-red-600">{error}</p>;

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
            {invoices.length === 0 ? (
              <tr>
                <td colSpan={6} className="p-4 text-center text-gray-500 bg-white">
                  No invoices found
                </td>
              </tr>
            ) : (
              invoices.map((inv) => (
                <tr key={inv.id} className="transition border-b hover:bg-green-50">
                  <td className="px-4 py-3">{formatDate(inv.invoice_date)}</td>
                  <td className="px-4 py-3 font-medium text-green-700">{inv.invoice_number}</td>
                  <td className="px-4 py-3">{inv.customer.display_name}</td>
                  <td className="px-4 py-3">{formatDate(inv.due_date)}</td>
                  <td className="px-4 py-3 font-medium text-right">₹{Number(inv.total_amount).toLocaleString()}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusStyle(inv.status)}`}
                    >
                      {inv.status}
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between mt-6 text-sm text-gray-600">
        <span>
          Showing {invoices.length} invoice{invoices.length !== 1 ? "s" : ""}
        </span>
        <div className="flex gap-1">
          <button
            disabled={!prevPageUrl}
            onClick={handlePrevPage}
            className={`flex items-center gap-1 border px-3 py-1.5 rounded-lg hover:bg-green-50 transition ${
              !prevPageUrl ? "opacity-50 cursor-not-allowed" : ""
            }`}
          >
            <ChevronLeft size={14} /> Prev
          </button>
          <button className="border px-3 py-1.5 rounded-lg bg-green-600 text-white shadow-sm">
            {page}
          </button>
          <button
            disabled={!nextPageUrl}
            onClick={handleNextPage}
            className={`flex items-center gap-1 border px-3 py-1.5 rounded-lg hover:bg-green-50 transition ${
              !nextPageUrl ? "opacity-50 cursor-not-allowed" : ""
            }`}
          >
            Next <ChevronRight size={14} />
          </button>
        </div>
      </div>
    </div>
  );
}