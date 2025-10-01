"use client";

import { useEffect, useState } from "react";
import { saveAs } from "file-saver";
import * as XLSX from "xlsx";
import { useRouter } from "next/navigation";

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
  rows: Row[];
  billUpload?: string;
  paymentRequest: "High" | "Low";
  paymentStatus: "Paid" | "Unpaid" | "Partially Paid";
  paymentRef?: string;
  paidBy: "SBI" | "ICICI" | "IOB" | "Petty Cash";
}

export default function ImportBillsPage() {
  const router = useRouter();
  const [data, setData] = useState<ImportBill[]>([]);
  const [filterFrom, setFilterFrom] = useState("");
  const [filterTo, setFilterTo] = useState("");
  const [searchVendor, setSearchVendor] = useState("");
  const [searchDeal, setSearchDeal] = useState("");

  // Load bills from localStorage
  useEffect(() => {
    const storedData = localStorage.getItem("importBillData");
    if (storedData) {
      try {
        const parsed = JSON.parse(storedData);
        setData(Array.isArray(parsed) ? parsed : []);
      } catch (err) {
        console.error("Failed to parse importBillData", err);
        setData([]);
      }
    }
  }, []);

  const handleExport = () => {
    const exportData = data.map(bill => ({
      Vendor: bill.vendor,
      "Deal Number": bill.dealNumber,
      "Invoice Date": bill.invoiceDate,
      "Payment Request": bill.paymentRequest,
      "Payment Status": bill.paymentStatus,
      "Payment Ref": bill.paymentRef || "",
      "Paid By": bill.paidBy,
      "Bill Upload": bill.billUpload || "",
      "Total Amount": bill.rows.reduce((sum, r) => sum + r.total, 0),
    }));
    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "ImportBills");
    const buf = XLSX.write(wb, { type: "array", bookType: "xlsx" });
    saveAs(new Blob([buf]), "import_bills.xlsx");
  };

  const handleDelete = (idx: number) => {
    if (confirm("Are you sure you want to delete this entry?")) {
      const newData = [...data];
      newData.splice(idx, 1);
      localStorage.setItem("importBillData", JSON.stringify(newData));
      setData(newData);
    }
  };

  const filteredData = data.filter((d) => {
    let match = true;

    if (filterFrom && filterTo) match = match && d.invoiceDate >= filterFrom && d.invoiceDate <= filterTo;
    else if (filterFrom) match = match && d.invoiceDate >= filterFrom;
    else if (filterTo) match = match && d.invoiceDate <= filterTo;

    if (searchVendor) match = match && d.vendor.toLowerCase().includes(searchVendor.toLowerCase());
    if (searchDeal) match = match && d.dealNumber.toLowerCase().includes(searchDeal.toLowerCase());

    return match;
  });

  return (
    <div className="min-h-screen p-6 bg-green-50">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold text-green-800">Import Bills</h1>
        <div className="flex gap-3">
          <button onClick={handleExport} className="px-4 py-2 text-white bg-green-600 rounded hover:bg-green-700">
            Download Excel
          </button>
          <button onClick={() => router.push("/books/purchase/import_bills/new")} className="px-4 py-2 text-white bg-green-700 rounded hover:bg-green-800">
            + New
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-6">
        <label className="flex flex-col">
          <span className="text-sm text-green-700">From Date</span>
          <input type="date" className="px-2 py-1 border border-green-300 rounded" value={filterFrom} onChange={(e) => setFilterFrom(e.target.value)} />
        </label>
        <label className="flex flex-col">
          <span className="text-sm text-green-700">To Date</span>
          <input type="date" className="px-2 py-1 border border-green-300 rounded" value={filterTo} onChange={(e) => setFilterTo(e.target.value)} />
        </label>
        <label className="flex flex-col">
          <span className="text-sm text-green-700">Vendor</span>
          <input type="text" placeholder="Search vendor" className="px-2 py-1 border border-green-300 rounded" value={searchVendor} onChange={(e) => setSearchVendor(e.target.value)} />
        </label>
        <label className="flex flex-col">
          <span className="text-sm text-green-700">Deal No</span>
          <input type="text" placeholder="Search deal no" className="px-2 py-1 border border-green-300 rounded" value={searchDeal} onChange={(e) => setSearchDeal(e.target.value)} />
        </label>
      </div>

      {/* Table */}
      <div className="overflow-x-auto border rounded shadow">
        <table className="w-full border-collapse">
          <thead className="text-green-900 bg-green-100">
            <tr>
              {[
                "Vendor",
                "Deal No",
                "Invoice Date",
                "Payment Request",
                "Payment Status",
                "Payment Ref",
                "Paid By",
                "Bill Upload",
                "Total Amount (USD)",
                "Actions",
              ].map((header) => (
                <th key={header} className="p-2 text-left border border-green-200">{header}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filteredData.length > 0 ? filteredData.map((bill, idx) => (
              <tr key={idx} className="border-b hover:bg-green-50">
                <td className="p-2 border border-green-200">{bill.vendor}</td>
                <td className="p-2 border border-green-200">{bill.dealNumber}</td>
                <td className="p-2 border border-green-200">{bill.invoiceDate}</td>
                <td className="p-2 border border-green-200">{bill.paymentRequest}</td>
                <td className="p-2 border border-green-200">{bill.paymentStatus}</td>
                <td className="p-2 border border-green-200">{bill.paymentRef}</td>
                <td className="p-2 border border-green-200">{bill.paidBy}</td>
                <td className="p-2 border border-green-200">{bill.billUpload}</td>
                <td className="p-2 border border-green-200">{bill.rows.reduce((sum, r) => sum + r.total, 0).toFixed(2)}</td>
                <td className="flex gap-2 p-2 border border-green-200">
                  <button onClick={() => router.push(`/books/purchase/import_bills/view?index=${idx}`)} className="px-2 py-1 text-white bg-green-600 rounded hover:bg-green-700">View</button>
                  <button onClick={() => router.push(`/books/purchase/import_bills/edit?index=${idx}`)} className="px-2 py-1 text-white bg-yellow-500 rounded hover:bg-yellow-600">Edit</button>
                  <button onClick={() => handleDelete(idx)} className="px-2 py-1 text-white bg-red-500 rounded hover:bg-red-600">Delete</button>
                </td>
              </tr>
            )) : (
              <tr>
                <td colSpan={10} className="p-4 text-center text-green-600">
                  No records found. Click "+ New" to add import bills.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}