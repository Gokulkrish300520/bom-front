"use client";

import { useEffect, useState } from "react";
import { saveAs } from "file-saver";
import * as XLSX from "xlsx";
import { useRouter } from "next/navigation";
import { fetchWithAuth } from "@/auth/tokenservice"; // your auth fetch helper
import toast from "react-hot-toast";
import Breadcrumb from "@/app/breadcrumb";

interface Row {
  item_name: string;
  description: string;
  item_specification: string;
  hsn_code: string;
  brand: string;
  quantity: string;
  unit_price: string;
  total_price: string;
}

interface Transaction {
  id: number;
  amount: string;
  paid_by: string;
  payment_reference_no: string;
  paid_on: string;
}

interface ImportBill {
  id: number;
  vendor: { display_name: string };
  deal_no: string;
  date: string;
  currency: string;
  payment_request: "High" | "Low";
  payment_status: string;
  payment_reference_no?: string;
  paid_by?:string;
  paid_amount: number;
  amount_to_pay: number;
  total_amount: string;
  bill_items: Row[];
  transactions: Transaction[];
}

export default function ImportBillsPage() {
  const router = useRouter();

  const [data, setData] = useState<ImportBill[]>([]);
  const [filterFrom, setFilterFrom] = useState("");
  const [filterTo, setFilterTo] = useState("");
  const [searchVendor, setSearchVendor] = useState("");
  const [searchDeal, setSearchDeal] = useState("");
  const [nextPage, setNextPage] = useState<string | null>(null);
  const [prevPage, setPrevPage] = useState<string | null>(null);
  const currencySymbols: Record<string, string> = {
    INR: "₹",
    USD: "$",
    EUR: "€",
    GBP: "£",
    JPY: "¥",
  };
  const [loading, setLoading] = useState(false);

  // Payment Modal
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedBill, setSelectedBill] = useState<ImportBill | null>(null);
  const [partialAmount, setPartialAmount] = useState<number>(0);
  const [paidBy, setPaidBy] = useState<string>("None");
  const [paymentReference, setPaymentReference] = useState<string>("");

  // Edit Transaction Modal
  const [editingTx, setEditingTx] = useState<Transaction | null>(null);
  const [editAmount, setEditAmount] = useState<number>(0);
  const [editPaidBy, setEditPaidBy] = useState<string>("None");
  const [editPaymentReference, setEditPaymentReference] = useState<string>("");

  // Open payment modal
  const openPaymentModal = (bill: ImportBill) => {
    setSelectedBill(bill);
    setPartialAmount(0);
    setPaidBy("SBI");
    setPaymentReference("");
    setShowPaymentModal(true);
  };

  // Open edit transaction modal
  const openEditTransactionModal = (tx: Transaction) => {
    setEditingTx(tx);
    setEditAmount(Number(tx.amount));
    setEditPaidBy(tx.paid_by);
    setEditPaymentReference(tx.payment_reference_no);
  };

  // Handle new transaction creation
  const handlePaymentSubmit = async () => {
    if (!selectedBill) return;

    if (!partialAmount || partialAmount <= 0) {
      toast.error("Enter a valid payment amount");
      return;
    }
    if (!paidBy || !paymentReference) {
      toast.error("Please enter payment details");
      return;
    }

    const payload = {
      transactions: [
        {
          amount: partialAmount.toString(),
          paid_by: paidBy,
          payment_reference_no: paymentReference,
        },
      ],
    };

    try {
      const res = await fetchWithAuth(
        `https://web-production-6baf3.up.railway.app/api/gsts/${selectedBill.id}/`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        }
      );

      if (!res.ok) throw new Error("Failed to record payment");

      toast.success("Payment recorded successfully!");
      setShowPaymentModal(false);
      fetchData(); // Refresh table
    } catch (err) {
      console.error(err);
      toast.error("Failed to record payment");
    }
  };

  // Handle transaction update
  const handleTransactionUpdate = async () => {
    if (!editingTx) return;

    if (!editAmount || editAmount <= 0) {
      toast.error("Enter a valid payment amount");
      return;
    }

    const payload = {
      amount: editAmount.toString(),
      paid_by: editPaidBy,
      payment_reference_no: editPaymentReference,
    };

    try {
      const res = await fetchWithAuth(
        `https://web-production-6baf3.up.railway.app/api/transactions/${editingTx.id}/`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        }
      );

      if (!res.ok) throw new Error("Failed to update transaction");

      toast.success("Transaction updated successfully!");
      setEditingTx(null);
      fetchData();
    } catch (err) {
      console.error(err);
      toast.error("Failed to update transaction");
    }
  };

  // Handle transaction delete
  const handleTransactionDelete = async (txId: number) => {
    if (!confirm("Are you sure you want to delete this transaction?")) return;

    try {
      const res = await fetchWithAuth(
        `https://web-production-6baf3.up.railway.app/api/transactions/${txId}/`,
        { method: "DELETE" }
      );

      if (!res.ok) throw new Error("Failed to delete transaction");

      toast.success("Transaction deleted successfully!");
      fetchData();
    } catch (err: any) {
      console.error(err);
      toast.error(err.message);
    }
  };

  // Fetch data from API
  const fetchData = async (url?: string) => {
    setLoading(true);
    try {
      const params = new URLSearchParams();

      if (filterFrom) params.append("start_date", filterFrom);
      if (filterTo) params.append("end_date", filterTo);
      if (searchVendor) params.append("vendor_name", searchVendor.trim());
      if (searchDeal) params.append("deal_no", searchDeal.trim());

      const fetchUrl = url || `https://web-production-6baf3.up.railway.app/api/gsts/?${params}`;
      const res = await fetchWithAuth(fetchUrl);
      if (!res.ok) throw new Error("Failed to fetch Gst bills");

      const result = await res.json();
      setData(result.results || []);
      setNextPage(result.next);
      setPrevPage(result.previous);
    } catch (err) {
      console.error(err);
      setData([]);
      setNextPage(null);
      setPrevPage(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [filterFrom, filterTo, searchVendor, searchDeal]);

  // Export to Excel
  const handleExport = () => {
    const exportData = data.map((bill) => ({
      Vendor: bill.vendor.display_name,
      "Deal Number": bill.deal_no,
      "Invoice Date": bill.date,
      "Payment Request": bill.payment_request,
      "Payment Status": bill.payment_status,
      "Payment Ref": bill.payment_reference_no || "-",
      "Paid Amount": bill.paid_amount,
      "Paid By": bill.paid_by,
      "Total Amount": parseFloat(bill.total_amount).toFixed(2)
    }));

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "GstBills");
    const buf = XLSX.write(wb, { type: "array", bookType: "xlsx" });
    saveAs(new Blob([buf]), "Gst_bills.xlsx");
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Are you sure you want to delete this entry?")) return;
    try {
      const res = await fetchWithAuth(`https://web-production-6baf3.up.railway.app/api/gsts/${id}/`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Failed to delete entry");
      toast.success("Gst Data Deleted successfully!");
      setData((prev) => prev.filter((bill) => bill.id !== id));
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  return (
    <div className="min-h-screen p-6 bg-white">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
        <Breadcrumb />
        <h1 className="text-2xl font-bold text-green-800">Gst Bills</h1>
        </div>
        <div className="flex gap-3">
          <button
            onClick={handleExport}
            className="px-4 py-2 text-white bg-green-600 rounded hover:bg-green-700"
          >
            Download Excel
          </button>
          <button
            onClick={() => router.push("/books/purchase/gst/new")}
            className="px-4 py-2 text-white bg-green-700 rounded hover:bg-green-800"
          >
            + New
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-6 items-end">
        <label className="flex flex-col">
          <span className="text-sm text-green-700">From Date</span>
          <input
            type="date"
            className="px-2 py-1 border border-green-300 rounded"
            value={filterFrom}
            onChange={(e) => setFilterFrom(e.target.value)}
          />
        </label>
        <label className="flex flex-col">
          <span className="text-sm text-green-700">To Date</span>
          <input
            type="date"
            className="px-2 py-1 border border-green-300 rounded"
            value={filterTo}
            onChange={(e) => setFilterTo(e.target.value)}
          />
        </label>
        <label className="flex flex-col">
          <span className="text-sm text-green-700">Vendor</span>
          <input
            type="text"
            placeholder="Search vendor"
            className="px-2 py-1 border border-green-300 rounded"
            value={searchVendor}
            onChange={(e) => setSearchVendor(e.target.value)}
          />
        </label>
        <label className="flex flex-col">
          <span className="text-sm text-green-700">Deal No</span>
          <input
            type="text"
            placeholder="Search deal no"
            className="px-2 py-1 border border-green-300 rounded"
            value={searchDeal}
            onChange={(e) => setSearchDeal(e.target.value)}
          />
        </label>
        <button
          onClick={() => {
            setFilterFrom("");
            setFilterTo("");
            setSearchVendor("");
            setSearchDeal("");
          }}
          className="px-2 py-1 bg-red-500 text-white rounded hover:bg-red-600"
        >
          Clear Filters
        </button>
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
                "Paid Amount",
                "Total Amount",
                "paid by",
                "Actions",
              ].map((header) => (
                <th key={header} className="p-2 text-left border border-green-200">
                  {header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={9} className="p-4 text-center text-green-600">
                  Loading...
                </td>
              </tr>
            ) : data.length > 0 ? (
              data.map((bill) => (
                <tr key={bill.id} className="border-b hover:bg-green-50">
                  <td className="p-2 border border-green-200">{bill.vendor.display_name}</td>
                  <td className="p-2 border border-green-200">{bill.deal_no}</td>
                  <td className="p-2 border border-green-200">{bill.date}</td>
                  <td className="p-2 border border-green-200">{bill.payment_request}</td>
                  <td className="p-2 border border-green-200">{bill.payment_status}</td>
                  <td className="p-2 border border-green-200 text-right">
                    ₹{bill.paid_amount.toLocaleString()}
                  </td>
                  <td className="p-2 border">
                  {bill.total_amount
                    ? `${currencySymbols[bill.currency ?? ""] ?? bill.currency ?? ""} ${parseFloat(bill.total_amount).toFixed(2)}`
                    : "-"}
                </td>
                <td className="p-2 border border-green-200">{bill.paid_by}</td>
                  <td className="flex gap-2 p-2 border border-green-200">
                    <button
                      onClick={() => router.push(`/books/purchase/gst/${bill.id}`)}
                      className="px-2 py-1 text-white bg-blue-500 rounded hover:bg-green-700"
                    >
                      View
                    </button>
                    <button
                      onClick={() => openPaymentModal(bill)}
                      className="px-2 py-1 text-white bg-purple-600 rounded hover:bg-purple-700"
                    >
                      Add Payment
                    </button>
                    <button
                      onClick={() => router.push(`/books/purchase/gst/${bill.id}/edit`)}
                      className="px-2 py-1 text-white bg-yellow-500 rounded hover:bg-yellow-600"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(bill.id)}
                      className="px-2 py-1 text-white bg-red-500 rounded hover:bg-red-600"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={9} className="p-4 text-center text-green-600">
                  No records found. Click "+ New" to add Gst bills.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Payment Modal */}
      {showPaymentModal && selectedBill && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/50 z-50">
          <div className="bg-white p-6 rounded-lg w-full max-w-md">
            <h2 className="text-lg font-bold text-green-800 mb-3">
              Add Payment for Gst
            </h2>
            <p>Total: ₹{selectedBill.total_amount.toLocaleString()}</p>
            <p className="mb-2">
              Paid: ₹{selectedBill.paid_amount.toLocaleString()} | Remaining: ₹
              {selectedBill.amount_to_pay.toLocaleString()}
            </p>

            {/* Payment Fields */}
            <label className="flex flex-col mb-3">
              <span>Amount</span>
              <input
                type="number"
                value={partialAmount}
                onChange={(e) => setPartialAmount(Number(e.target.value))}
                className="p-2 border rounded"
                max={selectedBill.amount_to_pay}
              />
            </label>

            <label className="flex flex-col mb-3">
              <span>Paid By</span>
              <select
                value={paidBy}
                onChange={(e) => setPaidBy(e.target.value)}
                className="p-2 border rounded"
              >
                <option value="SBI">SBI</option>
                <option value="ICICI">ICICI</option>
                <option value="IOB">IOB</option>
                <option value="Petty Cash">Petty Cash</option>
                <option value="None">None</option>
              </select>
            </label>

            <label className="flex flex-col mb-3">
              <span>Reference Number</span>
              <input
                type="text"
                value={paymentReference}
                onChange={(e) => setPaymentReference(e.target.value)}
                className="p-2 border rounded"
                placeholder="Enter reference no"
              />
            </label>

            {/* Transaction History */}
            <div className="mt-4 border-t pt-2">
              <h3 className="font-semibold mb-2 text-green-700 text-sm">
                Previous Transactions:
              </h3>
              {selectedBill.transactions.length > 0 ? (
                <ul className="text-sm space-y-1">
                  {selectedBill.transactions.map((tx) => (
                    <li key={tx.id} className="flex justify-between items-center">
                      <span>
                        ₹{tx.amount} — {tx.paid_by} ({tx.payment_reference_no})
                      </span>
                      <div className="flex gap-1">
                        <button
                          onClick={() => openEditTransactionModal(tx)}
                          className="px-2 py-0.5 text-white bg-blue-500 rounded text-xs hover:bg-blue-600"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleTransactionDelete(tx.id)}
                          className="px-2 py-0.5 text-white bg-red-500 rounded text-xs hover:bg-red-600"
                        >
                          Delete
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-gray-500 text-sm">No previous payments</p>
              )}
            </div>

            <div className="flex justify-end gap-2 mt-4">
              <button
                onClick={() => setShowPaymentModal(false)}
                className="px-4 py-2 bg-gray-300 rounded hover:bg-gray-400"
              >
                Cancel
              </button>
              <button
                onClick={handlePaymentSubmit}
                className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
              >
                Add Payment
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Transaction Modal */}
      {editingTx && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/50 z-50">
          <div className="bg-white p-6 rounded-lg w-full max-w-md">
            <h2 className="text-lg font-bold text-green-800 mb-3">
              Edit Transaction #{editingTx.id}
            </h2>

            <label className="flex flex-col mb-3">
              <span>Amount</span>
              <input
                type="number"
                value={editAmount}
                onChange={(e) => setEditAmount(Number(e.target.value))}
                className="p-2 border rounded"
              />
            </label>

            <label className="flex flex-col mb-3">
              <span>Paid By</span>
              <select
                value={editPaidBy}
                onChange={(e) => setEditPaidBy(e.target.value)}
                className="p-2 border rounded"
              >
                <option value="SBI">SBI</option>
                <option value="ICICI">ICICI</option>
                <option value="IOB">IOB</option>
                <option value="Petty Cash">Petty Cash</option>
                <option value="None">None</option>
              </select>
            </label>

            <label className="flex flex-col mb-3">
              <span>Reference Number</span>
              <input
                type="text"
                value={editPaymentReference}
                onChange={(e) => setEditPaymentReference(e.target.value)}
                className="p-2 border rounded"
              />
            </label>

            <div className="flex justify-end gap-2 mt-4">
              <button
                onClick={() => setEditingTx(null)}
                className="px-4 py-2 bg-gray-300 rounded hover:bg-gray-400"
              >
                Cancel
              </button>
              <button
                onClick={handleTransactionUpdate}
                className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
              >
                Update
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Pagination */}
      <div className="flex justify-between mt-4">
        <button
          disabled={!prevPage || loading}
          onClick={() => prevPage && fetchData(prevPage)}
          className="px-4 py-2 text-white bg-green-600 rounded hover:bg-green-700 disabled:opacity-50"
        >
          Previous
        </button>
        <button
          disabled={!nextPage || loading}
          onClick={() => nextPage && fetchData(nextPage)}
          className="px-4 py-2 text-white bg-green-600 rounded hover:bg-green-700 disabled:opacity-50"
        >
          Next
        </button>
      </div>
    </div>
  );
}
