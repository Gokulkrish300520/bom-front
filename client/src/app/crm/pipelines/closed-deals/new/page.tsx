"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { v4 as uuidv4 } from "uuid";
import { ClosedDeal, teamMembers } from "../page";

// Helper type to make form state management easier with string inputs
type FormData = Omit<ClosedDeal, 'id' | 'date' | 'order_value' | 'advance_payment' | 'expense' | 'profit' | 'balance_due'> & {
    order_value: string;
    advance_payment: string;
    expense: string;
};

export default function NewClosedDealPage() {
  const router = useRouter();
  const [formData, setFormData] = useState<FormData>({
    department: "",
    company_name: "",
    contact: "",
    state: "",
    deadline: "",
    description: "",
    fileName: "",
    source: "",
    customer_notes: "",
    subdeal: "",
    reason: "",
    order_value: "",
    advance_payment: "",
    expense: "",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    setFormData(prev => ({ ...prev, fileName: file?.name || "" }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const orderValueNum = parseFloat(formData.order_value) || 0;
    const advancePaymentNum = parseFloat(formData.advance_payment) || 0;
    const expenseNum = parseFloat(formData.expense) || 0;

    const profit = orderValueNum - expenseNum;
    const balance_due = orderValueNum - advancePaymentNum;

    const newItem: ClosedDeal = {
      ...formData,
      id: uuidv4(),
      date: new Date().toISOString(),
      order_value: orderValueNum,
      advance_payment: advancePaymentNum,
      expense: expenseNum,
      profit,
      balance_due,
    };

    const storedData = localStorage.getItem("closedDealsData") || "[]";
    const data: ClosedDeal[] = JSON.parse(storedData);
    data.push(newItem);
    localStorage.setItem("closedDealsData", JSON.stringify(data));

    router.push("/crm/pipelines/closed-deals");
  };

  return (
    <div className="min-h-screen p-8 bg-white">
      <h1 className="mb-6 text-2xl font-bold text-green-700">Add New Closed Deal</h1>
      <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-6 p-6 rounded shadow md:grid-cols-3 bg-green-50">
        {/* Basic Info */}
        <div className="md:col-span-3"> <h2 className="text-lg font-semibold text-green-800 border-b pb-2">Deal Information</h2> </div>
        <div>
          <label className="block font-medium text-green-800">Company Name <span className="text-red-500">*</span></label>
          <input type="text" name="company_name" value={formData.company_name} onChange={handleChange} required className="w-full p-2 border rounded" />
        </div>
        <div>
          <label className="block font-medium text-green-800">Subdeal (Team Member) <span className="text-red-500">*</span></label>
          <input list="teamMembers" name="subdeal" value={formData.subdeal} onChange={handleChange} required className="w-full p-2 border rounded" />
          <datalist id="teamMembers">
            {teamMembers.map(m => <option key={m} value={m} />)}
          </datalist>
        </div>
        <div>
          <label className="block font-medium text-green-800">Deadline <span className="text-red-500">*</span></label>
          <input type="date" name="deadline" value={formData.deadline} onChange={handleChange} required className="w-full p-2 border rounded" />
        </div>
        
        {/* Financials */}
        <div className="md:col-span-3 mt-4"> <h2 className="text-lg font-semibold text-green-800 border-b pb-2">Financials</h2> </div>
        <div>
          <label className="block font-medium text-green-800">Order Value (INR) <span className="text-red-500">*</span></label>
          <input type="number" name="order_value" value={formData.order_value} onChange={handleChange} required className="w-full p-2 border rounded" placeholder="e.g., 50000" />
        </div>
        <div>
          <label className="block font-medium text-green-800">Advance Payment (INR)</label>
          <input type="number" name="advance_payment" value={formData.advance_payment} onChange={handleChange} className="w-full p-2 border rounded" placeholder="e.g., 10000" />
        </div>
        <div>
          <label className="block font-medium text-green-800">Expense (INR)</label>
          <input type="number" name="expense" value={formData.expense} onChange={handleChange} className="w-full p-2 border rounded" placeholder="e.g., 5000" />
        </div>

        {/* Other Details */}
        <div className="md:col-span-3 mt-4"> <h2 className="text-lg font-semibold text-green-800 border-b pb-2">Additional Details</h2> </div>
         <div className="md:col-span-3">
          <label className="block font-medium text-green-800">Reason for Closing</label>
          <textarea name="reason" value={formData.reason} onChange={handleChange} rows={2} className="w-full p-2 border rounded"></textarea>
        </div>
        <div className="md:col-span-3">
          <label className="block font-medium text-green-800">Customer Notes</label>
          <textarea name="customer_notes" value={formData.customer_notes} onChange={handleChange} rows={2} className="w-full p-2 border rounded"></textarea>
        </div>
        <div className="md:col-span-3">
            <label className="block font-medium text-green-800">File Upload</label>
            <input type="file" onChange={handleFileChange} className="w-full p-2 border rounded bg-white" />
        </div>

        <div className="flex justify-end col-span-3 gap-4 mt-4">
          <button type="button" onClick={() => router.push('/crm/pipelines/closed-deals')} className="px-4 py-2 border rounded bg-gray-200 hover:bg-gray-300">Cancel</button>
          <button type="submit" className="px-4 py-2 text-white bg-green-600 rounded hover:bg-green-700">Save</button>
        </div>
      </form>
    </div>
  );
}