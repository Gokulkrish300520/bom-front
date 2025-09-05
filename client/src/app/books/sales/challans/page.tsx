"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
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

type ChallanStatus = "draft" | "sent" | "accepted" | "rejected";

type Challan = {
  id: string;
  customer: CustomerType;
  challan_number: string;
  date: string; // ISO date
  delivery_date : string;
  status: ChallanStatus;
  notes: string;
  created_at: string;
};

const STORAGE_KEY = "Challans";

export default function ChallanPage() {
  const   [Challan, setChallan] = useState<Challan[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
  
    useEffect(() => {
      async function load_challans() {
        try {
          const res = await fetchWithAuth("https://bpm-production.up.railway.app/api/deliverychallans/");
          if (!res.ok) throw new Error("Failed to fetch quotes");
          const data = await res.json();
          setChallan(data.results);
        } catch (err) {
          setError("Failed to load quotes");
          console.error(err);
        } finally {
          setLoading(false);
        }
      }
      load_challans();
    }, []);
  
    const formatDate = (dateStr: string) => {
      try {
        return new Date(dateStr).toLocaleDateString();
      } catch {
        return dateStr;
      }
    };

  return (
    <div className="min-h-screen p-6 bg-green-50">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-green-800">All Delivery Challans</h1>
        <Link href="/books/sales/challans/new">
          <button className="px-4 py-2 text-white bg-green-600 rounded-lg shadow hover:bg-green-700">
            + New
          </button>
        </Link>
      </div>

      {/* Table */}
      <div className="overflow-x-auto bg-white shadow-lg rounded-xl">
        <table className="w-full border-collapse">
          <thead>
            <tr className="text-sm text-green-900 bg-green-100">
              <th className="p-3 text-left">DATE</th>
              <th className="p-3 text-left">DELIVERY CHALLAN#</th>
              <th className="p-3 text-left">REFERENCE NUMBER</th>
              <th className="p-3 text-left">CUSTOMER NAME</th>
              <th className="p-3 text-left">STATUS</th>
              <th className="p-3 text-left">INVOICE STATUS</th>
            </tr>
          </thead>
          <tbody>
            {Challan.length === 0 ? (
              <tr>
                <td colSpan={6} className="p-6 text-center text-gray-500">
                  No challans found. Click <b>+ New</b> to create one.
                </td>
              </tr>
            ) : (
              Challan.map((c) => (
                <tr key={c.id} className="border-b hover:bg-green-50">
                  <td className="p-3">{c.date}</td>
                  <td className="p-3 font-medium text-green-700">
                    <Link href={`/challans/${c.challan_number}`} className="hover:underline">
                      {c.challan_number}
                    </Link>
                  </td>
                  <td className="p-3">{c.challan_number}</td>
                  <td className="p-3">{c.customer.name}</td>
                  <td className="p-3">
                    <span
                      className={`px-2 py-1 rounded text-sm ${
                        c.status === "draft"
                          ? "bg-yellow-100 text-yellow-800"
                          : c.status === "sent"
                          ? "bg-blue-100 text-blue-800"
                          : c.status === "accepted"
                          ? "bg-green-100 text-green-800"
                          : "bg-red-100 text-red-800"
                      }`}
                    >
                      {c.status}
                    </span>
                  </td>
                  <td className="p-3 text-gray-500">{c.notes || "-"}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
