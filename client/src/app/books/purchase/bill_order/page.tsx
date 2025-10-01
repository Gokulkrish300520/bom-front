"use client";

import { Plus } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { FaTrash } from "react-icons/fa";

type VendorType = {
  id: number;
  display_name: string;
};

type BillOrder = {
  id: string;
  vendor: VendorType;
  bill_number: string;
  bill_date: string;
  deal_number?: string;
  total_amount: number | string;
  country?: string;
  created_at: string;
};

export default function BillOrderListPage() {
  const [bills, setBills] = useState<BillOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Load from localStorage
  function loadBills() {
    setLoading(true);
    try {
      const stored = localStorage.getItem("bill_orders");
      const data: BillOrder[] = stored ? JSON.parse(stored) : [];
      setBills(data);
    } catch (err) {
      setError("Failed to load bill orders");
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  // Save to localStorage
  function saveBills(updated: BillOrder[]) {
    setBills(updated);
    localStorage.setItem("bill_orders", JSON.stringify(updated));
  }

  function deleteBill(id: string) {
    if (!confirm("Are you sure you want to delete this bill order?")) return;
    const updated = bills.filter((b) => b.id !== id);
    saveBills(updated);
  }

  useEffect(() => {
    loadBills();
  }, []);

  const formatDate = (str: string) => {
    try {
      return new Date(str).toLocaleDateString();
    } catch {
      return str;
    }
  };

  if (loading) return <p>Loading bills...</p>;
  if (error) return <p className="text-red-600">{error}</p>;

  return (
    <div className="min-h-screen p-6 bg-[#f3fdf5]">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-green-900">All Bill Orders</h1>
        <Link
          href="/books/purchase/bill_order/new"
          className="flex items-center gap-2 px-5 py-2 font-medium text-white bg-green-600 rounded-lg shadow-sm hover:bg-green-700"
        >
          <Plus size={16} /> New
        </Link>
      </div>

      <div className="overflow-hidden bg-white border border-green-100 shadow-sm rounded-xl">
        <table className="w-full text-sm">
          <thead className="text-green-900 bg-green-200">
            <tr>
              <th className="px-4 py-3 text-left">Date</th>
              <th className="px-4 py-3 text-left">Bill Number</th>
              <th className="px-4 py-3 text-left">Deal Number</th>
              <th className="px-4 py-3 text-left">Vendor</th>
              <th className="px-4 py-3 text-left">Country</th>
              <th className="px-4 py-3 text-right">Amount</th>
              <th className="px-4 py-3 text-left">Actions</th>
            </tr>
          </thead>
          <tbody>
            {bills.length === 0 ? (
              <tr>
                <td colSpan={7} className="p-4 text-center text-gray-500 bg-white">
                  No bill orders found
                </td>
              </tr>
            ) : (
              bills.map((bill) => (
                <tr key={bill.id} className="transition border-b hover:bg-green-50">
                  <td className="px-4 py-3">{formatDate(bill.bill_date)}</td>
                  <td className="px-4 py-3 font-medium">
                    <Link href={`/books/purchase/bill_order/${bill.id}`} className="hover:underline">
                      {bill.bill_number}
                    </Link>
                  </td>
                  <td className="px-4 py-3">{bill.deal_number || "-"}</td>
                  <td className="px-4 py-3">{bill.vendor.display_name}</td>
                  <td className="px-4 py-3">{bill.country || "-"}</td>
                  <td className="px-4 py-3 font-medium text-right">
                    ₹{Number(bill.total_amount).toLocaleString()}
                  </td>
                  <td className="flex items-center gap-2 px-4 py-3">
                    <button
                      onClick={() => deleteBill(bill.id)}
                      className="text-red-600 hover:text-red-800"
                      title="Delete Bill Order"
                    >
                      <FaTrash />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}