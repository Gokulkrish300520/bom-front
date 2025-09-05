"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Plus } from "lucide-react";

type Row = {
  description: string;
  qty: number;
  adjustment: number;
  amount: number;
};

export default function NewItemPage() {
  const router = useRouter();
  const [rows, setRows] = useState<Row[]>([
    { description: "", qty: 1, adjustment: 0, amount: 0 },
  ]);

  const addRow = () => {
    setRows([...rows, { description: "", qty: 1, adjustment: 0, amount: 0 }]);
  };

  // ✅ Use keyof Row instead of string
  const updateRow = <K extends keyof Row>(index: number, field: K, value: Row[K]) => {
    const updated = [...rows];
    updated[index][field] = value;
    setRows(updated);
  };

  return (
    <div className="min-h-screen p-6 bg-green-50">
      {/* Form Container */}
      <div className="p-6 bg-white shadow-md rounded-xl">
        <h2 className="mb-4 text-2xl font-semibold text-green-700">New Item</h2>

        {/* Item Details */}
        <div className="grid grid-cols-1 gap-4 mb-6 md:grid-cols-2">
          <div>
            <label className="block text-sm font-medium text-green-700">Item Name</label>
            <input
              type="text"
              className="w-full p-2 mt-1 border rounded-lg focus:ring-2 focus:ring-green-500"
              placeholder="Enter item name"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-green-700">Unit</label>
            <select className="w-full p-2 mt-1 border rounded-lg focus:ring-2 focus:ring-green-500">
              <option>Select unit</option>
              <option>Nos</option>
              <option>Kgs</option>
              <option>Liters</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-green-700">Type</label>
            <select className="w-full p-2 mt-1 border rounded-lg focus:ring-2 focus:ring-green-500">
              <option>Goods</option>
              <option>Service</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-green-700">HSN Code</label>
            <input
              type="text"
              className="w-full p-2 mt-1 border rounded-lg focus:ring-2 focus:ring-green-500"
              placeholder="Enter HSN code"
            />
          </div>
        </div>

        {/* Description */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-green-700">Description</label>
          <textarea
            className="w-full p-2 mt-1 border rounded-lg focus:ring-2 focus:ring-green-500"
            rows={3}
            placeholder="Enter description"
          ></textarea>
        </div>

        {/* Item Table */}
        <h3 className="mb-2 text-lg font-semibold text-green-700">Item Details</h3>
        <table className="w-full mb-4 border rounded-lg">
          <thead className="bg-green-100">
            <tr>
              <th className="p-2 text-left border">Description</th>
              <th className="p-2 text-left border">Qty</th>
              <th className="p-2 text-left border">Adjustment</th>
              <th className="p-2 text-left border">Amount</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, index) => (
              <tr key={index} className="border-t">
                <td className="p-2 border">
                  <input
                    type="text"
                    value={row.description}
                    onChange={(e) => updateRow(index, "description", e.target.value)}
                    className="w-full p-1 border rounded focus:ring-2 focus:ring-green-500"
                    placeholder="Item description"
                  />
                </td>
                <td className="p-2 border">
                  <input
                    type="number"
                    value={row.qty}
                    onChange={(e) => updateRow(index, "qty", Number(e.target.value))}
                    className="w-20 p-1 border rounded focus:ring-2 focus:ring-green-500"
                  />
                </td>
                <td className="p-2 border">
                  <input
                    type="number"
                    value={row.adjustment}
                    onChange={(e) => updateRow(index, "adjustment", Number(e.target.value))}
                    className="w-24 p-1 border rounded focus:ring-2 focus:ring-green-500"
                  />
                </td>
                <td className="p-2 border">
                  <input
                    type="number"
                    value={row.amount}
                    onChange={(e) => updateRow(index, "amount", Number(e.target.value))}
                    className="w-28 p-1 border rounded focus:ring-2 focus:ring-green-500"
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        <button
          onClick={addRow}
          className="flex items-center mb-6 text-green-600 hover:text-green-800"
        >
          <Plus className="w-5 h-5 mr-1" />
          Add Row
        </button>

        {/* Pricing Section */}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div>
            <label className="block text-sm font-medium text-green-700">Selling Price</label>
            <input
              type="number"
              className="w-full p-2 mt-1 border rounded-lg focus:ring-2 focus:ring-green-500"
              placeholder="Enter selling price"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-green-700">Purchase Price</label>
            <input
              type="number"
              className="w-full p-2 mt-1 border rounded-lg focus:ring-2 focus:ring-green-500"
              placeholder="Enter purchase price"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-green-700">Tax</label>
            <select className="w-full p-2 mt-1 border rounded-lg focus:ring-2 focus:ring-green-500">
              <option>18%</option>
              <option>12%</option>
              <option>5%</option>
              <option>0%</option>
            </select>
          </div>
        </div>

        {/* Submit Buttons */}
        <div className="flex justify-end mt-8 space-x-3">
          <button
            onClick={() => router.push("/books/items/inventory")}
            className="px-4 py-2 border rounded-lg hover:bg-green-50"
          >
            Cancel
          </button>
          <button className="px-4 py-2 text-white bg-green-600 rounded-lg hover:bg-green-700">
            Save Item
          </button>
        </div>
      </div>
    </div>
  );
}
