"use client";

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

type ProformaInvoice = {
  id: string;
  customer: CustomerType;
  proforma_number: string;
  date: string; // ISO date
  due_date : string;
  amount: string | number;
  status: ProformaStatus;
  notes: string;
  created_at: string;
};

const STORAGE_KEY = "proforma_invoices";

export default function ProformaInvoicesPage() {
  const   [Proforma, setProforma] = useState<ProformaInvoice[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
  
    useEffect(() => {
      async function loadp_invoices() {
        try {
          const res = await fetchWithAuth("https://bpm-production.up.railway.app/api/proformainvoices/");
          if (!res.ok) throw new Error("Failed to fetch quotes");
          const data = await res.json();
          setProforma(data.results);
        } catch (err) {
          setError("Failed to load quotes");
          console.error(err);
        } finally {
          setLoading(false);
        }
      }
      loadp_invoices();
    }, []);
  
    const formatDate = (dateStr: string) => {
      try {
        return new Date(dateStr).toLocaleDateString();
      } catch {
        return dateStr;
      }
    };
  if (loading) return <p>Loading customers...</p>;
  if (error) return <p className="text-red-600">{error}</p>;

  return (
    <div className="min-h-screen p-6 bg-green-50">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-green-800">All Proforma Invoices</h1>
        <Link
          href="proforma-invoice/new"
          className="px-4 py-2 text-white bg-green-600 rounded-lg shadow hover:bg-green-700"
        >
          + New
        </Link>
      </div>

      <div className="overflow-hidden shadow rounded-xl">
        <table className="w-full border-collapse">
          <thead className="text-green-900 bg-green-200">
            <tr>
              <th className="p-3 text-left">Date</th>
              <th className="p-3 text-left">Invoice Number</th>
              <th className="p-3 text-left">Customer Name</th>
              <th className="p-3 text-left">Status</th>
              <th className="p-3 text-left">Amount</th>
            </tr>
          </thead>
          <tbody>
            {Proforma.length === 0 ? (
              <tr>
                <td
                  colSpan={5}
                  className="p-4 text-center text-gray-500 bg-white"
                >
                  No proforma invoices found
                </td>
              </tr>
            ) : (
              Proforma.map((inv, idx) => (
                <tr
                  key={inv.id}
                  className={`${
                    idx % 2 ? "bg-green-100" : "bg-green-50"
                  } border-b`}
                >
                  <td className="p-3">{inv.date}</td>
                  <td className="p-3">{inv.proforma_number}</td>
                  <td className="p-3">{inv.customer.name}</td>
                  <td className="p-3">
                    <span
                      className={`px-2 py-1 rounded text-sm ${
                        inv.status === "draft"
                          ? "bg-yellow-100 text-yellow-800"
                          : inv.status === "sent"
                          ? "bg-blue-100 text-blue-800"
                          : inv.status === "accepted"
                          ? "bg-green-100 text-green-800"
                          : "bg-red-100 text-red-800"
                      }`}
                    >
                      {inv.status}
                    </span>
                  </td>
                  <td className="p-3">₹{inv.amount}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
