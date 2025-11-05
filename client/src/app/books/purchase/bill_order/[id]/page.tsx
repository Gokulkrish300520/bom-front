"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { fetchWithAuth } from "@/auth/tokenservice";
import toast from "react-hot-toast";
import Breadcrumb from "@/app/breadcrumb";

interface BillOrderItem {
  id: number;
  item_name: string;
  description: string;
  item_specification: string;
  brand: string;
  hsn_code: string;
  quantity: string;
  unit_price: string;
  total_price: string;
}

interface PaymentTransaction {
  id: number;
  amount: string;
  paid_by: string;
  payment_reference_no: string;
  paid_on: string;
}

interface BillOrder {
  id: number;
  vendor: string;
  deal_no: string;
  bill_number: string;
  status: string;
  bill_date: string;
  due_date: string;
  notes: string;
  subtotal: string;
  tax_type: string;
  tax_percentage: string;
  adjustments: string;
  total_amount: string;
  paid_amount: string;
  amount_to_pay: string;
  created_at: string;
  created_by: string;
  billorder_items: BillOrderItem[];
  transactions?: PaymentTransaction[]; // new field
}

export default function VendorBillPage() {
  const router = useRouter();
  const params = useParams();
  const [bill, setBill] = useState<BillOrder | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchBill = async () => {
      try {
        if (!params?.id) return;
        const id = Array.isArray(params.id) ? params.id[0] : params.id;

        const res = await fetchWithAuth(
          `https://web-production-6baf3.up.railway.app/api/billorders/${id}/`
        );

        if (!res.ok) throw new Error("Failed to fetch bill order");

        const data = await res.json();
        setBill(data);
      } catch (err) {
        console.error(err);
        toast.error("Failed to load bill order.");
      } finally {
        setLoading(false);
      }
    };

    fetchBill();
  }, [params?.id]);

  if (loading) return <p className="p-6 text-green-700">Loading...</p>;
  if (!bill) return <p className="p-6 text-red-700">Bill order not found.</p>;

  const totalAmount = parseFloat(bill.total_amount || "0");
  const paidAmount = parseFloat(bill.paid_amount || "0");
  const toBePaid = parseFloat(bill.amount_to_pay || "0");
  const subtotal = parseFloat(bill.subtotal || "0");
  const adjustments = parseFloat(bill.adjustments || "0");
  const tax = parseFloat(bill.tax_percentage || "0");

  return (
    <div className="min-h-screen p-6 bg-gray-50">
      <div><Breadcrumb/></div>

      {/* Back Button */}
      <button
        onClick={() => router.back()}
        className="flex items-center mb-6 px-3 py-2 bg-green-100 text-green-700 rounded hover:bg-green-200 transition"
      >
        <ArrowLeft className="mr-2" /> Back
      </button>

      {/* Page Title */}
      <h1 className="mb-6 text-3xl font-bold text-green-900">Bill Order Details</h1>

      {/* Bill Info */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8 bg-white p-6 rounded shadow">
        <div>
          <p><span className="font-semibold">Vendor:</span> {bill.vendor}</p>
          <p><span className="font-semibold">Deal Number:</span> {bill.deal_no}</p>
          <p><span className="font-semibold">Bill Number:</span> {bill.bill_number}</p>
          <p><span className="font-semibold">Bill Date:</span> {bill.bill_date}</p>
          <p><span className="font-semibold">Due Date:</span> {bill.due_date}</p>
        </div>
        <div>
          <p><span className="font-semibold">Status:</span> {bill.status}</p>
          <p><span className="font-semibold">Notes:</span> {bill.notes}</p>
          <p><span className="font-semibold">Subtotal:</span> ₹{subtotal.toLocaleString()}</p>
          <p><span className="font-semibold">Tax ({bill.tax_type} {bill.tax_percentage}%):</span> ₹{((subtotal * tax) / 100).toLocaleString()}</p>
          <p><span className="font-semibold">Adjustments:</span> ₹{adjustments.toLocaleString()}</p>
        </div>
      </div>

      {/* Items Table */}
      <div className="overflow-x-auto rounded shadow mb-8">
        <table className="min-w-full divide-y divide-green-200 table-auto">
          <thead className="bg-green-100 sticky top-0">
            <tr>
              {["Item", "Description", "Specification", "HSN Code", "Brand", "Qty", "Unit Price", "Total"].map((header) => (
                <th key={header} className="px-4 py-2 text-left text-green-900 font-semibold">
                  {header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-green-200">
            {bill.billorder_items.map((row) => (
              <tr key={row.id} className="hover:bg-green-50 transition-colors">
                <td className="px-4 py-2">{row.item_name}</td>
                <td className="px-4 py-2">{row.description}</td>
                <td className="px-4 py-2">{row.item_specification}</td>
                <td className="px-4 py-2">{row.hsn_code}</td>
                <td className="px-4 py-2">{row.brand}</td>
                <td className="px-4 py-2">{Number(row.quantity).toLocaleString()}</td>
                <td className="px-4 py-2">₹{Number(row.unit_price).toFixed(2)}</td>
                <td className="px-4 py-2 font-semibold text-green-900">₹{Number(row.total_price).toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Transaction History Section */}
      {bill.transactions && bill.transactions.length > 0 && (
        <div className="bg-white p-6 rounded shadow mb-8">
          <h2 className="text-2xl font-bold text-green-900 mb-4">Payment Transactions</h2>
          <table className="min-w-full divide-y divide-green-200 table-auto">
            <thead className="bg-green-100">
              <tr>
                {["Date", "Amount", "Paid By", "Reference No"].map((header) => (
                  <th key={header} className="px-4 py-2 text-left text-green-900 font-semibold">
                    {header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-green-200">
              {bill.transactions.map((txn) => (
                <tr key={txn.id} className="hover:bg-green-50">
                  <td className="px-4 py-2">{new Date(txn.paid_on).toLocaleString()}</td>
                  <td className="px-4 py-2 font-semibold text-green-800">₹{Number(txn.amount).toLocaleString()}</td>
                  <td className="px-4 py-2">{txn.paid_by}</td>
                  <td className="px-4 py-2">{txn.payment_reference_no || "-"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Totals */}
      <div className="mt-6 text-right text-xl font-bold text-green-900">
        Total Amount: ₹{totalAmount.toLocaleString()}
      </div>
      <div className="mt-2 text-right text-lg font-semibold text-green-800">
        Amount Paid: ₹{paidAmount.toLocaleString()}
      </div>
      <div className="mt-2 text-right text-lg font-semibold text-green-800">
        Remaining Amount: ₹{toBePaid.toLocaleString()}
      </div>
    </div>
  );
}
