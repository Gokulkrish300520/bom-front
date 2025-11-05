"use client";

import { useEffect, useState } from "react";
import { saveAs } from "file-saver";
import * as XLSX from "xlsx";
import { useRouter } from "next/navigation";
import { fetchWithAuth } from "@/auth/tokenservice";
import toast from "react-hot-toast";
import Breadcrumb from "@/app/breadcrumb";

interface Transaction {
  id: number;
  amount: string;
  paid_by: string;
  payment_reference_no: string;
  paid_on: string;
}

interface BillOrder {
  id: number;
  vendor: string;
  deal_no?: string;
  bill_number: string;
  bill_date: string;
  payment_status: string;
  paid_by?: string;
  payment_reference_no?: string;
  total_amount: number;
  paid_amount: number;
  amount_to_pay: number;
  transactions: Transaction[];
}

export default function BillOrdersPage() {
  const router = useRouter();
  const [data, setData] = useState<BillOrder[]>([]);
  const [filterFrom, setFilterFrom] = useState("");
  const [filterTo, setFilterTo] = useState("");
  const [searchVendor, setSearchVendor] = useState("");
  const [searchDeal, setSearchDeal] = useState("");
  const [nextPage, setNextPage] = useState<string | null>(null);
  const [prevPage, setPrevPage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Payment Modal
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedBill, setSelectedBill] = useState<BillOrder | null>(null);
  const [partialAmount, setPartialAmount] = useState<number>(0);
  const [paidBy, setPaidBy] = useState<string>("None");
  const [paymentReference, setPaymentReference] = useState<string>("");

  // Edit Transaction Modal
  const [editingTx, setEditingTx] = useState<Transaction | null>(null);
  const [editAmount, setEditAmount] = useState<number>(0);
  const [editPaidBy, setEditPaidBy] = useState<string>("None");
  const [editPaymentReference, setEditPaymentReference] = useState<string>("");

  // Open payment modal
  const openPaymentModal = (bill: BillOrder) => {
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
        `https://web-production-6baf3.up.railway.app/api/billorders/${selectedBill.id}/`,
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

  // Fetch Bill Orders
  const fetchData = async (url?: string) => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filterFrom) params.append("start_date", filterFrom);
      if (filterTo) params.append("end_date", filterTo);
      if (searchVendor) params.append("vendor_name", searchVendor.trim());
      if (searchDeal) params.append("deal_no", searchDeal.trim());

      const fetchUrl =
        url || `https://web-production-6baf3.up.railway.app/api/billorders/?${params}`;
      const res = await fetchWithAuth(fetchUrl);
      if (!res.ok) throw new Error("Failed to fetch bill orders");

      const result = await res.json();
      setData(result.results || []);
      setNextPage(result.next);
      setPrevPage(result.previous);
    } catch (err) {
      console.error(err);
      toast.error("Failed to fetch bill orders");
      setData([]);
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
      Vendor: bill.vendor,
      "Deal Number": bill.deal_no || "-",
      "Bill Number": bill.bill_number,
      "Invoice Date": bill.bill_date,
      Status: bill.payment_status,
      "Paid Amount": bill.paid_amount,
      "Total Amount": bill.total_amount,
    }));
    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "BillOrders");
    const buf = XLSX.write(wb, { type: "array", bookType: "xlsx" });
    saveAs(new Blob([buf]), "bill_orders.xlsx");
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Are you sure you want to delete this bill order?")) return;
    try {
      const res = await fetchWithAuth(
        `https://web-production-6baf3.up.railway.app/api/billorders/${id}/`,
        { method: "DELETE" }
      );
      if (!res.ok) throw new Error("Failed to delete bill order");
      toast.success("Deleted successfully!");
      setData((prev) => prev.filter((bill) => bill.id !== id));
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const formatDate = (str: string) => {
    try {
      return new Date(str).toLocaleDateString();
    } catch {
      return str;
    }
  };

  return (
    <div className="min-h-screen p-6 bg-white">
      <div className="flex items-center justify-between mb-4">
        <div>
          <Breadcrumb />
          <h1 className="text-2xl font-bold text-green-800">Bill Orders</h1>
        </div>
        <div className="flex gap-3">
          <button
            onClick={handleExport}
            className="px-4 py-2 text-white bg-green-600 rounded hover:bg-green-700"
          >
            Download Excel
          </button>
          <button
            onClick={() => router.push("/books/purchase/bill_order/new")}
            className="px-4 py-2 text-white bg-green-700 rounded hover:bg-green-800"
          >
            + New
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-6 items-end">
        <label className="flex flex-col">
          <span>From Date</span>
          <input
            type="date"
            className="px-2 py-1 border rounded"
            value={filterFrom}
            onChange={(e) => setFilterFrom(e.target.value)}
          />
        </label>
        <label className="flex flex-col">
          <span>To Date</span>
          <input
            type="date"
            className="px-2 py-1 border rounded"
            value={filterTo}
            onChange={(e) => setFilterTo(e.target.value)}
          />
        </label>
        <label className="flex flex-col">
          <span>Vendor</span>
          <input
            type="text"
            className="px-2 py-1 border rounded"
            placeholder="Search vendor"
            value={searchVendor}
            onChange={(e) => setSearchVendor(e.target.value)}
          />
        </label>
        <label className="flex flex-col">
          <span>Deal No</span>
          <input
            type="text"
            className="px-2 py-1 border rounded"
            placeholder="Search deal no"
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
          className="px-3 py-1 bg-red-500 text-white rounded"
        >
          Clear Filters
        </button>
      </div>

      {/* Table */}
      <div className="overflow-x-auto border rounded shadow">
        <table className="w-full border-collapse">
          <thead className="bg-green-100 text-green-900">
            <tr>
              {[
                "Vendor",
                "Bill No",
                "Date",
                "Status",
                "Paid Amount",
                "Total",
                "Actions",
              ].map((header) => (
                <th key={header} className="p-2 border border-green-200 text-left">
                  {header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={7} className="p-4 text-center text-green-600">
                  Loading...
                </td>
              </tr>
            ) : data.length > 0 ? (
              data.map((bill) => (
                <tr key={bill.id} className="border-b hover:bg-green-50">
                  <td className="p-2 border border-green-200">{bill.vendor}</td>
                  <td className="p-2 border border-green-200">{bill.bill_number}</td>
                  <td className="p-2 border border-green-200">
                    {formatDate(bill.bill_date)}
                  </td>
                  <td className="p-2 border border-green-200">
                    {bill.payment_status}
                  </td>
                  <td className="p-2 border border-green-200 text-right">
                    ₹{bill.paid_amount.toLocaleString()}
                  </td>
                  <td className="p-2 border border-green-200 text-right">
                    ₹{bill.total_amount.toLocaleString()}
                  </td>
                  <td className="flex gap-2 p-2 border border-green-200">
                    <button
                      onClick={() =>
                        router.push(`/books/purchase/bill_order/${bill.id}`)
                      }
                      className="px-2 py-1 text-white bg-blue-500 rounded hover:bg-blue-600"
                    >
                      View
                    </button>
                    
                    <button
                      onClick={() =>
                        router.push(`/books/purchase/bill_order/${bill.id}/edit`)
                      }
                      className="px-2 py-1 text-white bg-yellow-500 rounded hover:bg-yellow-600"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => openPaymentModal(bill)}
                      className="px-2 py-1 text-white bg-purple-600 rounded hover:bg-purple-700"
                    >
                      Add Payment
                    </button>
                    <button onClick={() => handleDelete(bill.id)} className="px-2 py-1 text-white bg-red-500 rounded hover:bg-red-600" > Delete </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={7} className="p-4 text-center text-green-600">
                  No records found.
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
              Add Payment for {selectedBill.bill_number}
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
    </div>
  );
}
