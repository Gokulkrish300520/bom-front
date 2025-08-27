"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { jsPDF } from "jspdf";

type Item = {
  id: number;
  name: string;
  qty: number;
  rate: number;
};

export default function NewChallanPage() {
  const router = useRouter();

  const [form, setForm] = useState({
    customerName: "",
    challanNo: "DC-" + String(Date.now()).slice(-5), // unique challan #
    referenceNo: "",
    date: new Date().toISOString().split("T")[0],
    challanType: "",
    discount: 0,
    adjustment: 0,
    notes: "",
    terms: "",
    status: "DRAFT",
    invoiceStatus: "PENDING",
  });

  const [items, setItems] = useState<Item[]>([{ id: 1, name: "", qty: 1, rate: 0 }]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleItemChange = (id: number, field: keyof Item, value: string | number) => {
    setItems(items.map((i) => (i.id === id ? { ...i, [field]: value } : i)));
  };

  const addRow = () =>
    setItems([...items, { id: Date.now(), name: "", qty: 1, rate: 0 }]);

  const removeRow = (id: number) => setItems(items.filter((i) => i.id !== id));

  const subtotal = items.reduce((sum, i) => sum + i.qty * i.rate, 0);
  const total =
    subtotal - (subtotal * Number(form.discount || 0)) / 100 + Number(form.adjustment || 0);

  const handleSaveDraft = (e?: React.FormEvent) => {
    if (e) e.preventDefault();

    const newChallan = { ...form, items, total };

    // Save to localStorage
    const existing = JSON.parse(localStorage.getItem("challans") || "[]");
    localStorage.setItem("challans", JSON.stringify([...existing, newChallan]));

    // Redirect back to challans list
    router.push("/books/sales/challans");
  };

  // --- PDF Generation ---
  const generatePDF = () => {
    const doc = new jsPDF();

    doc.setFontSize(18);
    doc.text("Delivery Challan", 105, 15, { align: "center" });

    doc.setFontSize(12);
    doc.text(`Challan No: ${form.challanNo}`, 20, 35);
    doc.text(`Date: ${form.date}`, 150, 35);
    doc.text(`Reference No: ${form.referenceNo}`, 20, 45);
    doc.text(`Customer: ${form.customerName}`, 20, 55);
    doc.text(`Challan Type: ${form.challanType}`, 20, 65);

    // Table headers
    doc.text("Item", 20, 80);
    doc.text("Qty", 100, 80);
    doc.text("Rate", 130, 80);
    doc.text("Amount", 160, 80);

    // Table rows
    let y = 90;
    items.forEach((item) => {
      doc.text(item.name, 20, y);
      doc.text(item.qty.toString(), 100, y);
      doc.text(item.rate.toFixed(2), 130, y);
      doc.text((item.qty * item.rate).toFixed(2), 160, y);
      y += 10;
    });

    // Totals
    doc.text(`Sub Total: ₹${subtotal.toFixed(2)}`, 20, y + 10);
    doc.text(`Total: ₹${total.toFixed(2)}`, 20, y + 20);

    if (form.notes) doc.text(`Notes: ${form.notes}`, 20, y + 30);
    if (form.terms) doc.text(`Terms: ${form.terms}`, 20, y + 40);

    doc.save(`${form.challanNo}.pdf`);
  };

  return (
    <div className="min-h-screen p-6 bg-green-50">
      <h1 className="mb-4 text-2xl font-bold text-green-800">
        New Delivery Challan
      </h1>

      <form
        onSubmit={handleSaveDraft}
        className="p-6 space-y-6 bg-white shadow-lg rounded-xl"
      >
        {/* Customer */}
        <div>
          <label className="block mb-1 font-medium text-green-800">
            Customer Name*
          </label>
          <input
            type="text"
            name="customerName"
            value={form.customerName}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-green-300 rounded-lg"
            required
          />
        </div>

        {/* Challan Info */}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <div>
            <label className="block mb-1 font-medium text-green-800">
              Delivery Challan#
            </label>
            <input
              type="text"
              value={form.challanNo}
              className="w-full px-3 py-2 border border-green-300 rounded-lg"
              readOnly
            />
          </div>
          <div>
            <label className="block mb-1 font-medium text-green-800">
              Reference#
            </label>
            <input
              type="text"
              name="referenceNo"
              value={form.referenceNo}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-green-300 rounded-lg"
            />
          </div>
          <div>
            <label className="block mb-1 font-medium text-green-800">Date</label>
            <input
              type="date"
              name="date"
              value={form.date}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-green-300 rounded-lg"
            />
          </div>
        </div>

        {/* Challan Type */}
        <div>
          <label className="block mb-1 font-medium text-green-800">
            Challan Type*
          </label>
          <select
            name="challanType"
            value={form.challanType}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-green-300 rounded-lg"
            required
          >
            <option value="">Choose</option>
            <option>Supply of Liquid Gas</option>
            <option>Job Work</option>
            <option>Supply on Approval</option>
            <option>Others</option>
          </select>
        </div>

        {/* Items Table */}
        <div>
          <h2 className="mb-2 text-lg font-semibold text-green-800">Items</h2>
          <table className="w-full border rounded-lg">
            <thead className="text-green-800 bg-green-100">
              <tr>
                <th className="p-2 text-left">Item</th>
                <th className="p-2">Qty</th>
                <th className="p-2">Rate</th>
                <th className="p-2">Amount</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr key={item.id} className="border-b">
                  <td className="p-2">
                    <input
                      type="text"
                      value={item.name}
                      onChange={(e) =>
                        handleItemChange(item.id, "name", e.target.value)
                      }
                      className="w-full px-2 py-1 border border-green-300 rounded-lg"
                    />
                  </td>
                  <td className="p-2">
                    <input
                      type="number"
                      value={item.qty}
                      min="1"
                      onChange={(e) =>
                        handleItemChange(item.id, "qty", Number(e.target.value))
                      }
                      className="w-20 px-2 py-1 text-center border border-green-300 rounded-lg"
                    />
                  </td>
                  <td className="p-2">
                    <input
                      type="number"
                      value={item.rate}
                      onChange={(e) =>
                        handleItemChange(item.id, "rate", Number(e.target.value))
                      }
                      className="w-24 px-2 py-1 text-center border border-green-300 rounded-lg"
                    />
                  </td>
                  <td className="p-2 text-right">
                    {(item.qty * item.rate).toFixed(2)}
                  </td>
                  <td className="p-2 text-center">
                    <button
                      type="button"
                      onClick={() => removeRow(item.id)}
                      className="text-red-600"
                    >
                      ✕
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <button
            type="button"
            onClick={addRow}
            className="px-4 py-2 mt-2 text-white bg-green-600 rounded-lg hover:bg-green-700"
          >
            + Add Row
          </button>
        </div>

        {/* Totals */}
        <div className="p-4 space-y-2 rounded-lg bg-green-50">
          <div className="flex justify-between">
            <span>Sub Total</span>
            <span>{subtotal.toFixed(2)}</span>
          </div>
          <div className="flex justify-between font-semibold">
            <span>Total (₹)</span>
            <span>{total.toFixed(2)}</span>
          </div>
        </div>

        {/* Buttons */}
        <div className="flex justify-end gap-3">
          <button
            type="button"
            onClick={() => router.push("/books/sales/challans")}
            className="px-6 py-2 bg-gray-200 rounded-lg"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSaveDraft}
            className="px-6 py-2 text-white bg-green-600 rounded-lg hover:bg-green-700"
          >
            Save as Draft
          </button>
          <button
            type="button"
            onClick={generatePDF}
            className="px-6 py-2 text-white bg-orange-600 rounded-lg hover:bg-orange-700"
          >
            Download PDF
          </button>
        </div>
      </form>
    </div>
  );
}
