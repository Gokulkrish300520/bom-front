"use client";

import { useEffect, useState } from "react";
import * as XLSX from "xlsx";

type Transaction = {
  id: number;
  type: "Customer" | "Vendor";
  name: string;
  date: string; // stored as YYYY-MM-DD
  amount: number;
  description: string;
};

export default function TransactionsPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [filtered, setFiltered] = useState<Transaction[]>([]);

  useEffect(() => {
    const data = localStorage.getItem("transactions");
    if (data) {
      try {
        const parsed: Transaction[] = JSON.parse(data);
        setTransactions(parsed);
        setFiltered(parsed);
      } catch (err) {
        console.error("Failed to parse transactions", err);
      }
    }
  }, []);

  // Filter by date
  useEffect(() => {
    let result = [...transactions];
    if (fromDate) {
      result = result.filter((t) => new Date(t.date) >= new Date(fromDate));
    }
    if (toDate) {
      result = result.filter((t) => new Date(t.date) <= new Date(toDate));
    }
    setFiltered(result);
  }, [fromDate, toDate, transactions]);

  // Download Excel
  const handleDownloadExcel = () => {
    const ws = XLSX.utils.json_to_sheet(filtered);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Transactions");
    XLSX.writeFile(wb, "transactions.xlsx");
  };

  return (
    <div className="relative min-h-screen p-6 bg-green-50">
      <h1 className="mb-6 text-2xl font-bold text-green-900">Transactions</h1>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-4 mb-6">
        <div>
          <label className="block mb-1 text-sm font-medium text-green-800">
            From Date
          </label>
          <input
            type="date"
            value={fromDate}
            onChange={(e) => setFromDate(e.target.value)}
            className="px-2 py-1 border rounded-md"
          />
        </div>
        <div>
          <label className="block mb-1 text-sm font-medium text-green-800">
            To Date
          </label>
          <input
            type="date"
            value={toDate}
            onChange={(e) => setToDate(e.target.value)}
            className="px-2 py-1 border rounded-md"
          />
        </div>
      </div>

      {/* Table */}
      <div className="overflow-hidden bg-white rounded-lg shadow-md">
        <table className="w-full text-left border-collapse">
          <thead className="text-sm text-green-800 uppercase bg-green-100">
            <tr>
              <th className="px-4 py-2 border">Type</th>
              <th className="px-4 py-2 border">Name</th>
              <th className="px-4 py-2 border">Date</th>
              <th className="px-4 py-2 border">Amount</th>
              <th className="px-4 py-2 border">Description</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length > 0 ? (
              filtered.map((t) => (
                <tr key={t.id} className="hover:bg-green-50">
                  <td className="px-4 py-2 border">{t.type}</td>
                  <td className="px-4 py-2 border">{t.name}</td>
                  <td className="px-4 py-2 border">{t.date}</td>
                  <td className="px-4 py-2 border">${t.amount.toFixed(2)}</td>
                  <td className="px-4 py-2 border">{t.description}</td>
                </tr>
              ))
            ) : (
              <tr>
                <td
                  colSpan={5}
                  className="py-4 italic text-center text-gray-500"
                >
                  No transactions recorded yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Download Button (Bottom Right) */}
      <div className="fixed bottom-6 right-6">
        <button
          onClick={handleDownloadExcel}
          className="px-4 py-2 text-white bg-green-600 rounded-md shadow hover:bg-green-700"
        >
          Download Excel
        </button>
      </div>
    </div>
  );
}