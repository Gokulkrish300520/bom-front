"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Plus, ArrowLeft } from "lucide-react";

// Define the structure of a single row/item
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

// Define the full import bill structure
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

export default function NewImportBillPage() {
  const router = useRouter();

  const [vendor, setVendor] = useState("");
  const [dealNumber, setDealNumber] = useState("");
  const [invoiceDate, setInvoiceDate] = useState("");
  const [billUpload, setBillUpload] = useState<File | null>(null);
  const [paymentRequest, setPaymentRequest] = useState<"High" | "Low">("Low");
  const [paymentStatus, setPaymentStatus] = useState<"Paid" | "Unpaid" | "Partially Paid">("Unpaid");
  const [paymentRef, setPaymentRef] = useState("");
  const [paidBy, setPaidBy] = useState<"SBI" | "ICICI" | "IOB" | "Petty Cash">("SBI");

  const [rows, setRows] = useState<Row[]>([
    { item: "", description: "", specification: "", hsn: "", brand: "", qty: 1, unitPrice: 0, total: 0 },
  ]);

  // Load from localStorage if exists
  useEffect(() => {
    const savedData = localStorage.getItem("importBillData");
    if (savedData) {
      try {
        const parsed: ImportBill[] = JSON.parse(savedData);
        if (parsed.length > 0) {
          const last = parsed[parsed.length - 1];
          setVendor(last.vendor);
          setDealNumber(last.dealNumber);
          setInvoiceDate(last.invoiceDate);
          setBillUpload(last.billUpload ? new File([], last.billUpload) : null);
          setPaymentRequest(last.paymentRequest);
          setPaymentStatus(last.paymentStatus);
          setPaymentRef(last.paymentRef || "");
          setPaidBy(last.paidBy);
          setRows(last.rows || [
            { item: "", description: "", specification: "", hsn: "", brand: "", qty: 1, unitPrice: 0, total: 0 },
          ]);
        }
      } catch (err) {
        console.error("Failed to parse importBillData", err);
      }
    }
  }, []);

  // Auto-save to localStorage
  useEffect(() => {
    const billToSave: ImportBill = {
      vendor,
      dealNumber,
      invoiceDate,
      billUpload: billUpload?.name,
      paymentRequest,
      paymentStatus,
      paymentRef,
      paidBy,
      rows,
    };
    localStorage.setItem("importBillData", JSON.stringify([billToSave]));
  }, [vendor, dealNumber, invoiceDate, billUpload, paymentRequest, paymentStatus, paymentRef, paidBy, rows]);

  // Handle changes to row fields safely
  const handleRowChange = <K extends keyof Row>(index: number, field: K, value: Row[K]) => {
    const updatedRows = [...rows];
    updatedRows[index][field] = value;
    updatedRows[index].total = updatedRows[index].qty * updatedRows[index].unitPrice;
    setRows(updatedRows);
  };

  const addRow = () => {
    setRows([
      ...rows,
      { item: "", description: "", specification: "", hsn: "", brand: "", qty: 1, unitPrice: 0, total: 0 },
    ]);
  };

  const removeRow = (index: number) => {
    if (rows.length > 1) {
      setRows(rows.filter((_, i) => i !== index));
    }
  };

  const totalAmount = rows.reduce((sum, r) => sum + r.total, 0);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    alert("Bill saved in localStorage ✅");
    router.push("/books/purchase/import_bills");
  };

  return (
    <div className="min-h-screen p-6 bg-green-50">
      <button onClick={() => router.back()} className="flex items-center mb-4 text-green-700 hover:text-green-900">
        <ArrowLeft className="mr-2" /> Back
      </button>

      <h1 className="mb-6 text-2xl font-bold text-green-900">New Import Bill</h1>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Vendor & Deal Number */}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div>
            <label className="block mb-1 font-semibold text-green-700">Vendor</label>
            <input type="text" value={vendor} onChange={(e) => setVendor(e.target.value)} className="w-full p-2 border border-green-300 rounded" required />
          </div>
          <div>
            <label className="block mb-1 font-semibold text-green-700">Deal Number</label>
            <input type="text" value={dealNumber} onChange={(e) => setDealNumber(e.target.value)} className="w-full p-2 border border-green-300 rounded" required />
          </div>
        </div>

        {/* Invoice Date & Bill Upload */}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div>
            <label className="block mb-1 font-semibold text-green-700">Invoice Date</label>
            <input type="date" value={invoiceDate} onChange={(e) => setInvoiceDate(e.target.value)} className="w-full p-2 border border-green-300 rounded" required />
          </div>
          <div>
            <label className="block mb-1 font-semibold text-green-700">Bill Upload</label>
            <input type="file" onChange={(e) => setBillUpload(e.target.files?.[0] || null)} className="w-full p-2 border border-green-300 rounded" />
            {billUpload && <p className="mt-1 text-sm text-green-800">{billUpload.name}</p>}
          </div>
        </div>

        {/* Payment Request & Status */}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <div>
            <label className="block mb-1 font-semibold text-green-700">Payment Request</label>
            <select value={paymentRequest} onChange={(e) => setPaymentRequest(e.target.value as "High" | "Low")} className="w-full p-2 border border-green-300 rounded">
              <option>High</option>
              <option>Low</option>
            </select>
          </div>
          <div>
            <label className="block mb-1 font-semibold text-green-700">Payment Status</label>
            <select value={paymentStatus} onChange={(e) => setPaymentStatus(e.target.value as "Paid" | "Unpaid" | "Partially Paid")} className="w-full p-2 border border-green-300 rounded">
              <option>Paid</option>
              <option>Unpaid</option>
              <option>Partially Paid</option>
            </select>
          </div>
          <div>
            <label className="block mb-1 font-semibold text-green-700">Paid By</label>
            <select value={paidBy} onChange={(e) => setPaidBy(e.target.value as "SBI" | "ICICI" | "IOB" | "Petty Cash")} className="w-full p-2 border border-green-300 rounded">
              <option>SBI</option>
              <option>ICICI</option>
              <option>IOB</option>
              <option>Petty Cash</option>
            </select>
          </div>
        </div>

        <div>
          <label className="block mb-1 font-semibold text-green-700">Payment Reference No</label>
          <input type="text" value={paymentRef} onChange={(e) => setPaymentRef(e.target.value)} className="w-full p-2 border border-green-300 rounded" />
        </div>

        {/* Items Table */}
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
                <th className="p-2 border border-green-300">Remove</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row, index) => (
                <tr key={index}>
                  <td className="p-2 border border-green-300">
                    <input type="text" value={row.item} onChange={(e) => handleRowChange(index, "item", e.target.value)} className="w-full p-1 border border-green-200 rounded" />
                  </td>
                  <td className="p-2 border border-green-300">
                    <input type="text" value={row.description} onChange={(e) => handleRowChange(index, "description", e.target.value)} className="w-full p-1 border border-green-200 rounded" />
                  </td>
                  <td className="p-2 border border-green-300">
                    <input type="text" value={row.specification} onChange={(e) => handleRowChange(index, "specification", e.target.value)} className="w-full p-1 border border-green-200 rounded" />
                  </td>
                  <td className="p-2 border border-green-300">
                    <input type="text" value={row.hsn} onChange={(e) => handleRowChange(index, "hsn", e.target.value)} className="w-full p-1 border border-green-200 rounded" />
                  </td>
                  <td className="p-2 border border-green-300">
                    <input type="text" value={row.brand} onChange={(e) => handleRowChange(index, "brand", e.target.value)} className="w-full p-1 border border-green-200 rounded" />
                  </td>
                  <td className="p-2 border border-green-300">
                    <input type="number" min={1} value={row.qty} onChange={(e) => handleRowChange(index, "qty", Number(e.target.value))} className="w-full p-1 border border-green-200 rounded" />
                  </td>
                  <td className="p-2 border border-green-300">
                    <input type="number" min={0} value={row.unitPrice} onChange={(e) => handleRowChange(index, "unitPrice", Number(e.target.value))} className="w-full p-1 border border-green-200 rounded" />
                  </td>
                  <td className="p-2 font-semibold text-green-900 border border-green-300">{row.total.toFixed(2)}</td>
                  <td className="p-2 text-center border border-green-300">
                    {rows.length > 1 && <button type="button" onClick={() => removeRow(index)} className="text-red-600 hover:text-red-800">X</button>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <button type="button" onClick={addRow} className="flex items-center px-4 py-2 font-semibold text-green-800 bg-green-200 rounded hover:bg-green-300">
          <Plus className="mr-2" /> Add Row
        </button>

        <div className="text-lg font-bold text-right text-green-900">Total Amount: USD {totalAmount.toFixed(2)}</div>

        <button type="submit" className="px-6 py-2 text-white bg-green-700 rounded hover:bg-green-800">Save Bill</button>
      </form>
    </div>
  );
}