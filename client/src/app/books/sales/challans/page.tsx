"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { fetchWithAuth } from "@/auth/tokenservice";
import { ChevronLeft, ChevronRight, Plus } from "lucide-react";

type CustomerType = {
  id: number;
  display_name: string;
  email?: string;
  company_name?: string;
};

type ChallanStatus = "draft" | "sent" | "accepted" | "rejected";

type Challan = {
  id: string;
  customer: CustomerType;
  challan_number: string;
  reference_number: string;
  date: string;
  delivery_date?: string;
  status: ChallanStatus;
  notes?: string;
};

export default function ChallanPage() {
  const [challans, setChallans] = useState<Challan[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [invoices, setInvoices] = useState<any[]>([]);

  // Pagination
  const [page, setPage] = useState(1);
  const [nextPageUrl, setNextPageUrl] = useState<string | null>(null);
  const [prevPageUrl, setPrevPageUrl] = useState<string | null>(null);

  useEffect(() => {
    async function loadInvoices() {
      try {
        const res = await fetchWithAuth(
          "https://bom-front-production.up.railway.app/api/invoices/"
        );
        const data = await res.json();
        setInvoices(data.results);
      } catch (err) {
        console.error("Failed to load invoices", err);
      }
    }
    loadInvoices();
  }, []);

  async function loadChallans(url?: string, pageNumber = 1) {
    setLoading(true);
    setError("");
    try {
      const apiUrl =
        url ||
        `https://bom-front-production.up.railway.app/api/deliverychallans/?page=${pageNumber}`;
      const res = await fetchWithAuth(apiUrl);
      if (!res.ok) throw new Error("Failed to fetch challans");
      const data = await res.json();
      setChallans(data.results || []);
      setNextPageUrl(data.next || null);
      setPrevPageUrl(data.previous || null);
      if (!url) setPage(pageNumber);
    } catch (err) {
      setError("Failed to load challans");
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadChallans(undefined, page);
  }, [page]);

  const formatDate = (dateStr: string) => {
    try {
      return new Date(dateStr).toLocaleDateString();
    } catch {
      return dateStr;
    }
  };

  const getStatusColor = (status?: string) => {
    if (!status) return "bg-gray-100 text-gray-800";
    switch (status.toLowerCase()) {
      case "draft":
        return "bg-yellow-100 text-yellow-800";
      case "sent":
        return "bg-blue-100 text-blue-800";
      case "accepted":
        return "bg-green-100 text-green-800";
      case "rejected":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const handlePrevPage = () => {
    if (prevPageUrl) loadChallans(prevPageUrl);
  };

  const handleNextPage = () => {
    if (nextPageUrl) loadChallans(nextPageUrl);
  };

  if (loading) return <p>Loading challans...</p>;
  if (error) return <p className="text-red-600">{error}</p>;

  return (
    <div className="min-h-screen p-6 bg-[#f3fdf5]">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-green-900">All Delivery Challans</h1>
        <Link href="/books/sales/challans/new">
          <button className="flex items-center gap-2 px-5 py-2 font-medium text-white bg-green-600 rounded-lg shadow-sm hover:bg-green-700">
            <Plus size={16} /> New
          </button>
        </Link>
      </div>

      {/* Table */}
      <div className="overflow-hidden bg-white border border-green-100 shadow-sm rounded-xl">
        <table className="w-full text-sm">
          <thead className="bg-green-200 text-green-900">
            <tr>
              <th className="px-4 py-3 text-left">Date</th>
              <th className="px-4 py-3 text-left">Challan #</th>
              <th className="px-4 py-3 text-left">Reference #</th>
              <th className="px-4 py-3 text-left">Customer</th>
              <th className="px-4 py-3 text-left">Status</th>
              <th className="px-4 py-3 text-left">Invoice Status</th>
            </tr>
          </thead>
          <tbody>
            {challans.length === 0 ? (
              <tr>
                <td colSpan={6} className="p-4 text-center text-gray-500">
                  No challans found. Click <b>+ New</b> to create one.
                </td>
              </tr>
            ) : (
              challans.map((c) => {
                const relatedInvoice = invoices.find(
                  (inv) => inv.customer.id === c.customer.id
                );
                return (
                  <tr key={c.id} className="transition border-b hover:bg-green-50">
                    <td className="px-4 py-3">{formatDate(c.date)}</td>
                    <td className="px-4 py-3 font-medium text-green-700">
                      <Link
                        href={`/books/sales/challans/${c.id}`}
                        className="hover:underline"
                      >
                        {c.challan_number}
                      </Link>
                    </td>
                    <td className="px-4 py-3">{c.reference_number}</td>
                    <td className="px-4 py-3">{c.customer.display_name}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(
                          c.status
                        )}`}
                      >
                        {c.status?.toLowerCase()}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(
                          relatedInvoice?.status
                        )}`}
                      >
                        {relatedInvoice?.status?.toLowerCase() || "-"}
                      </span>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between mt-6 text-sm text-gray-600">
        <span>
          Showing {challans.length} challan{challans.length !== 1 ? "s" : ""}
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
