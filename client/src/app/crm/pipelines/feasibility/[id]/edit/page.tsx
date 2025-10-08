"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { format } from "date-fns";
import type { Feasibility } from "../../page";

export default function EditFeasibilityPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;
  const [formData, setFormData] = useState<Feasibility | null>(null);
  const [dialogState, setDialogState] = useState({
    isOpen: false,
    mode: 'none' as 'confirm_update' | 'none',
    message: '',
    title: '',
  });

  useEffect(() => {
    if (id) {
      const storedData = localStorage.getItem("feasibilityData") || "[]";
      const data: Feasibility[] = JSON.parse(storedData);
      const itemToEdit = data.find((item) => item.id === id);
      if (itemToEdit) setFormData(itemToEdit);
    }
  }, [id]);

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement | HTMLSelectElement>) => {
    if (!formData) return;
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const proceedWithUpdate = () => {
    if (!formData) return;
    const storedData = localStorage.getItem("feasibilityData") || "[]";
    const data: Feasibility[] = JSON.parse(storedData);
    const updatedData = data.map((item) => (item.id === id ? formData : item));
    localStorage.setItem("feasibilityData", JSON.stringify(updatedData));
    
    closeDialog();
    router.push("/crm/pipelines/feasibility");
  };
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData) return;

    if (formData.customer_notes.trim() === "") {
      setDialogState({
        isOpen: true,
        mode: 'confirm_update',
        title: 'Confirm Update',
        message: 'You have not added any customer notes. Do you want to update anyway?'
      });
    } else {
      proceedWithUpdate();
    }
  };

  const closeDialog = () => {
    setDialogState({ isOpen: false, mode: 'none', message: '', title: '' });
  };

  const Dialog = () => {
    if (!dialogState.isOpen) return null;
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60">
        <div className="w-full max-w-md p-6 m-4 bg-white rounded-lg shadow-xl">
          <h2 className="text-xl font-bold text-gray-800">{dialogState.title}</h2>
          <p className="mt-3 text-gray-600">{dialogState.message}</p>
          <div className="flex justify-end mt-6 space-x-4">
            <button onClick={closeDialog} className="px-5 py-2 font-semibold text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300">
              Go Back
            </button>
            <button onClick={proceedWithUpdate} className="px-5 py-2 font-semibold text-white bg-green-600 rounded-md hover:bg-green-700">
              Update Anyway
            </button>
          </div>
        </div>
      </div>
    );
  };

  if (!formData) return <div className="p-8">Loading...</div>;

  return (
    <div className="min-h-screen p-4 sm:p-8 bg-gray-50">
      <div className="max-w-4xl mx-auto">
        <header className="mb-6">
            <h1 className="text-3xl font-bold text-green-700">Edit Feasibility Check</h1>
            <p className="text-gray-500 mt-1">Updating details for: <span className="font-semibold text-gray-700">{formData.company_name}</span></p>
        </header>
        
        <form onSubmit={handleSubmit} className="p-8 space-y-8 bg-white border rounded-lg shadow-sm">
          
          {/* Read-only fields for context */}
          <fieldset className="grid grid-cols-1 gap-5 md:grid-cols-2">
            <h2 className="text-lg font-semibold text-gray-600 md:col-span-2 border-b pb-2">Original RFQ Info (Read-only)</h2>
            <div>
              <label className="block text-sm font-medium text-gray-500">Company Name</label>
              {/* FIXED: Added readOnly prop to resolve console error */}
              <input type="text" value={formData.company_name} readOnly className="w-full p-2 mt-1 bg-gray-100 border-gray-200 rounded cursor-not-allowed" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-500">Department</label>
              <input type="text" value={formData.department} readOnly className="w-full p-2 mt-1 bg-gray-100 border-gray-200 rounded cursor-not-allowed" />
            </div>
            {/* ADDED: Display other original data for context */}
            <div>
              <label className="block text-sm font-medium text-gray-500">Contact</label>
              <input type="text" value={formData.contact} readOnly className="w-full p-2 mt-1 bg-gray-100 border-gray-200 rounded cursor-not-allowed" />
            </div>
             <div>
              <label className="block text-sm font-medium text-gray-500">Deadline</label>
              <input type="text" value={format(new Date(formData.deadline), 'dd MMMM, yyyy')} readOnly className="w-full p-2 mt-1 bg-gray-100 border-gray-200 rounded cursor-not-allowed" />
            </div>
             <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-500">Description</label>
              <textarea value={formData.description} readOnly rows={3} className="w-full p-2 mt-1 bg-gray-100 border-gray-200 rounded cursor-not-allowed"></textarea>
            </div>
          </fieldset>
          
          {/* Editable fields */}
          <div className="space-y-6 pt-6 border-t">
             <h2 className="text-lg font-semibold text-green-800">Feasibility Assessment (Editable)</h2>
             <div>
               <label htmlFor="customer_notes" className="block font-medium text-green-800">Customer Notes <span className="text-gray-400 font-normal">(Required for Acceptance)</span></label>
               <textarea 
                  id="customer_notes"
                  name="customer_notes" 
                  value={formData.customer_notes} 
                  onChange={handleChange} 
                  rows={4} 
                  className="w-full p-2 mt-1 border-gray-300 rounded focus:ring-2 focus:ring-green-500"
                  placeholder="Add technical notes, feasibility status, comments, etc."
                />
             </div>
             <div>
                <label htmlFor="subdeal" className="block font-medium text-green-800">Sub-deal / Alternate Solution</label>
                <select 
                    id="subdeal"
                    name="subdeal" 
                    value={formData.subdeal} 
                    onChange={handleChange} 
                    className="w-full p-2 mt-1 bg-white border-gray-300 rounded focus:ring-2 focus:ring-green-500"
                >
                    <option value="No">No</option>
                    <option value="Yes">Yes</option>
                </select>
             </div>
          </div>

          <div className="flex justify-end col-span-2 gap-4 pt-6 mt-4 border-t">
            <button type="button" onClick={() => router.push('/crm/pipelines/feasibility')} className="px-6 py-2 font-semibold border rounded bg-gray-100 hover:bg-gray-200">Cancel</button>
            <button type="submit" className="px-6 py-2 font-semibold text-white bg-green-600 rounded hover:bg-green-700">Update Feasibility</button>
          </div>
        </form>
      </div>
      <Dialog />
    </div>
  );
}