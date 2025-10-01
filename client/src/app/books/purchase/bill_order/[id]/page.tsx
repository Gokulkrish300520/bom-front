"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { FaDownload } from "react-icons/fa";

type VendorType = {
  id: number;
  display_name: string;
};

type ItemRow = {
  id: number;
  item: string;
  qty: number;
  rate: number;
  amount: number;
};

type BillOrder = {
  id: string;
  vendor: VendorType;
  bill_number: string;
  bill_date: string;
  deal_number?: string;
  total_amount: number;
  country?: string;
  vendor_address?: string;
  vendor_state?: string;
  items: ItemRow[];
  exchange_rate?: number;
  created_at: string;
};

interface Props {
  params: { id: string };
}

export default function BillOrderDetailPage({ params }: Props) {
  const router = useRouter();
  const { id } = params;

  const [bill, setBill] = useState<BillOrder | null>(null);

  useEffect(() => {
    if (!id) return;
    const stored = localStorage.getItem("bill_orders");
    const bills = stored ? JSON.parse(stored) : [];
    const found = bills.find((b: BillOrder) => b.id === id);
    if (found) setBill(found);
  }, [id]);

  const formatDate = (str: string) => {
    try {
      return new Date(str).toLocaleDateString();
    } catch {
      return str;
    }
  };

  const downloadBill = () => {
    const element = document.getElementById("bill-detail");
    if (!element) return;

    import("html2canvas").then((html2canvas) => {
      html2canvas.default(element).then((canvas) => {
        const imgData = canvas.toDataURL("image/png");
        import("jspdf").then((jsPDF) => {
          const pdf = new jsPDF.default("p", "pt", "a4");
          const imgProps = pdf.getImageProperties(imgData);
          const pdfWidth = pdf.internal.pageSize.getWidth();
          const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
          pdf.addImage(imgData, "PNG", 0, 0, pdfWidth, pdfHeight);
          pdf.save(`${bill?.bill_number || "bill"}.pdf`);
        });
      });
    });
  };

  if (!bill) return <p className="p-4">Loading bill details...</p>;

  return (
    <div className="min-h-screen p-6 bg-[#f3fdf5]">
      <div className="max-w-4xl p-6 mx-auto bg-white rounded shadow">
        <div id="bill-detail">
          <h1 className="mb-4 text-2xl font-bold text-green-900">Bill Order Details</h1>
          <div className="mb-4 space-y-2">
            <p><strong>Bill Number:</strong> {bill.bill_number}</p>
            <p><strong>Deal Number:</strong> {bill.deal_number || "-"}</p>
            <p><strong>Date:</strong> {formatDate(bill.bill_date)}</p>
            <p><strong>Vendor:</strong> {bill.vendor.display_name}</p>
            <p><strong>Country:</strong> {bill.country || "-"}</p>
          </div>

          <table className="w-full border border-collapse border-gray-300">
            <thead className="bg-green-100">
              <tr>
                <th className="p-2 border">Item</th>
                <th className="p-2 border">Qty</th>
                <th className="p-2 border">Rate</th>
                <th className="p-2 border">Amount</th>
              </tr>
            </thead>
            <tbody>
              {bill.items.map((row) => (
                <tr key={row.id}>
                  <td className="p-2 border">{row.item}</td>
                  <td className="p-2 text-center border">{row.qty}</td>
                  <td className="p-2 text-right border">₹{row.rate}</td>
                  <td className="p-2 text-right border">₹{row.amount.toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="flex justify-between mt-4">
            <p><strong>Total Amount:</strong> ₹{bill.total_amount.toLocaleString()}</p>
            {bill.exchange_rate && (
              <p><strong>Exchange Rate:</strong> {bill.exchange_rate}</p>
            )}
          </div>
        </div>

        <div className="flex gap-4 mt-6">
          <button
            onClick={downloadBill}
            className="flex items-center gap-2 px-4 py-2 text-white bg-green-600 rounded hover:bg-green-700"
          >
            <FaDownload /> Download
          </button>
          <button
            onClick={() => router.back()}
            className="px-4 py-2 text-gray-700 border rounded hover:bg-gray-100"
          >
            Back
          </button>
        </div>
      </div>
    </div>
  );
}