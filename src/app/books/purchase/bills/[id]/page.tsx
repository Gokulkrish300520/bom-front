"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { storage } from "../component/storage";
import { Bill } from "../component/types";

export default function BillDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const [bill, setBill] = useState<Bill | null>(null);

  useEffect(() => {
    const all = storage.getBills();
    setBill(all.find((b) => b.id === params.id) || null);
  }, [params.id]);

  const currency = (n: number) => `₹ ${n.toFixed(2)}`;

  const totals = useMemo(() => {
    if (!bill) return { subtotal: 0, tax: 0, total: 0 };
    return { subtotal: bill.amount, tax: bill.tax ?? 0, total: bill.total };
  }, [bill]);

  if (!bill) {
    return (
      <div className="p-6">
        <button onClick={() => router.push("/purchase/bills")}
                className="px-3 py-1 mb-4 bg-gray-100 rounded-xl hover:bg-gray-200">
          ← Back
        </button>
        <p>Bill not found.</p>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-4 md:p-6">
      <div className="flex items-center justify-between">
        <button onClick={() => router.push("/purchase/bills")}
                className="px-3 py-1 bg-gray-100 rounded-xl hover:bg-gray-200">
          ← All Bills
        </button>
        <button onClick={() => window.print()}
                className="px-4 py-2 text-white rounded-xl bg-emerald-600 hover:bg-emerald-700">
          Print / Download
        </button>
      </div>

      {/* Bill Header */}
      <div className="p-6 bg-white shadow rounded-2xl">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-emerald-700">Bill #{bill.billNo}</h1>
            <p className="text-sm text-gray-500">Ref: {bill.referenceNumber || "-"}</p>
            <p className="text-sm text-gray-500">Status: <span className="font-semibold">{bill.status}</span></p>
          </div>
          <div className="text-sm">
            <p><span className="text-gray-500">Bill Date:</span> {bill.date}</p>
            <p><span className="text-gray-500">Due Date:</span> {bill.dueDate || "-"}</p>
          </div>
        </div>

        {/* Vendor */}
        <div className="grid gap-4 pt-4 mt-4 border-t md:grid-cols-2">
          <div>
            <h3 className="font-semibold text-emerald-700">Vendor</h3>
            <p>{bill.vendorSnapshot.name}</p>
            {bill.vendorSnapshot.address && <p className="text-sm text-gray-600">{bill.vendorSnapshot.address}</p>}
            {bill.vendorSnapshot.email && <p className="text-sm text-gray-600">{bill.vendorSnapshot.email}</p>}
            {bill.vendorSnapshot.phone && <p className="text-sm text-gray-600">{bill.vendorSnapshot.phone}</p>}
          </div>
          <div className="md:text-right">
            <h3 className="font-semibold text-emerald-700">Amounts</h3>
            <p>Subtotal: {currency(totals.subtotal)}</p>
            <p>Tax: {currency(totals.tax)}</p>
            <p className="text-lg font-semibold">Total: {currency(totals.total)}</p>
            <p className="text-sm text-gray-600">Balance Due: {currency(bill.balanceDue)}</p>
          </div>
        </div>

        {/* Items */}
        <div className="mt-6 overflow-x-auto">
          <table className="min-w-full border rounded-xl">
            <thead className="bg-emerald-50">
              <tr className="text-left">
                <th className="p-3">Item</th>
                <th className="p-3 w-28">Qty</th>
                <th className="w-32 p-3">Rate</th>
                <th className="w-32 p-3">Amount</th>
              </tr>
            </thead>
            <tbody>
              {bill.items.map((it) => {
                const amt = it.qty * it.rate;
                return (
                  <tr key={it.id} className="border-t">
                    <td className="p-3">{it.name}</td>
                    <td className="p-3">{it.qty}</td>
                    <td className="p-3">{currency(it.rate)}</td>
                    <td className="p-3">{currency(amt)}</td>
                  </tr>
                );
              })}
              <tr className="border-t">
                <td colSpan={3} className="p-3 font-semibold text-right">Total</td>
                <td className="p-3 font-semibold">{currency(totals.total)}</td>
              </tr>
            </tbody>
          </table>
        </div>

        {bill.notes && (
          <div className="mt-4">
            <h4 className="font-semibold text-emerald-700">Notes</h4>
            <p className="text-sm text-gray-700 whitespace-pre-wrap">{bill.notes}</p>
          </div>
        )}
      </div>
    </div>
  );
}