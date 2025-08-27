"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";

type ItemRow = { id: string; name: string; qty: number; rate: number };

const STORAGE_KEY = "proforma_invoices";

export default function NewProformaInvoicePage() {
  const router = useRouter();

  // Form state
  const [customerName, setCustomerName] = useState("");
  const [invoiceNumber, setInvoiceNumber] = useState(
    "PI-" + (Math.floor(Date.now() / 1000) % 100000)
  );
  const [reference, setReference] = useState("");
  const [invoiceDate, setInvoiceDate] = useState(new Date().toISOString().slice(0, 10));
  const [expiryDate, setExpiryDate] = useState("");
  const [salesperson, setSalesperson] = useState("");
  const [projectName, setProjectName] = useState("");
  const [subject, setSubject] = useState("");
  const [notes, setNotes] = useState("Looking forward for your business.");
  const [terms, setTerms] = useState("");

  // Items
  const [items, setItems] = useState<ItemRow[]>([
    { id: crypto.randomUUID(), name: "", qty: 1, rate: 0 },
  ]);

  // Pricing controls
  const [discountPct, setDiscountPct] = useState(0); // %
  const [taxType, setTaxType] = useState<"TDS" | "TCS">("TDS");
  const [taxPct, setTaxPct] = useState(0); // 0, 5, 12, 18, 28
  const [adjustment, setAdjustment] = useState(0);

  // Computations
  const subTotal = useMemo(
    () => items.reduce((s, i) => s + (Number(i.qty) || 0) * (Number(i.rate) || 0), 0),
    [items]
  );
  const discountAmt = useMemo(
    () => (subTotal * (Number(discountPct) || 0)) / 100,
    [subTotal, discountPct]
  );
  const taxAmt = useMemo(() => {
    const base = ((subTotal - discountAmt) * (Number(taxPct) || 0)) / 100;
    return taxType === "TDS" ? -base : base; // TDS deducts, TCS adds
  }, [subTotal, discountAmt, taxPct, taxType]);
  const total = useMemo(
    () => subTotal - discountAmt + taxAmt + (Number(adjustment) || 0),
    [subTotal, discountAmt, taxAmt, adjustment]
  );

  // Item row actions
  const addRow = () =>
    setItems((rows) => [...rows, { id: crypto.randomUUID(), name: "", qty: 1, rate: 0 }]);

  const removeRow = (id: string) =>
    setItems((rows) => (rows.length === 1 ? rows : rows.filter((r) => r.id !== id)));

  const updateRow = (id: string, patch: Partial<ItemRow>) =>
    setItems((rows) => rows.map((r) => (r.id === id ? { ...r, ...patch } : r)));

  // Save
  function save(status: "Draft" | "Sent") {
    const saved = localStorage.getItem(STORAGE_KEY);
    const list = saved ? JSON.parse(saved) : [];

    list.push({
      id: crypto.randomUUID(),
      date: invoiceDate,
      invoiceNumber,
      customerName,
      status,
      amount: total,
      meta: {
        reference,
        expiryDate,
        salesperson,
        projectName,
        subject,
        notes,
        terms,
        items,
        discountPct,
        taxPct,
        taxType,
        adjustment,
      },
    });

    localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
    router.push("/proforma-invoices");
  }

  return (
    <div className="min-h-screen p-6 bg-green-50">
      <h1 className="mb-6 text-2xl font-bold text-green-800">New Proforma Invoice</h1>

      <div className="p-6 space-y-8 bg-white shadow-md rounded-2xl">
        {/* Top grid */}
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <div>
            <label className="block text-sm font-medium text-green-800">Customer Name*</label>
            <input
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              placeholder="Select or add a customer"
              className="w-full px-3 py-2 mt-1 border rounded-lg focus:ring-2 focus:ring-green-400"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-green-800">Invoice #*</label>
            <input
              value={invoiceNumber}
              onChange={(e) => setInvoiceNumber(e.target.value)}
              className="w-full px-3 py-2 mt-1 border rounded-lg focus:ring-2 focus:ring-green-400"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-green-800">Reference # (optional)</label>
            <input
              value={reference}
              onChange={(e) => setReference(e.target.value)}
              className="w-full px-3 py-2 mt-1 border rounded-lg focus:ring-2 focus:ring-green-400"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-green-800">Invoice Date*</label>
              <input
                type="date"
                value={invoiceDate}
                onChange={(e) => setInvoiceDate(e.target.value)}
                className="w-full px-3 py-2 mt-1 border rounded-lg focus:ring-2 focus:ring-green-400"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-green-800">Expiry Date</label>
              <input
                type="date"
                value={expiryDate}
                onChange={(e) => setExpiryDate(e.target.value)}
                className="w-full px-3 py-2 mt-1 border rounded-lg focus:ring-2 focus:ring-green-400"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-green-800">Salesperson</label>
            <input
              value={salesperson}
              onChange={(e) => setSalesperson(e.target.value)}
              className="w-full px-3 py-2 mt-1 border rounded-lg focus:ring-2 focus:ring-green-400"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-green-800">Project Name</label>
            <input
              value={projectName}
              onChange={(e) => setProjectName(e.target.value)}
              className="w-full px-3 py-2 mt-1 border rounded-lg focus:ring-2 focus:ring-green-400"
            />
          </div>
        </div>

        {/* Subject */}
        <div>
          <label className="block text-sm font-medium text-green-800">Subject</label>
          <textarea
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            placeholder="Let your customer know what this invoice is for"
            className="w-full px-3 py-2 mt-1 border rounded-lg focus:ring-2 focus:ring-green-400"
          />
        </div>

        {/* Items */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-lg font-semibold text-green-700">Item Table</h2>
            <span className="text-sm text-green-700/80">Bulk Actions</span>
          </div>

          <div className="overflow-hidden border rounded-xl">
            <table className="w-full">
              <thead className="text-green-900 bg-green-200">
                <tr>
                  <th className="p-2 text-left">Item Details</th>
                  <th className="p-2 text-left">Quantity</th>
                  <th className="p-2 text-left">Rate</th>
                  <th className="p-2 text-left">Amount</th>
                  <th className="p-2"></th>
                </tr>
              </thead>
              <tbody>
                {items.map((row) => (
                  <tr key={row.id} className="border-b bg-green-50">
                    <td className="p-2">
                      <input
                        value={row.name}
                        onChange={(e) => updateRow(row.id, { name: e.target.value })}
                        placeholder="Type or click to select an item"
                        className="w-full px-2 py-1 border rounded"
                      />
                    </td>
                    <td className="p-2">
                      <input
                        type="number"
                        min={0}
                        value={row.qty}
                        onChange={(e) => updateRow(row.id, { qty: Number(e.target.value) })}
                        className="w-24 px-2 py-1 border rounded"
                      />
                    </td>
                    <td className="p-2">
                      <input
                        type="number"
                        min={0}
                        value={row.rate}
                        onChange={(e) => updateRow(row.id, { rate: Number(e.target.value) })}
                        className="px-2 py-1 border rounded w-28"
                      />
                    </td>
                    <td className="p-2 font-medium">
                      ₹{(Number(row.qty) * Number(row.rate)).toFixed(2)}
                    </td>
                    <td className="p-2">
                      <button
                        onClick={() => removeRow(row.id)}
                        className="text-red-600 hover:text-red-800"
                        title="Remove row"
                      >
                        ✕
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex flex-wrap gap-3 mt-3">
            <button
              onClick={addRow}
              className="px-4 py-2 text-white bg-green-600 rounded-lg shadow hover:bg-green-700"
            >
              + Add New Row
            </button>
            <button className="px-4 py-2 border rounded-lg hover:bg-green-100">
              + Add Items in Bulk
            </button>
          </div>
        </div>

        {/* Totals */}
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <div>
            <label className="block text-sm font-medium text-green-800">Customer Notes</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-3 py-2 mt-1 border rounded-lg focus:ring-2 focus:ring-green-400"
            />
          </div>

          <div className="p-4 space-y-3 border bg-green-50 rounded-2xl">
            <div className="flex justify-between">
              <span className="text-green-900">Sub Total</span>
              <span>₹{subTotal.toFixed(2)}</span>
            </div>

            <div className="flex items-center justify-between gap-4">
              <label className="text-green-900">Discount</label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min={0}
                  max={100}
                  value={discountPct}
                  onChange={(e) => setDiscountPct(Number(e.target.value))}
                  className="w-24 px-2 py-1 border rounded"
                />
                <span>%</span>
                <span className="text-sm text-gray-600">₹{discountAmt.toFixed(2)}</span>
              </div>
            </div>

            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <label className="flex items-center gap-1">
                  <input
                    type="radio"
                    checked={taxType === "TDS"}
                    onChange={() => setTaxType("TDS")}
                  />
                  TDS
                </label>
                <label className="flex items-center gap-1">
                  <input
                    type="radio"
                    checked={taxType === "TCS"}
                    onChange={() => setTaxType("TCS")}
                  />
                  TCS
                </label>
              </div>
              <select
                value={taxPct}
                onChange={(e) => setTaxPct(Number(e.target.value))}
                className="px-2 py-1 border rounded"
              >
                {[0, 5, 12, 18, 28].map((t) => (
                  <option key={t} value={t}>
                    {t}% Tax
                  </option>
                ))}
              </select>
              <span className="text-sm text-gray-600">
                {taxType === "TDS" ? "-" : "+"}₹{Math.abs(taxAmt).toFixed(2)}
              </span>
            </div>

            <div className="flex items-center justify-between gap-4">
              <label className="text-green-900">Adjustment</label>
              <input
                type="number"
                value={adjustment}
                onChange={(e) => setAdjustment(Number(e.target.value))}
                className="px-2 py-1 border rounded w-28"
              />
            </div>

            <div className="flex justify-between pt-2 text-lg font-semibold text-green-800 border-t">
              <span>Total (₹)</span>
              <span>₹{total.toFixed(2)}</span>
            </div>
          </div>
        </div>

        {/* Terms */}
        <div>
          <label className="block text-sm font-medium text-green-800">Terms & Conditions</label>
          <textarea
            value={terms}
            onChange={(e) => setTerms(e.target.value)}
            className="w-full px-3 py-2 mt-1 border rounded-lg focus:ring-2 focus:ring-green-400"
          />
        </div>

        {/* Footer buttons */}
        <div className="flex flex-wrap justify-end gap-3">
          <button
            onClick={() => save("Draft")}
            className="px-4 py-2 border rounded-lg hover:bg-green-100"
          >
            Save as Draft
          </button>
          <button
            onClick={() => save("Sent")}
            className="px-4 py-2 text-white bg-green-600 rounded-lg shadow hover:bg-green-700"
          >
            Save and Send
          </button>
          <button
            onClick={() => router.push("/books/sales/proforma-invoice")}
            className="px-4 py-2 border rounded-lg hover:bg-red-100"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
