"use client";

import React, { useEffect, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { fetchWithAuth } from "@/auth/tokenservice";
import Breadcrumb from "@/app/breadcrumb";

interface Transaction {
  id: number;
  vendor_name: string;
  total_amount: number;
  amount_to_pay: number;
  amount: string;
  paid_by: string;
  payment_reference_no: string | null;
  paid_on: string;
  content_object_type: string;
}

interface ApiResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: Transaction[];
}

const PAGE_SIZE = 10;

const PendingTransactionsPage: React.FC = () => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [nextPageUrl, setNextPageUrl] = useState<string | null>(null);
  const [prevPageUrl, setPrevPageUrl] = useState<string | null>(null);

  const fetchTransactions = async (page: number) => {
    try {
      setLoading(true);
      setError(null);

      const token = localStorage.getItem("accessToken");
      const response = await fetchWithAuth(
        `https://web-production-6baf3.up.railway.app/api/transactions/pending/?page=${page}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      const data: ApiResponse = await response.json(); // parse JSON from fetchWithAuth
      setTransactions(data.results);
      setNextPageUrl(data.next);
      setPrevPageUrl(data.previous);
      setTotalPages(Math.ceil(data.count / PAGE_SIZE));
    } catch (err: any) {
      setError(err.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTransactions(page);
  }, [page]);

  const handlePrevPage = () => {
    if (prevPageUrl) setPage((p) => Math.max(p - 1, 1));
  };

  const handleNextPage = () => {
    if (nextPageUrl) setPage((p) => Math.min(p + 1, totalPages));
  };

  return (
    <div className="min-h-screen p-6 bg-green-50">
      <Breadcrumb />
      <h1 className="text-3xl font-bold mb-6 text-center text-green-700">
        Pending Transactions
      </h1>

      {loading && <p className="text-center text-green-500">Loading...</p>}
      {error && <p className="text-center text-red-500">{error}</p>}

      {!loading && transactions.length === 0 && (
        <p className="text-center text-green-500">No pending transactions found.</p>
      )}

      {!loading && transactions.length > 0 && (
      <div className="overflow-x-auto shadow-md rounded-lg bg-white">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-green-600 text-gray-50 uppercase text-sm font-semibold">
            <tr>
              <th className="px-4 py-3 text-left">Vendor</th>
              <th className="px-4 py-3 text-left">Total Amount</th>
              <th className="px-4 py-3 text-left">Amount to Pay</th>
              <th className="px-4 py-3 text-left">Paid Amount</th>
              <th className="px-4 py-3 text-left">Paid By</th>
              <th className="px-4 py-3 text-left">Reference No</th>
              <th className="px-4 py-3 text-left">Paid On</th>
              <th className="px-4 py-3 text-left">Type</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {transactions.map((t) => (
              <tr
                key={t.id}
                className="hover:bg-green-50 transition-colors"
              >
                <td className="px-4 py-2 font-medium">{t.vendor_name}</td>
                <td className="px-4 py-2">{t.total_amount.toLocaleString()}</td>
                <td className="px-4 py-2">{t.amount_to_pay.toLocaleString()}</td>
                <td className="px-4 py-2">{parseFloat(t.amount).toLocaleString()}</td>
                <td className="px-4 py-2">{t.paid_by}</td>
                <td className="px-4 py-2">{t.payment_reference_no || "-"}</td>
                <td className="px-4 py-2">{new Date(t.paid_on).toLocaleString()}</td>
                <td className="px-4 py-2 capitalize">{t.content_object_type}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      )}

      {/* Pagination */}
      {transactions.length > 0 && (
        <div className="flex items-center justify-between mt-6 text-sm text-gray-600">
          <span>
            Showing {transactions.length} transaction
            {transactions.length !== 1 ? "s" : ""}
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
      )}
    </div>
  );
};

export default PendingTransactionsPage;
