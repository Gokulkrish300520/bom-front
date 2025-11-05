"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useParams } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { fetchWithAuth } from "@/auth/tokenservice";
import toast from "react-hot-toast";
import Breadcrumb from "@/app/breadcrumb";

interface Row {
  item_name: string;
  description: string;
  item_specification: string;
  hsn_code: string;
  brand: string;
  quantity: number;
  unit_price: number;
  total_price: number;
}

interface ImportBill {
  id: number;
  vendor: { display_name: string };
  deal_no: string;
  date: string;
  currency: string;
  transactions?: Transaction[];
  payment_request: "High" | "Low";
  payment_status: "Paid" | "Unpaid" | "Partially Paid";
  payment_reference_no?: string;
  paid_by: "SBI" | "ICICI" | "IOB" | "Petty Cash";
  total_amount?: string;
  bill_items: Row[];
  paid_amount?: string;
  amount_to_pay?: string;
}

interface Transaction {
  id: number;
  vendor_name: string | null;
  amount: string;
  paid_by: string;
  payment_reference_no: string | null;
  paid_on: string;
  content_object_type: string;
}

const currencySymbols: Record<string, string> = {
  INR: "₹",
  USD: "$",
  EUR: "€",
  GBP: "£",
  JPY: "¥",
};


export default function ViewImportBillPage() {
  const router = useRouter();
  const params = useParams();
  const [bill, setBill] = useState<ImportBill | null>(null);
  const [loading, setLoading] = useState(true);


  useEffect(() => {
  const fetchBill = async () => {
    try {
      if (!params?.id) {
        console.warn("No ID in params:", params);
        return;
      }

      const id = Array.isArray(params.id) ? params.id[0] : params.id;
      console.log("Fetching import bill with ID:", id);

      const res = await fetchWithAuth(
        `https://web-production-6baf3.up.railway.app/api/importbills/${id}/`
      );

      if (!res.ok) {
        console.error("API Error:", res.status, res.statusText);
        throw new Error(`Failed to fetch import bill with ID ${id}`);
      }

      const data = await res.json();
      console.log("Fetched bill:", data);
      setBill(data);
    } catch (err) {
      console.error("Fetch error:", err);
      toast.error("Failed to load import bill.");
    } finally {
      setLoading(false);
    }
  };

  fetchBill();
}, [params?.id]);


  if (loading) return <p className="p-6 text-green-700">Loading...</p>;
  if (!bill) return <p className="p-6 text-red-700">Import Bill not found.</p>;

  const total_amount = bill.total_amount ? parseFloat(bill.total_amount) : 0;
  const symbol = currencySymbols[bill.currency] ?? bill.currency;
  const fmt = (v: any) => (isNaN(Number(v)) ? "-" : Number(v).toFixed(2));

  return (
    <div className="min-h-screen p-6 bg-gray-50">
      {/* Back Button */}
      <div><Breadcrumb/></div>
      <button
        onClick={() => router.back()}
        className="flex items-center mb-6 px-3 py-2 bg-green-100 text-green-700 rounded hover:bg-green-200 transition"
      >
        <ArrowLeft className="mr-2" /> Back
      </button>

      {/* Page Title */}
      <h1 className="mb-6 text-3xl font-bold text-green-900">Import Bill Details</h1>

      {/* Bill Info Card */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8 bg-white p-6 rounded shadow">
        <div>
          <p><span className="font-semibold">Vendor:</span> {bill.vendor.display_name}</p>
          <p><span className="font-semibold">Deal Number:</span> {bill.deal_no}</p>
          <p><span className="font-semibold">Invoice Date:</span> {bill.date}</p>
        </div>
        <div>
          <p><span className="font-semibold">Payment Request:</span> {bill.payment_request}</p>
          <p><span className="font-semibold">Payment Status:</span> {bill.payment_status}</p>
          <p><span className="font-semibold">Payment Ref No:</span> {bill.payment_reference_no || "-"}</p>
          <p><span className="font-semibold">Paid By:</span> {bill.paid_by}</p>
        </div>
      </div>

      {/* Items Table */}
      <div className="overflow-x-auto rounded shadow">
        <table className="min-w-full divide-y divide-green-200 table-auto">
          <thead className="bg-green-100 sticky top-0">
            <tr>
              {[
                "Item",
                "Description",
                "Specification",
                "HSN Code",
                "Brand",
                "Qty/PCS",
                "Unit Price",
                "Total"
              ].map((header) => (
                <th key={header} className="px-4 py-2 text-left text-green-900 font-semibold">
                  {header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-green-200">
            {bill.bill_items.map((row, idx) => (
              <tr
                key={idx}
                className="hover:bg-green-50 transition-colors"
              >
                <td className="px-4 py-2">{row.item_name}</td>
                <td className="px-4 py-2">{row.description}</td>
                <td className="px-4 py-2">{row.item_specification}</td>
                <td className="px-4 py-2">{row.hsn_code}</td>
                <td className="px-4 py-2">{row.brand}</td>
                <td className="px-4 py-2">{Number(row.quantity)}</td>
                <td className="px-4 py-2">{Number(row.unit_price).toFixed(2)}</td>
                <td className="px-4 py-2 font-semibold text-green-900">{Number(row.total_price).toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {bill.transactions && bill.transactions.length > 0 && (
        <div className="bg-white p-6 rounded shadow mb-8">
          <h2 className="text-2xl font-bold text-green-900 mb-4">Payment Transactions</h2>
          <table className="min-w-full divide-y divide-green-200 table-auto">
            <thead className="bg-green-100">
              <tr>
                {["Date", "Amount", "Paid By", "Reference No"].map((header) => (
                  <th key={header} className="px-4 py-2 text-left text-green-900 font-semibold">{header}</th>
                ))}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-green-200">
              {bill.transactions.map((txn) => (
                <tr key={txn.id} className="hover:bg-green-50">
                  <td className="px-4 py-2">{new Date(txn.paid_on).toLocaleString()}</td>
                  <td className="px-4 py-2 font-semibold text-green-800">{symbol} {Number(txn.amount).toLocaleString()}</td>
                  <td className="px-4 py-2">{txn.paid_by}</td>
                  <td className="px-4 py-2">{txn.payment_reference_no || "-"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Footer Totals */}
      <div className="mt-6 text-right text-xl font-bold text-green-900">
        Grand Total: {symbol} {fmt(bill.total_amount)}
      </div>
      <div className="mt-2 text-right text-lg font-semibold text-green-800">
        Amount Paid: {symbol} {fmt(bill.paid_amount)}
      </div>
      <div className="mt-2 text-right text-lg font-semibold text-green-800">
        Remaining Amount: {symbol} {fmt(bill.amount_to_pay)}
      </div>
    </div>
  );
}
