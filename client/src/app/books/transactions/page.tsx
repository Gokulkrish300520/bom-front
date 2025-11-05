"use client";

import { useEffect, useState } from "react";
import { fetchWithAuth } from "@/auth/tokenservice";
import Link from "next/link";
import toast from "react-hot-toast";

type Transaction = {
  id: number;
  vendor_name: string | null;
  amount: string;
  paid_by: string;
  payment_reference_no: string | null;
  paid_on: string;
  content_object_type: string;
};

const PAID_BY_OPTIONS = ["SBI", "Petty Cash", "ICICI", "IOB"];

export default function TransactionsPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(false);
  const [filterPaidBy, setFilterPaidBy] = useState("");
  const [filterFrom, setFilterFrom] = useState("");
  const [filterTo, setFilterTo] = useState("");
  const [nextPage, setNextPage] = useState<string | null>(null);
  const [prevPage, setPrevPage] = useState<string | null>(null);

  const API_BASE = "https://web-production-6baf3.up.railway.app/api/transactions/";

  // Fetch transactions
  const loadTransactions = async (url?: string, isFiltered = false) => {
    setLoading(true);
    try {
      const paramsObj: Record<string, string> = {};
      if (isFiltered && filterPaidBy) paramsObj["paid_by"] = filterPaidBy;
      if (filterFrom) paramsObj["start_date"] = filterFrom;
      if (filterTo) paramsObj["end_date"] = filterTo;
      const query = new URLSearchParams(paramsObj).toString();
      const fetchUrl = typeof url === "string" && url ? url : `${API_BASE}${query ? "?" + query : ""}`;

      const res = await fetchWithAuth(fetchUrl);
      if (!res.ok) throw new Error("Failed to fetch transactions");

      const data = await res.json();
      setTransactions(data.results || []);
      setNextPage(data.next || null);
      setPrevPage(data.previous || null);
    } catch (err) {
      toast.error("Failed to fetch transactions");
    } finally {
      setLoading(false);
    }
  };

  // Initial load: show all transactions (no paid_by filter)
  useEffect(() => {
    loadTransactions();
  }, []);

  // Delete transaction
  const handleDelete = async (id: number) => {
    if (!confirm("Delete this transaction?")) return;
    try {
      await toast.promise(
        fetchWithAuth(`${API_BASE}${id}/`, { method: "DELETE" }),
        {
          loading: "Deleting transaction...",
          success: "Transaction deleted successfully!",
          error: "Failed to delete transaction",
        }
      );
      setTransactions((prev) => prev.filter((t) => t.id !== id));
    } catch {}
  };

  return (
    <div className="page p-6 bg-green-50 min-h-screen relative">
      <h1 className="mb-6 text-2xl font-bold text-green-900">Transactions</h1>

      {/* Filters */}
      <div className="flex flex-wrap items-end gap-4 mb-6">
        <div>
          <label className="block mb-1 text-sm font-medium text-green-800">From</label>
          <input
            type="date"
            className="px-2 py-1 border rounded"
            value={filterFrom}
            onChange={(e) => setFilterFrom(e.target.value)}
          />
        </div>
        <div>
          <label className="block mb-1 text-sm font-medium text-green-800">To</label>
          <input
            type="date"
            className="px-2 py-1 border rounded"
            value={filterTo}
            onChange={(e) => setFilterTo(e.target.value)}
          />
        </div>
        <div>
          <label className="block mb-1 text-sm font-medium text-green-800">Paid By</label>
          <select
            className="px-2 py-1 border rounded"
            value={filterPaidBy}
            onChange={(e) => setFilterPaidBy(e.target.value)}
          >
            <option value="">All</option>
            {PAID_BY_OPTIONS.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </div>
        <button
          onClick={() => loadTransactions(undefined, true)}
          className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
        >
          Search
        </button>
        <Link href="/books/transactions/new">
          <button className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700">
            + Add Transaction
          </button>
        </Link>
      </div>

      {/* Transactions Table */}
      <div className="bg-white shadow-md rounded overflow-auto max-h-[60vh] relative">
        {loading && (
          <div className="absolute inset-0 flex items-center justify-center bg-white/70 z-10">
            Loading...
          </div>
        )}
        <table className="w-full text-left border-collapse">
          <thead className="bg-green-100 sticky top-0 z-0">
            <tr>
              {["Type", "Vendor", "Paid By", "Date", "Amount", "Reference No", "Actions"].map(
                (header) => (
                  <th key={header} className="border p-2 text-green-800 uppercase">
                    {header}
                  </th>
                )
              )}
            </tr>
          </thead>
          <tbody>
            {transactions.length === 0 ? (
              <tr>
                <td colSpan={7} className="p-4 text-center italic text-gray-500">
                  No transactions found.
                </td>
              </tr>
            ) : (
              transactions.map((t) => (
                <tr key={t.id} className="hover:bg-green-50">
                  <td className="border p-2 capitalize">
                    {t.content_object_type}
                  </td>
                  <td className="border p-2">{t.vendor_name || "-"}</td>
                  <td className="border p-2">{t.paid_by}</td>
                  <td className="border p-2">
                    {new Date(t.paid_on).toLocaleDateString("en-IN")}
                  </td>
                  <td className="border p-2 font-semibold text-green-700">
                    ₹{Number(t.amount ?? 0).toLocaleString()}
                  </td>
                  <td className="border p-2">{t.payment_reference_no || "-"}</td>
                  <td className="border p-2">
                    <button className="text-red-600" onClick={() => handleDelete(t.id)}>
                      Delete
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>

      </div>
      {/* Pagination Controls */}
        <div className="flex justify-between items-center mt-4">
          <button
            disabled={!prevPage}
            onClick={() => prevPage && loadTransactions(prevPage, !!filterPaidBy)}
            className={`px-4 py-2 rounded ${
              prevPage ? "bg-green-600 text-white hover:bg-green-700" : "bg-gray-300 text-gray-600 cursor-not-allowed"
            }`}
          >
            Previous
          </button>
          <button
            disabled={!nextPage}
            onClick={() => nextPage && loadTransactions(nextPage, !!filterPaidBy)}
            className={`px-4 py-2 rounded ${
              nextPage ? "bg-green-600 text-white hover:bg-green-700" : "bg-gray-300 text-gray-600 cursor-not-allowed"
            }`}
          >
            Next
          </button>
        </div>
    </div>
  );
}
