"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function NewItemPage() {
  const router = useRouter();

  const [form, setForm] = useState({
    name: "",
    purchaseDesc: "",
    purchaseRate: "",
    rate: "",
    stock: "",
  });

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSave = () => {
    const storedItems = JSON.parse(localStorage.getItem("items") || "[]");
    storedItems.push(form);
    localStorage.setItem("items", JSON.stringify(storedItems));
    router.push("/books/items/item"); // redirect to ItemsPage
  };

  return (
    <div className="flex items-center justify-center min-h-screen p-6 bg-gray-50">
      <div className="w-full max-w-5xl p-8 bg-white shadow-lg rounded-2xl">
        {/* Page Title */}
        <h1 className="mb-6 text-2xl font-semibold text-green-700">New Item</h1>

        {/* Name & Unit */}
        <div className="grid grid-cols-1 gap-6 mb-6 md:grid-cols-2">
          <div>
            <label className="block font-medium text-gray-700">
              Name<span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="name"
              value={form.name}
              onChange={handleChange}
              className="w-full p-2 mt-2 border rounded-lg focus:ring-2 focus:ring-green-500"
            />
          </div>
          <div>
            <label className="block font-medium text-gray-700">Unit</label>
            <select
              className="w-full p-2 mt-2 border rounded-lg focus:ring-2 focus:ring-green-500"
            >
              <option value="">Select or type to add</option>
            </select>
          </div>
        </div>

        {/* Sales & Purchase Info */}
        <div className="grid grid-cols-1 gap-6 mb-6 md:grid-cols-2">
          {/* Sales Information */}
          <div className="p-4 border rounded-lg">
            <label className="flex items-center gap-2 mb-4 font-semibold text-green-700">
              <input type="checkbox" checked readOnly className="text-green-600" />
              Sales Information
            </label>
            <div className="space-y-4">
              <div>
                <label className="block font-medium text-gray-700">
                  Selling Price<span className="text-red-500">*</span>
                </label>
                <div className="flex items-center gap-2 mt-2">
                  <span className="text-gray-600">INR</span>
                  <input
                    type="number"
                    name="rate"
                    value={form.rate}
                    onChange={handleChange}
                    className="flex-1 p-2 border rounded-lg focus:ring-2 focus:ring-green-500"
                  />
                </div>
              </div>
              <div>
                <label className="block font-medium text-gray-700">
                  Account<span className="text-red-500">*</span>
                </label>
                <select className="w-full p-2 mt-2 border rounded-lg focus:ring-2 focus:ring-green-500">
                  <option>Sales</option>
                </select>
              </div>
              <div>
                <label className="block font-medium text-gray-700">Description</label>
                <textarea
                  name="purchaseDesc"
                  value={form.purchaseDesc}
                  onChange={handleChange}
                  className="w-full p-2 mt-2 border rounded-lg focus:ring-2 focus:ring-green-500"
                ></textarea>
              </div>
            </div>
          </div>

          {/* Purchase Information */}
          <div className="p-4 border rounded-lg">
            <label className="flex items-center gap-2 mb-4 font-semibold text-green-700">
              <input type="checkbox" checked readOnly className="text-green-600" />
              Purchase Information
            </label>
            <div className="space-y-4">
              <div>
                <label className="block font-medium text-gray-700">
                  Cost Price<span className="text-red-500">*</span>
                </label>
                <div className="flex items-center gap-2 mt-2">
                  <span className="text-gray-600">INR</span>
                  <input
                    type="number"
                    name="purchaseRate"
                    value={form.purchaseRate}
                    onChange={handleChange}
                    className="flex-1 p-2 border rounded-lg focus:ring-2 focus:ring-green-500"
                  />
                </div>
              </div>
              <div>
                <label className="block font-medium text-gray-700">
                  Account<span className="text-red-500">*</span>
                </label>
                <select className="w-full p-2 mt-2 border rounded-lg focus:ring-2 focus:ring-green-500">
                  <option>Cost of Goods Sold</option>
                </select>
              </div>
              <div>
                <label className="block font-medium text-gray-700">Description</label>
                <textarea className="w-full p-2 mt-2 border rounded-lg focus:ring-2 focus:ring-green-500"></textarea>
              </div>
              <div>
                <label className="block font-medium text-gray-700">Preferred Vendor</label>
                <select className="w-full p-2 mt-2 border rounded-lg focus:ring-2 focus:ring-green-500">
                  <option value="">Select Vendor</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Track Inventory */}
        <div className="p-4 mb-6 border rounded-lg">
          <label className="flex items-center gap-2 mb-4 font-semibold text-green-700">
            <input type="checkbox" checked readOnly className="text-green-600" />
            Track Inventory for this item
          </label>
          <p className="mb-4 text-sm text-gray-500">
            You cannot enable/disable inventory tracking once you've created transactions for this item
          </p>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <div>
              <label className="block font-medium text-gray-700">Inventory Account</label>
              <select className="w-full p-2 mt-2 border rounded-lg focus:ring-2 focus:ring-green-500">
                <option value="">Select an account</option>
              </select>
            </div>
            <div>
              <label className="block font-medium text-gray-700">Inventory Valuation Method</label>
              <select className="w-full p-2 mt-2 border rounded-lg focus:ring-2 focus:ring-green-500">
                <option value="">Select the valuation method</option>
              </select>
            </div>
            <div>
              <label className="block font-medium text-gray-700">Opening Stock</label>
              <input
                type="number"
                name="stock"
                value={form.stock}
                onChange={handleChange}
                className="w-full p-2 mt-2 border rounded-lg focus:ring-2 focus:ring-green-500"
              />
            </div>
            <div>
              <label className="block font-medium text-gray-700">Opening Stock Rate per Unit</label>
              <input
                type="number"
                className="w-full p-2 mt-2 border rounded-lg focus:ring-2 focus:ring-green-500"
              />
            </div>
            <div>
              <label className="block font-medium text-gray-700">Reorder Point</label>
              <input
                type="number"
                className="w-full p-2 mt-2 border rounded-lg focus:ring-2 focus:ring-green-500"
              />
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-end gap-4">
          <button
            onClick={() => router.push("/books/items/item")}
            className="px-6 py-2 text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="px-6 py-2 text-white bg-green-600 rounded-lg hover:bg-green-700"
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
}