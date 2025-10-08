"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { v4 as uuidv4 } from "uuid";
import { PreprocessItem, WorkingTimeline, teamMembers, departments, expenseOptions } from "../page";
import { Trash2 } from "lucide-react";
type FormData = Omit<PreprocessItem, 'id' | 'date'>;

export default function NewPreprocessPage() {
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
    order_value: 0,
    advance_payment: 0,
    expense: 0,
    profit: 0,
    balance_due: 0,
    subdeal: "",
    project_handled_by: "",
    working_timeline: [],
    project_timeline: [],
    expense_bill_format: "",
    approval_status: "Modification",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    const isNumber = type === 'number';
    setFormData(prev => ({ ...prev, [name]: isNumber ? parseFloat(value) || 0 : value }));
  };

  const handleTimelineChange = (index: number, field: keyof WorkingTimeline, value: string | number) => {
    const updatedTimeline = [...formData.working_timeline];
    (updatedTimeline[index] as any)[field] = value;
    setFormData(prev => ({ ...prev, working_timeline: updatedTimeline }));
  };

const addTimelineRow = () => {
    const newRow: WorkingTimeline = { 
      s_no: formData.working_timeline.length + 1, 
      description: '', 
      deadline: '',
      status: 'Over Due',  // <-- Add default value
      approved: 'Rework' // <-- Add default value
    };
    setFormData(prev => ({ ...prev, working_timeline: [...prev.working_timeline, newRow] }));
  };
  
  const removeTimelineRow = (index: number) => {
    setFormData(prev => ({ ...prev, working_timeline: prev.working_timeline.filter((_, i) => i !== index) }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const profit = formData.order_value - formData.expense;
    const balance_due = formData.order_value - formData.advance_payment;

    const newItem: PreprocessItem = {
      ...formData,
      id: uuidv4(),
      date: new Date().toISOString(),
      profit,
      balance_due,
    };

    const storedData = localStorage.getItem("preprocessData") || "[]";
    const data: PreprocessItem[] = JSON.parse(storedData);
    data.push(newItem);
    localStorage.setItem("preprocessData", JSON.stringify(data));

    router.push("/crm/pipelines/preprocess");
  };

  return (
    <div className="min-h-screen p-8 bg-white">
      <h1 className="mb-6 text-2xl font-bold text-green-700">Add New Preprocess Item</h1>
      <form onSubmit={handleSubmit} className="space-y-8 p-6 rounded shadow bg-green-50">
        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          <div>
            <label className="block font-medium text-green-800">Company Name <span className="text-red-500">*</span></label>
            <input type="text" name="company_name" value={formData.company_name} onChange={handleChange} required className="w-full p-2 border rounded" />
          </div>
          <div>
            <label className="block font-medium text-green-800">Project Handled By <span className="text-red-500">*</span></label>
            <input list="teamMembers" name="project_handled_by" value={formData.project_handled_by} onChange={handleChange} required className="w-full p-2 border rounded" />
            <datalist id="teamMembers">
              {teamMembers.map((m: string) => <option key={m} value={m} />)}
            </datalist>
          </div>
           <div>
            <label className="block font-medium text-green-800">Deadline <span className="text-red-500">*</span></label>
            <input type="date" name="deadline" value={formData.deadline} onChange={handleChange} required className="w-full p-2 border rounded" />
          </div>
        </div>
        
        <div>
  <h2 className="text-lg font-semibold text-green-800 border-b pb-2 mb-4">
    Working Timeline
  </h2>

  {formData.working_timeline.map((row, index) => (
    <div
      key={index}
      className="flex flex-wrap items-center gap-2 mb-2 p-2 border rounded bg-white"
    >
      <input
        type="number"
        placeholder="S.No"
        value={row.s_no}
        onChange={(e) =>
          handleTimelineChange(index, "s_no", parseInt(e.target.value) || 0)
        }
        className="p-2 border rounded w-20"
      />

      <input
        type="text"
        placeholder="Description"
        value={row.description}
        onChange={(e) =>
          handleTimelineChange(index, "description", e.target.value)
        }
        className="p-2 border rounded flex-1 min-w-[200px]"
      />

      <input
        type="date"
        value={row.deadline}
        onChange={(e) => handleTimelineChange(index, "deadline", e.target.value)}
        className="p-2 border rounded w-40"
      />

      <select
        value={row.status}
        onChange={(e) => handleTimelineChange(index, "status", e.target.value)}
        className="p-2 border rounded w-32"
      >
        <option>Over Due</option>
        <option>Completed</option>
      </select>

      <select
        value={row.approved}
        onChange={(e) =>
          handleTimelineChange(index, "approved", e.target.value)
        }
        className="p-2 border rounded w-28"
      >
        <option>Rework</option>
        <option>Yes</option>
      </select>

      <button
        type="button"
        onClick={() => removeTimelineRow(index)}
        className="p-2 text-white bg-red-500 rounded hover:bg-red-600"
      >
        <Trash2 size={16} />
      </button>
    </div>
  ))}

  <button
    type="button"
    onClick={addTimelineRow}
    className="mt-2 px-4 py-2 text-sm text-white bg-green-600 rounded hover:bg-green-700"
  >
    Add Working Row
  </button>
</div>
        
         {/* Financials Section */}
        <div className="grid grid-cols-1 gap-6 pt-4 border-t md:grid-cols-3">
            <div>
                <label className="block font-medium text-green-800">Order Value (INR)</label>
                <input type="number" name="order_value" value={formData.order_value} onChange={handleChange} className="w-full p-2 border rounded" />
            </div>
             <div>
                <label className="block font-medium text-green-800">Advance Payment (INR)</label>
                <input type="number" name="advance_payment" value={formData.advance_payment} onChange={handleChange} className="w-full p-2 border rounded" />
            </div>
             <div>
                <label className="block font-medium text-green-800">Expense (INR)</label>
                <input type="number" name="expense" value={formData.expense} onChange={handleChange} className="w-full p-2 border rounded" />
            </div>
        </div>

        <div className="flex justify-end gap-4 mt-8">
          <button type="button" onClick={() => router.push('/crm/pipelines/preprocess')} className="px-4 py-2 border rounded bg-gray-200 hover:bg-gray-300">Cancel</button>
          <button type="submit" className="px-4 py-2 text-white bg-green-600 rounded hover:bg-green-700">Save Preprocess</button>
        </div>
      </form>
    </div>
  );
}