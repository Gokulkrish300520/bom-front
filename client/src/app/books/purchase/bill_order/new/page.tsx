"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Plus, X } from "lucide-react";
import { fetchWithAuth } from "@/auth/tokenservice";
import toast from "react-hot-toast";
import Breadcrumb from "@/app/breadcrumb";

interface Row {
  id?: number;
  item_name: string;
  description: string;
  item_specification: string;
  hsn_code: string;
  brand: string;
  quantity: number;
  unit_price: number;
}

interface Vendor {
  id: string;
  display_name: string;
}

interface Deal {
  id: string;
  deal_no: string;
}

const paidByOptions = [
  { label: "SBI", value: "SBI" },
  { label: "ICICI", value: "ICICI" },
  { label: "Petty Cash", value: "Petty Cash" },
  { label: "IOB", value: "IOB" },
];

export default function NewPurchaseBill() {
  const router = useRouter();

  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [deals, setDeals] = useState<Deal[]>([]);
  const [rows, setRows] = useState<Row[]>([
    { item_name: "", description: "", item_specification: "", hsn_code: "", brand: "", quantity: 0, unit_price: 0 },
  ]);

  const [selectedVendor, setSelectedVendor] = useState<number>(0);
  const [selectedDeal, setSelectedDeal] = useState<number>(0);
  const [billNo, setBillNo] = useState("");
  const [invoiceDate, setInvoiceDate] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [notes, setNotes] = useState("");
  const [taxType, setTaxType] = useState("TCS");
  const [taxPercentage, setTaxPercentage] = useState<number>(18);
  const [adjustments, setAdjustments] = useState<number>(0);
  const [saving, setSaving] = useState(false);

  // Payment Request Logic
  const [paymentRequested, setPaymentRequested] = useState(true);
  const [paymentOption, setPaymentOption] = useState<"Low" | "High">("Low");
  const [paymentMade, setPaymentMade] = useState(false);
  const [paidAmount, setPaidAmount] = useState<number>(0);
  const [paidBy, setPaidBy] = useState<string>("SBI");
  const [paymentReference, setPaymentReference] = useState<string>("");

  useEffect(() => {
    fetchVendors();
    fetchDeals();
  }, []);

  async function fetchVendors() {
    try {
      const res = await fetchWithAuth("https://web-production-6baf3.up.railway.app/api/vendors/");
      const data = await res.json();
      setVendors(data.results || []);
    } catch {
      toast.error("Failed to fetch vendors");
    }
  }

  async function fetchDeals() {
    try {
      const res = await fetchWithAuth("https://web-production-6baf3.up.railway.app/api/deals/");
      const data = await res.json();
      setDeals(data.results || []);
    } catch {
      toast.error("Failed to fetch deals");
    }
  }

  // Rows
  const handleRowChange = (index: number, field: keyof Row, value: string | number) => {
    setRows((oldRows) => {
      const newRows = [...oldRows];
      let val: any = value;
      if (field === "quantity" || field === "unit_price") {
        val = Number(value);
        if (isNaN(val) || val < 0) val = 0;
      }
      newRows[index] = { ...newRows[index], [field]: val };
      return newRows;
    });
  };
  const addRow = () => setRows([...rows, { item_name: "", description: "", item_specification: "", hsn_code: "", brand: "", quantity: 0, unit_price: 0 }]);
  const removeRow = (index: number) => rows.length > 1 && setRows(rows.filter((_, i) => i !== index));

  // Calculations
  const subtotal = rows.reduce((sum, r) => sum + r.quantity * r.unit_price, 0);
  const taxAmount = (subtotal * taxPercentage) / 100;
  const total = taxType === "TCS" ? subtotal + taxAmount + adjustments : subtotal - taxAmount + adjustments;
  const totalPaid = paymentMade ? paidAmount : 0;
  const amountToPay = Math.max(total - totalPaid, 0);

  let statusCalculated: "UNPAID" | "PARTIAL" | "PAID" = "UNPAID";
  if (totalPaid === 0) statusCalculated = "UNPAID";
  else if (totalPaid < total) statusCalculated = "PARTIAL";
  else statusCalculated = "PAID";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedVendor || !selectedDeal || !billNo || !invoiceDate || !dueDate) {
      toast.error("Please fill all required fields!");
      return;
    }

    const billPayload: any = {
      vendor_id: selectedVendor,
      deal_id: selectedDeal,
      bill_number: billNo,
      bill_date: invoiceDate,
      due_date: dueDate,
      notes,
      tax_type: taxType,
      tax_percentage: taxPercentage,
      adjustments,
      status: statusCalculated,
      payment_request: paymentOption,
      billorder_items: rows.map((r) => ({
        item_name: r.item_name,
        description: r.description,
        item_specification: r.item_specification,
        hsn_code: r.hsn_code,
        brand: r.brand,
        quantity: r.quantity,
        unit_price: r.unit_price,
      })),
    };

    // Add payment info if requested and made
    if (paymentRequested && paymentMade && paidAmount > 0) {
      billPayload.transactions = [{
        amount: paidAmount,
        paid_by: paidBy,
        payment_reference_no: paidBy === "Petty Cash" ? "-" : paymentReference,
        payment_option: paymentOption,
      }];
    }

    setSaving(true);
    try {
      const res = await fetchWithAuth("https://web-production-6baf3.up.railway.app/api/billorders/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(billPayload),
      });

      if (!res.ok) {
        const data = await res.json();
        toast.error(JSON.stringify(data));
        return;
      }

      toast.success("Purchase Bill Created!");
      router.push("/books/purchase/bill_order");
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Network error");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto p-6 bg-white rounded-md shadow-md">
      <Breadcrumb />
      <h1 className="text-3xl font-semibold text-green-700 mb-6">New Bill</h1>
      <form onSubmit={handleSubmit}>
        {/* Vendor / Deal / Bill */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-4">
          <div>
            <label className="block mb-1 font-semibold text-green-700">Vendor</label>
            <select required value={selectedVendor} onChange={(e) => setSelectedVendor(Number(e.target.value))} className="border border-green-400 rounded p-2 w-full">
              <option value="">Select Vendor</option>
              {vendors.map((v) => <option key={v.id} value={v.id}>{v.display_name}</option>)}
            </select>
          </div>
          <div>
            <label className="block mb-1 font-semibold text-green-700">Deal</label>
            <select required value={selectedDeal} onChange={(e) => setSelectedDeal(Number(e.target.value))} className="border border-green-400 rounded p-2 w-full">
              <option value="">Select Deal</option>
              {deals.map((d) => <option key={d.id} value={d.id}>{d.deal_no}</option>)}
            </select>
          </div>
          <div>
            <label className="block mb-1 font-semibold text-green-700">Bill No</label>
            <input type="text" required value={billNo} onChange={(e) => setBillNo(e.target.value)} className="border border-green-400 rounded p-2 w-full" />
          </div>
        </div>

        {/* Dates */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-4">
          <div>
            <label className="block mb-1 font-semibold text-green-700">Invoice Date</label>
            <input type="date" required value={invoiceDate} onChange={(e) => setInvoiceDate(e.target.value)} className="border border-green-400 rounded p-2 w-full" />
          </div>
          <div>
            <label className="block mb-1 font-semibold text-green-700">Due Date</label>
            <input type="date" required value={dueDate} onChange={(e) => setDueDate(e.target.value)} className="border border-green-400 rounded p-2 w-full" />
          </div>
        </div>

        {/* Notes */}
        <div className="mb-4">
          <label className="block mb-1 font-semibold text-green-700">Notes</label>
          <textarea value={notes} onChange={(e) => setNotes(e.target.value)} className="border border-green-400 rounded p-2 w-full" />
        </div>

        {/* Items Table */}
        <div className="overflow-auto mb-4">
          <table className="w-full min-w-max border-collapse border border-green-200">
            <thead className="bg-green-100 text-green-800">
              <tr>
                {["Item", "Description", "Specification", "HSN", "Brand", "Qty", "Unit Price", "Total", "Remove"].map((h) => (
                  <th key={h} className="border border-green-300 px-3 py-2 text-left">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row, idx) => (
                <tr key={idx} className="hover:bg-green-50 transition">
                  <td className="border border-green-300 px-2 py-1"><input type="text" value={row.item_name} onChange={(e) => handleRowChange(idx, "item_name", e.target.value)} className="w-full px-1 py-1 border rounded" /></td>
                  <td className="border border-green-300 px-2 py-1"><input type="text" value={row.description} onChange={(e) => handleRowChange(idx, "description", e.target.value)} className="w-full px-1 py-1 border rounded" /></td>
                  <td className="border border-green-300 px-2 py-1"><input type="text" value={row.item_specification} onChange={(e) => handleRowChange(idx, "item_specification", e.target.value)} className="w-full px-1 py-1 border rounded" /></td>
                  <td className="border border-green-300 px-2 py-1"><input type="text" value={row.hsn_code} onChange={(e) => handleRowChange(idx, "hsn_code", e.target.value)} className="w-full px-1 py-1 border rounded" /></td>
                  <td className="border border-green-300 px-2 py-1"><input type="text" value={row.brand} onChange={(e) => handleRowChange(idx, "brand", e.target.value)} className="w-full px-1 py-1 border rounded" /></td>
                  <td className="border border-green-300 px-2 py-1 text-right"><input type="number" min={0} value={row.quantity} onChange={(e) => handleRowChange(idx, "quantity", Number(e.target.value))} className="w-full px-1 py-1 border rounded" /></td>
                  <td className="border border-green-300 px-2 py-1 text-right"><input type="number" min={0} value={row.unit_price} onChange={(e) => handleRowChange(idx, "unit_price", Number(e.target.value))} className="w-full px-1 py-1 border rounded" /></td>
                  <td className="border border-green-300 px-2 py-1 text-right font-semibold">₹{(row.unit_price * row.quantity).toFixed(2)}</td>
                  <td className="border border-green-300 px-2 py-1 text-center">{rows.length > 1 && <button type="button" onClick={() => removeRow(idx)} className="text-red-600 hover:text-red-800">X</button>}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <button type="button" className="mt-2 mb-6 px-4 py-2 rounded bg-green-200 text-green-700 hover:bg-green-300 flex items-center gap-2" onClick={addRow}><Plus size={16} /> Add Row</button>
        </div>

        {/* Payment Request Section */}
        <div className="mb-6 p-4 border rounded border-green-200 bg-green-50">
          <label>
                Payment Option:
                <select value={paymentOption} onChange={(e) => setPaymentOption(e.target.value as "Low" | "High")} className="border border-green-400 rounded p-1 ml-2">
                  <option value="Low">Low</option>
                  <option value="High">High</option>
                </select>
              </label>
          {paymentRequested && (
            <div className="space-y-2">
              

              {/* Made Payment Fields */}
              <label className="flex items-center gap-2">
                <input type="checkbox" checked={paymentMade} onChange={(e) => setPaymentMade(e.target.checked)} />
                Payment Made
              </label>
              {paymentMade && (
                <div className="space-y-2">
                  <label>
                    Paid Amount
                    <input type="number" min={0} value={paidAmount} onChange={(e) => setPaidAmount(Number(e.target.value))} className="border border-green-400 rounded p-1 ml-2 w-32" />
                  </label>
                  <label>
                    Paid By
                    <select value={paidBy} onChange={(e) => setPaidBy(e.target.value)} className="border border-green-400 rounded p-1 ml-2">
                      {paidByOptions.map((opt) => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                    </select>
                  </label>
                  {paidBy !== "Petty Cash" && (
                    <label>
                      Reference No
                      <input type="text" value={paymentReference} onChange={(e) => setPaymentReference(e.target.value)} className="border border-green-400 rounded p-1 ml-2" />
                    </label>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Summary */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
          <div></div>
          <div className="p-6 bg-green-50 rounded border border-green-200 space-y-2">
            <div className="flex justify-between">Subtotal <span>₹{subtotal.toFixed(2)}</span></div>
            <div className="flex justify-between">Tax ({taxType}) <span>₹{taxAmount.toFixed(2)}</span></div>
            <div className="mb-4 w-1/2">
              <label className="block mb-1 font-semibold text-green-700">Adjustments</label>
              <input
                type="number"
                value={adjustments}
                onChange={(e) => setAdjustments(Number(e.target.value))}
                className="border border-green-400 rounded p-2 w-full"
              />
            </div>
            <div className="flex justify-between font-semibold text-lg border-t border-green-300 pt-2">Total <span>₹{total.toFixed(2)}</span></div>
            <div className="flex justify-between font-semibold text-lg">Total Paid <span>₹{totalPaid.toFixed(2)}</span></div>
            <div className="flex justify-between font-semibold text-lg">Amount to Pay <span>₹{amountToPay.toFixed(2)}</span></div>
            <div className="flex justify-between font-semibold text-lg">Status <span>{statusCalculated}</span></div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-end space-x-6 mt-5">
          <button type="button" onClick={() => router.push("/books/purchase/bill_order")} className="px-6 py-2 rounded border hover:bg-gray-100">Cancel</button>
          <button type="submit" disabled={saving} className="px-6 py-2 rounded bg-green-600 text-white hover:bg-green-700">{saving ? "Saving..." : "Save"}</button>
        </div>
      </form>
    </div>
  );
}
