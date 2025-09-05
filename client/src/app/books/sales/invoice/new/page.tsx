"use client";

import { Upload, Plus, X } from "lucide-react";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function InvoiceFormPage() {
  const router = useRouter();
  const [items, setItems] = useState([{ name: "", qty: 1, rate: 0 }]);

  const goBack = () => {
    router.push("/books/sales/invoice"); // change path if needed
  };

  const addItem = () => setItems([...items, { name: "", qty: 1, rate: 0 }]);
  const removeItem = (index: number) =>
    setItems(items.filter((_, i) => i !== index));

  // Totals calculation
  const subtotal = items.reduce((acc, item) => acc + item.qty * item.rate, 0);
  const taxRate = 18; // Example GST
  const taxAmount = (subtotal * taxRate) / 100;
  const total = subtotal + taxAmount;

  return (
    <div className="min-h-screen p-6 bg-gray-50">
      <div className="p-6 space-y-6 bg-white border rounded-lg shadow-sm">
        {/* Header Form */}
        <div className="grid grid-cols-2 gap-6">
          <div>
            <label className="block mb-1 text-sm font-medium">
              Customer Name <span className="text-red-500">*</span>
            </label>
            <select className="w-full p-2 text-sm border rounded focus:ring-2 focus:ring-green-500">
              <option>Select or add a customer</option>
            </select>
          </div>
          <div>
            <label className="block mb-1 text-sm font-medium">Invoice#</label>
            <input
              type="text"
              value="INV-000002"
              className="w-full p-2 text-sm border rounded bg-gray-50"
              readOnly
            />
          </div>
          <div>
            <label className="block mb-1 text-sm font-medium">Order Number</label>
            <input type="text" className="w-full p-2 text-sm border rounded" />
          </div>
          <div>
            <label className="block mb-1 text-sm font-medium">
              Invoice Date <span className="text-red-500">*</span>
            </label>
            <input
              type="date"
              className="w-full p-2 text-sm border rounded focus:ring-2 focus:ring-green-500"
            />
          </div>
        </div>

        {/* Items & Charges */}
        <div>
          <h3 className="mb-3 text-lg font-semibold">Items & Charges</h3>
          <div className="grid grid-cols-3 gap-6">
            {/* Items Table */}
            <div className="col-span-2 overflow-hidden border rounded-lg">
              <table className="w-full text-sm">
                <thead className="border-b bg-gray-50">
                  <tr>
                    <th className="p-2 text-left">Item Details</th>
                    <th className="w-20 p-2 text-left">Qty</th>
                    <th className="w-24 p-2 text-left">Rate</th>
                    <th className="p-2 text-left w-28">Amount</th>
                    <th className="w-8 p-2"></th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((item, idx) => (
                    <tr key={idx} className="border-b">
                      <td className="p-2">
                        <input
                          className="w-full p-1 border rounded"
                          placeholder="Item name"
                        />
                      </td>
                      <td className="p-2">
                        <input
                          type="number"
                          className="w-full p-1 border rounded"
                          value={item.qty}
                          onChange={(e) =>
                            setItems(
                              items.map((it, i) =>
                                i === idx
                                  ? { ...it, qty: Number(e.target.value) }
                                  : it
                              )
                            )
                          }
                        />
                      </td>
                      <td className="p-2">
                        <input
                          type="number"
                          className="w-full p-1 border rounded"
                          value={item.rate}
                          onChange={(e) =>
                            setItems(
                              items.map((it, i) =>
                                i === idx
                                  ? { ...it, rate: Number(e.target.value) }
                                  : it
                              )
                            )
                          }
                        />
                      </td>
                      <td className="p-2">₹{(item.qty * item.rate).toFixed(2)}</td>
                      <td className="p-2 text-center">
                        <button onClick={() => removeItem(idx)}>
                          <X size={16} className="text-red-500" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <button
                onClick={addItem}
                className="flex items-center gap-1 px-3 py-2 text-sm font-medium text-green-600 hover:underline"
              >
                <Plus size={14} /> Add New Row
              </button>
            </div>

            {/* Totals */}
            <div className="p-4 border rounded-lg bg-gray-50 h-fit">
              <div className="flex justify-between mb-2">
                <span className="text-sm text-gray-600">Sub Total</span>
                <span className="text-sm">₹{subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between mb-2">
                <span className="text-sm text-gray-600">
                  GST ({taxRate}%)
                </span>
                <span className="text-sm">₹{taxAmount.toFixed(2)}</span>
              </div>
              <div className="flex justify-between pt-2 mt-2 font-semibold text-green-700 border-t">
                <span>Total</span>
                <span>₹{total.toFixed(2)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Notes */}
        <div>
          <label className="block mb-1 text-sm font-medium">Customer Notes</label>
          <textarea
            className="w-full p-2 text-sm border rounded"
            placeholder="Thanks for your business."
          />
        </div>

        {/* Terms & File Upload */}
        <div className="grid grid-cols-2 gap-6">
          <div>
            <label className="block mb-1 text-sm font-medium">
              Terms & Conditions
            </label>
            <textarea
              className="w-full p-2 text-sm border rounded"
              placeholder="Enter the terms and conditions..."
            />
          </div>
          <div>
            <label className="block mb-1 text-sm font-medium">Attach File(s)</label>
            <div className="flex items-center gap-2 p-2 border rounded cursor-pointer hover:bg-gray-100">
              <Upload size={16} className="text-green-600" />
              <input type="file" className="text-sm" />
            </div>
          </div>
        </div>
      </div>

      {/* Action Bar */}
      <div className="sticky bottom-0 flex justify-end gap-2 py-3 mt-4 border-t bg-gray-50">
        <button
          onClick={goBack}
          className="px-4 py-2 text-sm border rounded hover:bg-gray-100"
        >
          Save as Draft
        </button>
        <button
          onClick={goBack}
          className="px-4 py-2 text-sm text-white bg-green-600 rounded hover:bg-green-700"
        >
          Save and Send
        </button>
        <button
          onClick={goBack}
          className="px-4 py-2 text-sm border rounded hover:bg-gray-100"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}