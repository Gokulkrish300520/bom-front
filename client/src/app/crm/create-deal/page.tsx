// app/create-deal/page.tsx (Next.js 13+ with App Router)
"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function CreateDeal() {
  const router = useRouter(); 

  const [form, setForm] = useState({
    dealName: "",
    companyName: "",
    contactName: "",
    stage: "",
    amount: "",
    closingDate: "",
    description: "",
    projectValue: "",
    advancePayment: "",
    expense: "",
  });

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >
  ) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  return (
    <div className="flex items-center justify-center min-h-screen p-6 bg-gray-50">
      <div className="w-full max-w-3xl p-6 bg-white shadow-md rounded-xl">
        <h2 className="mb-6 text-xl font-semibold text-gray-800">Create Deal</h2>

        {/* Deal Information */}
        <div className="mb-6">
          <h3 className="mb-4 text-lg font-medium text-gray-700">
            Deal Information
          </h3>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <input
              type="text"
              name="dealName"
              placeholder="Deal Name"
              value={form.dealName}
              onChange={handleChange}
              className="w-full p-2 border rounded-md focus:ring focus:ring-blue-200"
            />
            <input
              type="text"
              name="companyName"
              placeholder="Company Name"
              value={form.companyName}
              onChange={handleChange}
              className="w-full p-2 border rounded-md focus:ring focus:ring-blue-200"
            />
            <input
              type="text"
              name="contactName"
              placeholder="Contact Name"
              value={form.contactName}
              onChange={handleChange}
              className="w-full p-2 border rounded-md focus:ring focus:ring-blue-200"
            />
            <select
              name="stage"
              value={form.stage}
              onChange={handleChange}
              className="w-full p-2 border rounded-md focus:ring focus:ring-blue-200"
            >
              <option value="">Choose a stage</option>
              <option value="Prospecting">Prospecting</option>
              <option value="Negotiation">Negotiation</option>
              <option value="Closed Won">Closed Won</option>
              <option value="Closed Lost">Closed Lost</option>
            </select>
            <input
              type="number"
              name="amount"
              placeholder="Amount (₹)"
              value={form.amount}
              onChange={handleChange}
              className="w-full p-2 border rounded-md focus:ring focus:ring-blue-200"
            />
            <input
              type="date"
              name="closingDate"
              value={form.closingDate}
              onChange={handleChange}
              className="w-full p-2 border rounded-md focus:ring focus:ring-blue-200"
            />
          </div>

          <textarea
            name="description"
            placeholder="A few words about this deal"
            value={form.description}
            onChange={handleChange}
            className="w-full p-2 mt-4 border rounded-md focus:ring focus:ring-blue-200"
          />
        </div>

        {/* Additional Information */}
        <div className="mb-6">
          <h3 className="mb-4 text-lg font-medium text-gray-700">
            Additional Information
          </h3>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <input
              type="number"
              name="projectValue"
              placeholder="Project Value (₹)"
              value={form.projectValue}
              onChange={handleChange}
              className="w-full p-2 border rounded-md focus:ring focus:ring-blue-200"
            />
            <input
              type="number"
              name="advancePayment"
              placeholder="Advance Payment (₹)"
              value={form.advancePayment}
              onChange={handleChange}
              className="w-full p-2 border rounded-md focus:ring focus:ring-blue-200"
            />
            <input
              type="number"
              name="expense"
              placeholder="Expense (₹)"
              value={form.expense}
              onChange={handleChange}
              className="w-full p-2 border rounded-md focus:ring focus:ring-blue-200"
            />
          </div>
        </div>

        {/* Buttons */}
        <div className="flex justify-end gap-3">
          {/* Cancel Button */}
          <button
            className="px-4 py-2 text-gray-700 border rounded-md hover:bg-gray-100"
            onClick={() => router.push("/crm/pipelines")} // 👈 go back to CRM pipeline
          >
            Cancel
          </button>

          {/* Save Button */}
          <button
            className="px-4 py-2 text-white bg-green-600 rounded-md hover:bg-green-700"
            onClick={() => {
              // TODO: handle API save before navigation
              router.push("/crm/pipelines");
            }}
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
}
