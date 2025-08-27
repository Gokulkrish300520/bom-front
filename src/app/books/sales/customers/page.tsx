"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { FaPlus, FaEdit, FaTrash } from "react-icons/fa";
import { fetchWithAuth } from "@/auth/tokenservice";

type Customer = {
  id: number;
  display_name: string;
  company_name: string;
  email: string;
  work_phone: string;
};

export default function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadCustomers() {
      try {
        const res = await fetchWithAuth("https://bpm-production.up.railway.app/api/customers/");
        if (!res.ok) throw new Error("Failed to fetch customers");
        const data = await res.json();
        setCustomers(data.results);
      } catch (err) {
        setError("Failed to load customers");
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    loadCustomers();
  }, []);

  const deleteCustomer = async (id: number) => {
    if (!confirm("Are you sure you want to delete this customer?")) return;

    try {
      const res = await fetchWithAuth(
        `https://bpm-production.up.railway.app/api/customers/${id}/`,
        { method: "DELETE" }
      );
      if (!res.ok) throw new Error("Delete failed");
      setCustomers(customers.filter((c) => c.id !== id));
    } catch (err) {
      alert("Failed to delete customer");
      console.error(err);
    }
  };

  if (loading) return <p>Loading customers...</p>;
  if (error) return <p className="text-red-600">{error}</p>;

  return (
    <div className="min-h-screen p-6 bg-green-50">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-green-900">
          Active Customers
        </h1>
        <Link
          href="/books/sales/customers/new"
          className="flex items-center gap-2 px-4 py-2 text-white transition bg-green-600 rounded-lg shadow hover:bg-green-700"
        >
          <FaPlus /> New
        </Link>
      </div>

      <div className="overflow-hidden bg-white rounded-lg shadow-md">
        <table className="w-full text-left border-collapse">
          <thead className="text-sm text-green-800 uppercase bg-green-100">
            <tr>
              <th className="px-4 py-2 border">Name</th>
              <th className="px-4 py-2 border">Company Name</th>
              <th className="px-4 py-2 border">Email</th>
              <th className="px-4 py-2 border">Work Phone</th>
              <th className="px-4 py-2 border">Actions</th>
            </tr>
          </thead>
          <tbody>
            {customers.length > 0 ? (
              customers.map((c) => (
                <tr key={c.id} className="hover:bg-green-50">
                  <td className="px-4 py-2 border">{c.display_name}</td>
                  <td className="px-4 py-2 border">{c.company_name}</td>
                  <td className="px-4 py-2 border">{c.email}</td>
                  <td className="px-4 py-2 border">{c.work_phone}</td>
                  <td className="flex gap-3 px-4 py-2 border">
                    <button className="text-green-600 hover:text-green-800">
                      <FaEdit />
                    </button>
                    <button
                      onClick={() => deleteCustomer(c.id)}
                      className="text-red-600 hover:text-red-800"
                    >
                      <FaTrash />
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td
                  colSpan={5}
                  className="py-4 italic text-center text-gray-500"
                >
                  No customers added yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
