"use client";

import { useEffect, useState, useMemo } from "react";
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

type DutyEntry = {
  id: number;
  vendor: string;
  dealNumber: string;
  airwayBillNumber?: string;
  date: string;
  currency: string;
  payment_status: string;
  paid_by?: string;
  payment_reference_no?: string;
  total_amount: string;
  created_at:string;
  paid_amount: number;
  amount_to_pay: number;
  transactions: Transaction[];
};

export default function DutyPage() {
  const router = useRouter();
  const [data, setData] = useState<DutyEntry[]>([]);
  const [filterFrom, setFilterFrom] = useState("");
  const [filterTo, setFilterTo] = useState("");
  const [searchVendor, setSearchVendor] = useState("");
  const [searchDeal, setSearchDeal] = useState("");
  const [nextPage, setNextPage] = useState<string | null>(null);
  const [prevPage, setPrevPage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Payment Modal
    const [showPaymentModal, setShowPaymentModal] = useState(false);
    const [selectedBill, setSelectedBill] = useState<DutyEntry | null>(null);
    const [partialAmount, setPartialAmount] = useState<number>(0);
    const [paidBy, setPaidBy] = useState<string>("None");
    const [paymentReference, setPaymentReference] = useState<string>("");
  
    // Edit Transaction Modal
    const [editingTx, setEditingTx] = useState<Transaction | null>(null);
    const [editAmount, setEditAmount] = useState<number>(0);
    const [editPaidBy, setEditPaidBy] = useState<string>("None");
    const [editPaymentReference, setEditPaymentReference] = useState<string>("");

    // Open payment modal
  const openPaymentModal = (bill: DutyEntry) => {
    setSelectedBill(bill);
    setPartialAmount(0);
    setPaidBy("None");
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

  const currencySymbols: Record<string, string> = {
    INR: "₹",
    USD: "$",
    EUR: "€",
    GBP: "£",
    JPY: "¥",
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
        `https://web-production-6baf3.up.railway.app/api/duties/${selectedBill.id}/`,
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

  const fetchData = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filterFrom) params.append("start_date", filterFrom);
      if (filterTo) params.append("end_date", filterTo);
      if (searchVendor) params.append("vendor_name", searchVendor);
      if (searchDeal) params.append("deal_no", searchDeal);

      const res = await fetchWithAuth(
        `https://web-production-6baf3.up.railway.app/api/duties/?${params.toString()}`
      );
      const json = await res.json();

      const mappedData: DutyEntry[] = (json.results || []).map((item: any) => ({
        id: item.id,
        vendor: item.vendor,
        dealNumber: item.deal_no,
        airwayBillNumber: item.airway_bill ?? "-",
        total_amount: item.total_amount ?? "0",
        currency: item.currency,
        date: item.date,
        payment_status: item.payment_status,
        paid_by: item.paid_by,
        paid_amount: item.paid_amount,
        amount_to_pay:item.amount_to_pay,
        duty_items_count: item.duty_items?.length ?? 0,
        created_at: item.created_at ?? "-",
        transactions: item.transactions || [],
      }));

      setData(mappedData);
    } catch (err) {
      toast.error("Failed to fetch duty data");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [filterFrom, filterTo, searchVendor, searchDeal]);

  const handleExport = () => {
    const exportData = data.map((row) => ({
      Vendor: row.vendor,
      "Deal Number": row.dealNumber,
      "Airway Bill": row.airwayBillNumber,
      Date: row.date,
      "Total Amount": row.total_amount,
      Currency: row.currency,
    }));

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Duty");
    const buf = XLSX.write(wb, { type: "array", bookType: "xlsx" });
    saveAs(new Blob([buf]), "duty_records.xlsx");
  };

  const handleDelete = async (id: number) => {
    if (confirm("Are you sure you want to delete this entry?")) {
      try {
        const res = await fetchWithAuth(
          `https://web-production-6baf3.up.railway.app/api/duties/${id}/`,
          { method: "DELETE" }
        );
        if (!res.ok) throw new Error("Delete failed");
        toast.success("Duty Data Deleted");
        fetchData();
      } catch (err) {
        toast.error("Delete failed");
      }
    }
  };

  // --- Total Summary ---
  const totalSum = useMemo(() => {
    const totalINR = data
      .filter((d) => d.currency === "INR")
      .reduce((acc, d) => acc + parseFloat(d.total_amount || "0"), 0);
    const totalUSD = data
      .filter((d) => d.currency === "USD")
      .reduce((acc, d) => acc + parseFloat(d.total_amount || "0"), 0);
    return { INR: totalINR, USD: totalUSD };
  }, [data]);

  return (
    <div className="min-h-screen p-6 bg-white">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <Breadcrumb />
          <h1 className="text-3xl font-semibold text-green-700">Duty Records</h1>
          <p className="text-gray-500 text-sm">
            View and manage all import duty entries with detailed breakdowns.
          </p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={handleExport}
            className="px-4 py-2 text-white bg-green-600 rounded-lg hover:bg-green-700 shadow"
          >
            Download Excel
          </button>
          <button
            onClick={() => router.push("/books/purchase/duty/import_module")}
            className="px-4 py-2 text-white bg-blue-600 rounded-lg hover:bg-blue-700 shadow"
          >
            Import Data
          </button>
          <button
            onClick={() => router.push("/books/purchase/duty/new")}
            className="px-4 py-2 text-white bg-green-600 rounded-lg hover:bg-green-700 shadow"
          >
            + New
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-4 mb-6 items-end bg-green-50 p-4 rounded-lg border border-green-100">
        <label className="flex flex-col">
          <span className="text-sm text-green-700 font-medium">From</span>
          <input
            type="date"
            className="px-2 py-1 border rounded"
            value={filterFrom}
            onChange={(e) => setFilterFrom(e.target.value)}
          />
        </label>
        <label className="flex flex-col">
          <span className="text-sm text-green-700 font-medium">To</span>
          <input
            type="date"
            className="px-2 py-1 border rounded"
            value={filterTo}
            onChange={(e) => setFilterTo(e.target.value)}
          />
        </label>
        <label className="flex flex-col">
          <span className="text-sm text-green-700 font-medium">Vendor</span>
          <input
            type="text"
            placeholder="Search vendor"
            className="px-2 py-1 border rounded"
            value={searchVendor}
            onChange={(e) => setSearchVendor(e.target.value)}
          />
        </label>
        <label className="flex flex-col">
          <span className="text-sm text-green-700 font-medium">Deal No</span>
          <input
            type="text"
            placeholder="Search deal no"
            className="px-2 py-1 border rounded"
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
          className="px-3 py-2 bg-red-500 text-white rounded hover:bg-red-600"
        >
          Clear
        </button>
      </div>

      {/* Table */}
      <div className="overflow-x-auto border rounded-lg shadow-md">
        <table className="w-full border-collapse text-sm">
          <thead className="bg-green-100 text-green-900">
            <tr>
              {[
                "Date",
                "Vendor",
                "Deal No",
                "Airway Bill",
                "Status",
                "Paid Amount",
                "Total Amount",
                "Created at",
                "Actions",
              ].map((header) => (
                <th key={header} className="p-2 text-left border">
                  {header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={8} className="p-4 text-center text-gray-600">
                  Loading...
                </td>
              </tr>
            ) : data.length > 0 ? (
              data.map((row) => (
                <tr
                  key={row.id}
                  className="border-b hover:bg-green-50 transition"
                >
                  <td className="p-2 border">{row.date}</td>
                  <td className="p-2 border">{row.vendor}</td>
                  <td className="p-2 border">{row.dealNumber}</td>
                  <td className="p-2 border">{row.airwayBillNumber ?? "-"}</td>
                  <td className="p-2 border text-center">
                    {row.payment_status}
                  </td>
                  <td className="p-2 border text-right font-medium">
                    ₹{row.paid_amount}
                  </td>
                  <td className="p-2 border text-right font-medium">
                    {row.total_amount
                      ? `${currencySymbols[row.currency] ?? ""}${parseFloat(
                          row.total_amount
                        ).toFixed(2)}`
                      : "-"}
                  </td>
                  <td className="p-2 border">
                      {row.created_at
                        ? new Date(row.created_at).toLocaleString("en-IN", {
                            dateStyle: "medium",
                            timeStyle: "short",
                          })
                        : "-"}
                    </td>
                  <td className="p-2 flex gap-2 border">
                    <button
                      onClick={() =>
                        router.push(`/books/purchase/duty/${row.id}`)
                      }
                      className="px-2 py-1 text-white bg-blue-500 rounded hover:bg-blue-600"
                    >
                      View
                    </button>
                    <button
                      onClick={() =>
                        router.push(`/books/purchase/duty/${row.id}/edit`)
                      }
                      className="px-2 py-1 text-white bg-yellow-500 rounded hover:bg-yellow-600"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => openPaymentModal(row)}
                      className="px-2 py-1 text-white bg-purple-600 rounded hover:bg-purple-700"
                    >
                      Add Payment
                    </button>
                    <button
                      onClick={() => handleDelete(row.id)}
                      className="px-2 py-1 text-white bg-red-500 rounded hover:bg-red-600"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td
                  colSpan={8}
                  className="p-4 text-center text-gray-500 italic"
                >
                  No duty records found.
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
              Add Payment for {selectedBill.airwayBillNumber}
            </h2>
            <p>Total: ₹{parseFloat(selectedBill.total_amount || "0").toLocaleString()}</p>
            <p>
  Total: ₹{Number(selectedBill.total_amount || 0).toLocaleString()}
</p>
<p className="mb-2">
  Paid: ₹{(selectedBill.paid_amount ?? 0).toLocaleString()} | Remaining: ₹
  {(selectedBill.amount_to_pay ?? 0).toLocaleString()}
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
