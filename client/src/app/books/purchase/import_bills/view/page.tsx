"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";

interface Row {
  item: string;
  description: string;
  specification: string;
  hsn: string;
  brand: string;
  qty: number;
  unitPrice: number;
  total: number;
}

interface ImportBill {
  vendor: string;
  dealNumber: string;
  invoiceDate: string;
  billUpload?: string;
  paymentRequest: "High" | "Low";
  paymentStatus: "Paid" | "Unpaid" | "Partially Paid";
  paymentRef?: string;
  paidBy: "SBI" | "ICICI" | "IOB" | "Petty Cash";
  rows: Row[];
}

export default function ViewImportBillPage() {
  const router = useRouter();
  const [bill, setBill] = useState<ImportBill | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const index = Number(params.get("index") || 0);

    const savedData = localStorage.getItem("importBillData");
    if (savedData) {
      const parsed: ImportBill[] = JSON.parse(savedData);
      setBill(parsed[index]);
    }
  }, []);

  if (!bill) return <p>Loading...</p>;

  const totalAmount = bill.rows.reduce((sum, r) => sum + r.total, 0);

  return (
    <div className="min-h-screen p-6 bg-green-50">
      <button onClick={() => router.back()} className="flex items-center mb-4 text-green-700 hover:text-green-900">
        <ArrowLeft className="mr-2" /> Back
      </button>

      <h1 className="mb-6 text-2xl font-bold text-green-900">View Import Bill</h1>

      <div className="grid grid-cols-1 gap-4 mb-6 md:grid-cols-2">
        <div><strong>Vendor:</strong> {bill.vendor}</div>
        <div><strong>Deal Number:</strong> {bill.dealNumber}</div>
        <div><strong>Invoice Date:</strong> {bill.invoiceDate}</div>
        <div><strong>Payment Request:</strong> {bill.paymentRequest}</div>
        <div><strong>Payment Status:</strong> {bill.paymentStatus}</div>
        <div><strong>Payment Ref No:</strong> {bill.paymentRef || "-"}</div>
        <div><strong>Paid By:</strong> {bill.paidBy}</div>
        <div>
          <strong>Bill Upload:</strong>{" "}
          {bill.billUpload ? (
            <a href="#" className="text-blue-700 underline">{bill.billUpload}</a>
          ) : "-"}
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full border border-collapse border-green-200 table-auto">
          <thead className="text-green-900 bg-green-100">
            <tr>
              <th className="p-2 border border-green-300">Item</th>
              <th className="p-2 border border-green-300">Description</th>
              <th className="p-2 border border-green-300">Specification</th>
              <th className="p-2 border border-green-300">HSN Code</th>
              <th className="p-2 border border-green-300">Brand</th>
              <th className="p-2 border border-green-300">Qty/PCS</th>
              <th className="p-2 border border-green-300">Unit Price (USD)</th>
              <th className="p-2 border border-green-300">Total (USD)</th>
            </tr>
          </thead>
          <tbody>
            {bill.rows.map((row, idx) => (
              <tr key={idx}>
                <td className="p-2 border border-green-300">{row.item}</td>
                <td className="p-2 border border-green-300">{row.description}</td>
                <td className="p-2 border border-green-300">{row.specification}</td>
                <td className="p-2 border border-green-300">{row.hsn}</td>
                <td className="p-2 border border-green-300">{row.brand}</td>
                <td className="p-2 border border-green-300">{row.qty}</td>
                <td className="p-2 border border-green-300">{row.unitPrice}</td>
                <td className="p-2 font-semibold text-green-900 border border-green-300">{row.total.toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-4 text-lg font-bold text-right text-green-900">Total Amount: USD {totalAmount.toFixed(2)}</div>
    </div>
  );
}