"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { fetchWithAuth } from "@/auth/tokenservice";
import toast from "react-hot-toast";
import Breadcrumb from "@/app/breadcrumb";

interface FreightItem {
  id: number;
  item_name: string;
  description: string;
  item_specification: string;
  brand: string;
  hsn_code: string;
  quantity: string;
  unit_price: string;
  total_price: string;
  sf_number: string;
  weight: string;
  freight_type: string;
}

interface Freight {
  id: number;
  vendor: {
    id: number;
    display_name: string;
  };
  deal_no: string;
  date: string;
  currency: string;
  total_amount: string;
  items: FreightItem[];
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

export default function FreightViewPage() {
  const router = useRouter();
  const params = useParams();
  const [freight, setFreight] = useState<Freight | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchFreight = async () => {
      try {
        if (!params?.id) return;

        const id = Array.isArray(params.id) ? params.id[0] : params.id;
        const res = await fetchWithAuth(
          `https://web-production-6baf3.up.railway.app/api/freights/${id}/`
        );

        if (!res.ok) throw new Error(`Failed to fetch freight ${id}`);
        const data = await res.json();
        setFreight(data);
      } catch (err) {
        console.error("Fetch error:", err);
        toast.error("Failed to load freight details.");
      } finally {
        setLoading(false);
      }
    };

    fetchFreight();
  }, [params?.id]);

  if (loading) return <p className="p-6 text-green-700">Loading...</p>;
  if (!freight) return <p className="p-6 text-red-700">Freight not found.</p>;

  const symbol = currencySymbols[freight.currency] ?? freight.currency;

  return (
    <div className="min-h-screen p-6 bg-gray-50">
      {/* Breadcrumb and Back */}
      <div><Breadcrumb/></div>
      <button
        onClick={() => router.back()}
        className="flex items-center mb-6 px-3 py-2 bg-green-100 text-green-700 rounded hover:bg-green-200 transition"
      >
        <ArrowLeft className="mr-2" /> Back
      </button>

      {/* Page Title */}
      <h1 className="mb-6 text-3xl font-bold text-green-900">Freight Details</h1>

      {/* Freight Info Card */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8 bg-white p-6 rounded shadow">
        <div>
          <p><span className="font-semibold">Vendor:</span> {freight.vendor.display_name}</p>
          <p><span className="font-semibold">Deal Number:</span> {freight.deal_no}</p>
          <p><span className="font-semibold">Date:</span> {freight.date}</p>
        </div>
        <div>
          <p><span className="font-semibold">Currency:</span> {freight.currency}</p>
          <p><span className="font-semibold">Created By:</span> {freight.created_by}</p>
          <p><span className="font-semibold">Created At:</span> {new Date(freight.created_at).toLocaleDateString()}</p>
          <p><span className="font-semibold">Total Amount:</span> {symbol} {Number(freight.total_amount).toFixed(2)}</p>
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
                "SF_NO",
                "Weight",
                "Freight Type",
                "Qty/PCS",
                "Unit Price",
                "Total Price",
              ].map((header) => (
                <th
                  key={header}
                  className="px-4 py-2 text-left text-green-900 font-semibold"
                >
                  {header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-green-200">
            {freight.items.map((row) => (
              <tr key={row.id} className="hover:bg-green-50 transition-colors">
                <td className="px-4 py-2">{row.item_name}</td>
                <td className="px-4 py-2">{row.description}</td>
                <td className="px-4 py-2">{row.item_specification}</td>
                <td className="px-4 py-2">{row.hsn_code}</td>
                <td className="px-4 py-2">{row.brand}</td>
                <td className="px-4 py-2">{row.sf_number}</td>
                <td className="px-4 py-2">{row.weight}</td>
                <td className="px-4 py-2">{row.freight_type}</td>
                <td className="px-4 py-2">{Number(row.quantity)}</td>
                <td className="px-4 py-2">
                  {symbol} {Number(row.unit_price).toFixed(2)}
                </td>
                <td className="px-4 py-2 font-semibold text-green-900">
                  {symbol} {Number(row.total_price).toFixed(2)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Total */}
      <div className="mt-6 text-right text-xl font-bold text-green-900">
        Total Amount: {symbol} {Number(freight.total_amount).toFixed(2)}
      </div>
    </div>
  );
}
