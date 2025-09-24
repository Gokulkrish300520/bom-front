"use client";
import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

export default function CreateDealPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const stageFromQuery = searchParams.get("stage") || "";

  const [form, setForm] = useState({
    dealName: "",
    companyName: "",
    contactName: "",
    stage: stageFromQuery,
    amount: "",
    closingDate: "",
    description: "",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setForm({ ...form, [name]: value });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const savedDeals = JSON.parse(localStorage.getItem("deals") || "[]");
    savedDeals.push(form);
    localStorage.setItem("deals", JSON.stringify(savedDeals));
    alert("Deal created successfully!");
    router.push("/crm/pipelines");
  };

  return (
    <div className="max-w-md p-6 mx-auto mt-10 bg-white rounded shadow">
      <h1 className="mb-4 text-xl font-semibold">Create Deal</h1>
      <form onSubmit={handleSubmit} className="space-y-3">
        <input
          type="text"
          name="dealName"
          placeholder="Deal Name"
          value={form.dealName}
          onChange={handleChange}
          required
          className="w-full p-2 border rounded"
        />
        <input
          type="text"
          name="companyName"
          placeholder="Company Name"
          value={form.companyName}
          onChange={handleChange}
          required
          className="w-full p-2 border rounded"
        />
        <input
          type="text"
          name="contactName"
          placeholder="Contact Name"
          value={form.contactName}
          onChange={handleChange}
          required
          className="w-full p-2 border rounded"
        />
        <select
          name="stage"
          value={form.stage}
          onChange={handleChange}
          required
          className="w-full p-2 border rounded"
        >
          <option value="">Select Stage</option>
          <option value="Qualification">Qualification</option>
          <option value="Needs Analysis">Needs Analysis</option>
          <option value="Proposal/Price Quote">Proposal/Price Quote</option>
          <option value="Negotiation/Review">Negotiation/Review</option>
          <option value="Closed Won">Closed Won</option>
          <option value="Closed Lost">Closed Lost</option>
        </select>
        <input
          type="number"
          name="amount"
          placeholder="Amount"
          value={form.amount}
          onChange={handleChange}
          required
          className="w-full p-2 border rounded"
        />
        <input
          type="date"
          name="closingDate"
          value={form.closingDate}
          onChange={handleChange}
          className="w-full p-2 border rounded"
        />
        <textarea
          name="description"
          placeholder="Description"
          value={form.description}
          onChange={handleChange}
          className="w-full p-2 border rounded"
        />
        <button
          type="submit"
          className="w-full px-4 py-2 text-white bg-green-600 rounded hover:bg-green-700"
        >
          Create Deal
        </button>
      </form>
    </div>
  );
}