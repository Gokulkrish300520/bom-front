"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { fetchWithAuth } from "@/auth/tokenservice";
import toast from "react-hot-toast";
import Breadcrumb from "@/app/breadcrumb";

interface DutyItem {
  id: number;
  item_name: string;
  description: string;
  item_specification: string;
  hsn_code: string;
  brand: string;
  quantity: string | number;
  unit_price: string | number;
  total_price: string | number;
  assessable_value: string | number;
  igst: string | number;
  social_welfare: string | number;
  cess: string | number;
  duty_amount: string | number;
  addl_duty: string | number;
  total_duty: string | number;
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

interface Duty {
  id: number;
  vendor: string;
  deal_no: string;
  airway_bill: string;
  date: string;
  currency: string;
  total_amount: string | number;
  paid_amount: string | number;
  amount_to_pay: string | number;
  payment_request: string;
  payment_reference_no: string;
  payment_status: string;
  paid_by: string;
  duty_items: DutyItem[];
  transactions?: Transaction[];
  created_by: string;
  created_at: string;
}

const currencySymbols: Record<string, string> = {
  INR: "₹",
  USD: "$",
  EUR: "€",
  GBP: "£",
  JPY: "¥",
};

export default function DutyViewPage() {
  const router = useRouter();
  const params = useParams();
  const [duty, setDuty] = useState<Duty | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDuty = async () => {
      try {
        if (!params?.id) return;
        const id = Array.isArray(params.id) ? params.id[0] : params.id;
        const res = await fetchWithAuth(`https://web-production-6baf3.up.railway.app/api/duties/${id}/`);
        if (!res.ok) throw new Error("Failed to fetch duty");
        const data = await res.json();
        setDuty(data);
      } catch (err) {
        console.error(err);
        toast.error("Failed to load duty details.");
      } finally {
        setLoading(false);
      }
    };

    fetchDuty();
  }, [params?.id]);

  if (loading) return <p className="p-6 text-green-700">Loading...</p>;
  if (!duty) return <p className="p-6 text-red-700">Duty not found.</p>;

  const symbol = currencySymbols[duty.currency] ?? duty.currency;
  const fmt = (v: any) => (isNaN(Number(v)) ? "-" : Number(v).toFixed(2));

  return (
    <div className="min-h-screen p-6 bg-gray-50">
      <Breadcrumb />

      {/* Back Button */}
      <button
        onClick={() => router.back()}
        className="flex items-center mb-6 px-3 py-2 bg-green-100 text-green-700 rounded hover:bg-green-200 transition"
      >
        <ArrowLeft className="mr-2" /> Back
      </button>

      {/* Duty Info */}
      <h1 className="mb-6 text-3xl font-bold text-green-900">Duty Details</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8 bg-white p-6 rounded shadow">
        <div>
          <p><span className="font-semibold">Vendor:</span> {duty.vendor}</p>
          <p><span className="font-semibold">Deal No:</span> {duty.deal_no}</p>
          <p><span className="font-semibold">Airway Bill:</span> {duty.airway_bill || "-"}</p>
          <p><span className="font-semibold">Date:</span> {duty.date}</p>
        </div>
        <div>
          <p><span className="font-semibold">Currency:</span> {duty.currency}</p>
          <p><span className="font-semibold">Total Amount:</span> {symbol} {fmt(duty.total_amount)}</p>
          <p><span className="font-semibold">Paid Amount:</span> {symbol} {fmt(duty.paid_amount)}</p>
          <p><span className="font-semibold">Amount to Pay:</span> {symbol} {fmt(duty.amount_to_pay)}</p>
          <p><span className="font-semibold">Payment Request:</span> {duty.payment_request}</p>
          <p><span className="font-semibold">Payment Status:</span> {duty.payment_status}</p>
          <p><span className="font-semibold">Paid By:</span> {duty.paid_by}</p>
          <p><span className="font-semibold">Payment Reference:</span> {duty.payment_reference_no || "-"}</p>
        </div>
      </div>

      {/* Duty Items Table */}
      <div className="overflow-x-auto rounded shadow mb-8">
        <table className="min-w-full divide-y divide-green-200 table-auto">
          <thead className="bg-green-100 sticky top-0">
            <tr>
              {["Item", "Description", "Specification", "HSN Code", "Brand", "Qty", "Unit Price", "Total Price"].map((header) => (
                <th key={header} className="px-4 py-2 text-left text-green-900 font-semibold">{header}</th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-green-200">
            {duty.duty_items.map((item) => (
              <tr key={item.id} className="hover:bg-green-50">
                <td className="px-4 py-2">{item.item_name}</td>
                <td className="px-4 py-2">{item.description}</td>
                <td className="px-4 py-2">{item.item_specification}</td>
                <td className="px-4 py-2">{item.hsn_code}</td>
                <td className="px-4 py-2">{item.brand}</td>
                <td className="px-4 py-2 text-center">{item.quantity}</td>
                <td className="px-4 py-2">{symbol} {fmt(item.unit_price)}</td>
                <td className="px-4 py-2 font-semibold text-green-900">{symbol} {fmt(item.total_price)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Transactions Table */}
      {duty.transactions && duty.transactions.length > 0 && (
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
              {duty.transactions.map((txn) => (
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
        Grand Total: {symbol} {fmt(duty.total_amount)}
      </div>
      <div className="mt-2 text-right text-lg font-semibold text-green-800">
        Amount Paid: {symbol} {fmt(duty.paid_amount)}
      </div>
      <div className="mt-2 text-right text-lg font-semibold text-green-800">
        Remaining Amount: {symbol} {fmt(duty.amount_to_pay)}
      </div>
    </div>
  );
}
