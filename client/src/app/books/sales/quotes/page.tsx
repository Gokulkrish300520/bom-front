"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { fetchWithAuth } from "@/auth/tokenservice";

type CustomerType = {
  id: number;
  display_name: string;
  email: string;
  company_name: string;
  address?: string; // optional since your JSON may not have 'address'
  phone?: string; // optional as well
  created_at: string;
};

type QuoteStatus = "draft" | "sent" | "accepted" | "rejected";

type Quote = {
  id: number;
  customer: CustomerType; // nested customer object
  quote_number: string;
  reference_number: string;
  quote_date: string;      // updated to match API field name
  expiry_date: string;
  salesperson: string;
  project_name: string;
  subject: string;    // updated to match API field name
  total_amount: string | number;
  status: QuoteStatus;
  customer_notes: string;  // updated to match API field name for notes
  terms_and_conditions?: string; // optional if needed
  created_at: string;
};

export default function QuotesPage() {
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadQuotes() {
      try {
        const res = await fetchWithAuth("https://bpm-production.up.railway.app/api/quotes/");
        if (!res.ok) throw new Error("Failed to fetch quotes");
        const data = await res.json();
        setQuotes(data.results);
      } catch (err) {
        setError("Failed to load quotes");
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    loadQuotes();
  }, []);

  const formatDate = (dateStr: string) => {
    try {
      return new Date(dateStr).toLocaleDateString();
    } catch {
      return dateStr;
    }
  };

  if (loading) return <p>Loading quotes...</p>;
  if (error) return <p className="text-red-600">{error}</p>;

  return (
    <div className="min-h-screen p-6 bg-green-50">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-green-800">All Quotes</h1>
        <Link href="/books/sales/quotes/new">
          <button className="px-4 py-2 text-white bg-green-600 rounded-lg shadow hover:bg-green-700">
            + New
          </button>
        </Link>
      </div>

      <div className="overflow-hidden shadow rounded-xl">
        <table className="w-full border-collapse">
          <thead className="text-green-900 bg-green-200">
            <tr>
              <th className="p-3 text-left">Date</th>
              <th className="p-3 text-left">Quote Number</th>
              <th className="p-3 text-left">Customer Name</th>
              <th className="p-3 text-left">Status</th>
              <th className="p-3 text-left">Amount</th>
            </tr>
          </thead>
          <tbody>
            {quotes.length === 0 ? (
              <tr>
                <td colSpan={5} className="p-4 text-center text-gray-500 bg-white">
                  No quotes found
                </td>
              </tr>
            ) : (
              quotes.map((q, idx) => (
                <tr
                  key={q.id}
                  className={`${idx % 2 ? "bg-green-100" : "bg-green-50"} border-b`}
                >
                  <td className="p-3">{formatDate(q.quote_date)}</td>
                  <td className="px-4 py-2 border">
                    <Link href={`/books/sales/quotes/${q.id}`}>{q.quote_number}</Link>
                  </td>
                  <td className="p-3">{q.customer.display_name}</td>
                  <td className="p-3">
                    <span
                      className={`px-2 py-1 rounded text-sm ${
                        q.status === "draft"
                          ? "bg-yellow-100 text-yellow-800"
                          : q.status === "sent"
                          ? "bg-blue-100 text-blue-800"
                          : q.status === "accepted"
                          ? "bg-green-100 text-green-800"
                          : "bg-red-100 text-red-800"
                      }`}
                    >
                      {q.status.charAt(0).toUpperCase() + q.status.slice(1)}
                    </span>
                  </td>
                  <td className="p-3">₹{q.total_amount}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
