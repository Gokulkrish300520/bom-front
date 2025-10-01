"use client";

import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";

// Define the type to include the ID and GST number
type PurchaseEntry = {
  id: string;
  vendor: string;
  dealNumber: string;
  item: string;
  description: string;
  itemSpecification: string;
  hsnCode: string;
  brand: string;
  quantity: number;
  unitPriceINR: number;
  total: number;
  invoiceDate: string;
  gstNumber: string; // ✅ Added GST number
  billUpload: string; // This would be a URL or filename
  paymentRequest: 'High' | 'Low';
  paymentStatus: 'Paid' | 'Unpaid' | 'Partially paid';
  paymentReferenceNo: string;
  paidBy: 'SBI' | 'ICICI' | 'IOB' | 'Petty Cash' | 'N/A';
};

const ViewPDF = ({ pdfData }: { pdfData: string }) => {
  if (!pdfData) return <span className="text-gray-500">No PDF uploaded</span>;

  return (
    <div className="mt-4">
      <h3 className="text-lg font-semibold mb-2">Bill Document</h3>
      <div className="border rounded-lg p-4">
        <object
          data={pdfData}
          type="application/pdf"
          width="100%"
          height="600px"
          className="border rounded"
        >
          <p>
            Unable to display PDF.{" "}
            <a
              href={pdfData}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:underline"
            >
              Download PDF
            </a>
          </p>
        </object>
      </div>
    </div>
  );
};

export default function ViewPurchasePage() {
  const searchParams = useSearchParams();
  const entryId = searchParams.get("id");

  const [entry, setEntry] = useState<PurchaseEntry | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (entryId) {
      const storedData = localStorage.getItem("purchaseData");
      if (storedData) {
        const data: PurchaseEntry[] = JSON.parse(storedData);
        const entryToView = data.find(e => e.id === entryId);
        if (entryToView) {
          setEntry(entryToView);
        }
      }
    }
    setLoading(false);
  }, [entryId]);

  const statusColors = {
    Paid: "bg-green-100 text-green-800",
    Unpaid: "bg-red-100 text-red-800",
    "Partially paid": "bg-yellow-100 text-yellow-800",
  };

  const requestColors = {
    High: "bg-red-100 text-red-800",
    Low: "bg-blue-100 text-blue-800",
  };

  if (loading) return <div className="p-6 text-center">Loading...</div>;

  if (!entry) {
    return (
      <div className="min-h-screen p-6 bg-white">
        <p className="text-center text-red-500">Purchase entry not found.</p>
        <div className="flex justify-center mt-6">
          <button
            onClick={() => window.location.href = "/books/purchase/gst"}
            className="px-4 py-2 text-white bg-green-600 rounded hover:bg-green-700"
          >
            Back to List
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-6 bg-gray-50">
      <div className="max-w-4xl p-8 mx-auto bg-white rounded-lg shadow-xl">
        <h1 className="mb-6 text-3xl font-bold text-green-800 border-b pb-4">
          GST Purchase Record
        </h1>

        <div className="grid grid-cols-1 gap-x-8 gap-y-6 md:grid-cols-2">
          {/* Column 1: Item & Vendor Details */}
          <div className="space-y-3">
            <h2 className="text-xl font-semibold text-green-700">Item Information</h2>
            <div><span className="font-semibold text-gray-500">Record ID:</span> <code className="text-sm text-gray-700">{entry.id}</code></div>
            <div><span className="font-semibold">Vendor:</span> {entry.vendor}</div>
            <div><span className="font-semibold">Deal Number:</span> {entry.dealNumber}</div>
            <div><span className="font-semibold">Item:</span> {entry.item}</div>
            <div><span className="font-semibold">Description:</span> {entry.description}</div>
            <div><span className="font-semibold">Specification:</span> {entry.itemSpecification}</div>
            <div><span className="font-semibold">HSN Code:</span> {entry.hsnCode}</div>
            <div><span className="font-semibold">Brand:</span> {entry.brand}</div>
            <div><span className="font-semibold">Invoice Date:</span> {entry.invoiceDate}</div>
            <div><span className="font-semibold">GST Number:</span> {entry.gstNumber || "-"}</div>
          </div>

          {/* Column 2: Financial & Payment Details */}
          <div className="space-y-3">
            <h2 className="text-xl font-semibold text-green-700">Financials & Payment</h2>
            <div><span className="font-semibold">Quantity:</span> {entry.quantity.toLocaleString('en-IN')} PCS</div>
            <div><span className="font-semibold">Unit Price (INR):</span> ₹{entry.unitPriceINR.toLocaleString('en-IN')}</div>
            <div className="p-3 text-lg font-bold bg-green-50 rounded-md"><span className="font-semibold">Total (INR):</span> ₹{entry.total.toLocaleString('en-IN')}</div>

            <div>
              <span className="font-semibold">Payment Status:</span>
              <span className={`ml-2 px-3 py-1 text-sm font-semibold rounded-full ${statusColors[entry.paymentStatus]}`}>
                {entry.paymentStatus}
              </span>
            </div>
            <div>
              <span className="font-semibold">Payment Request:</span>
              <span className={`ml-2 px-3 py-1 text-sm font-semibold rounded-full ${requestColors[entry.paymentRequest]}`}>
                {entry.paymentRequest}
              </span>
            </div>
            <div><span className="font-semibold">Payment Ref No:</span> {entry.paymentReferenceNo || "-"}</div>
            <div><span className="font-semibold">Paid By:</span> {entry.paidBy}</div>
            <div>
              <span className="font-semibold">Bill Upload:</span>
              {entry.billUpload ? (
                <span className="inline-flex items-center px-3 py-1 mt-1 text-sm font-medium text-green-700 bg-green-100 rounded-full">Uploaded</span>
              ) : (
                <span className="inline-flex items-center px-3 py-1 mt-1 text-sm font-medium text-red-700 bg-red-100 rounded-full">Not Uploaded</span>
              )}
            </div>
          </div>
        </div>

        {/* PDF Preview */}
        {entry.billUpload && (
          <div className="mt-8 border-t pt-8">
            <ViewPDF pdfData={entry.billUpload} />
          </div>
        )}

        <div className="flex justify-end pt-6 mt-8 border-t">
          <button
            onClick={() => window.location.href = "/books/purchase/gst"}
            className="px-6 py-2 text-white bg-green-600 rounded-lg hover:bg-green-700"
          >
            Back
          </button>
        </div>
      </div>
    </div>
  );
}