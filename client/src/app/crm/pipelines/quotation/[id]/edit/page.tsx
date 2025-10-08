"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { v4 as uuidv4 } from "uuid";

// --- 1. Updated Type Definitions ---

// A Subdeal represents a handover to a specific department
export type Subdeal = {
  id: string;
  department: string;
  notes: string;
};

// The Quotation type now includes an array of Subdeals
export type Quotation = {
  id: string;
  date: string;
  department: string; // The original department
  company_name: string;
  contact: string;
  state: string;
  deadline: string;
  description: string;
  fileName?: string;
  source: string;
  priority: "High" | "Medium" | "Low";
  customer_notes: string;
  // MODIFIED: from 'subdeal: string' to 'subdeals: Subdeal[]'
  subdeals: Subdeal[];
};

export default function EditQuotationPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;
  const [formData, setFormData] = useState<Quotation | null>(null);

  // --- 2. State for Managing New Subdeals ---
  const [isAddingSubdeal, setIsAddingSubdeal] = useState(false);
  const [newSubdeal, setNewSubdeal] = useState({ department: "", notes: "" });

  useEffect(() => {
    if (id) {
      const storedData = localStorage.getItem("quotationData") || "[]";
      const data: Quotation[] = JSON.parse(storedData);
      const itemToEdit = data.find((item) => item.id === id);
      if (itemToEdit) {
        // This ensures backward compatibility for old data that doesn't have the 'subdeals' array
        if (!Array.isArray(itemToEdit.subdeals)) {
            itemToEdit.subdeals = [];
        }
        setFormData(itemToEdit);
      }
    }
  }, [id]);

  // --- 3. Handlers for Subdeal Management ---
  const handleAddSubdeal = () => {
    if (!formData) return;

    if (newSubdeal.department.trim() === "") {
        alert("Department is required to add a subdeal.");
        return;
    }

    const subdealToAdd: Subdeal = {
        id: uuidv4(),
        department: newSubdeal.department,
        notes: newSubdeal.notes,
    };

    setFormData({
        ...formData,
        subdeals: [...formData.subdeals, subdealToAdd],
    });

    // Reset form and hide it
    setNewSubdeal({ department: "", notes: "" });
    setIsAddingSubdeal(false);
  };
  
  const handleRemoveSubdeal = (subdealIdToRemove: string) => {
    if (!formData) return;
    setFormData({
        ...formData,
        subdeals: formData.subdeals.filter(sub => sub.id !== subdealIdToRemove),
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData) return;

    const storedData = localStorage.getItem("quotationData") || "[]";
    const data: Quotation[] = JSON.parse(storedData);
    const updatedData = data.map((item) => (item.id === id ? formData : item));
    localStorage.setItem("quotationData", JSON.stringify(updatedData));
    
    router.push("/crm/pipelines/quotation");
  };

  if (!formData) return <div className="p-8">Loading...</div>;

  const departmentOptions = ["Fab", "EMS", "Component", "R&D", "Sales", "Marketing"];

  return (
    <div className="min-h-screen p-4 sm:p-8 bg-gray-50">
      <div className="max-w-4xl mx-auto">
        <header className="mb-6">
            <h1 className="text-3xl font-bold text-green-700">Edit Quotation</h1>
            <p className="text-gray-500 mt-1">Managing subdeals for: <span className="font-semibold text-gray-700">{formData.company_name}</span></p>
        </header>

        <form onSubmit={handleSubmit} className="space-y-8">
            {/* Read-only Original Info */}
            <fieldset className="p-6 bg-white border rounded-lg shadow-sm">
                <legend className="text-lg font-semibold text-gray-600">Original Quotation Details</legend>
                <div className="grid grid-cols-1 gap-5 mt-4 md:grid-cols-2">
                    <div>
                        <label className="block text-sm font-medium text-gray-500">Company Name</label>
                        <input type="text" value={formData.company_name} readOnly className="w-full p-2 mt-1 bg-gray-100 border-gray-200 rounded"/>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-500">Original Department</label>
                        <input type="text" value={formData.department} readOnly className="w-full p-2 mt-1 bg-gray-100 border-gray-200 rounded"/>
                    </div>
                </div>
            </fieldset>

            {/* --- 4. Subdeal Management UI --- */}
            <div className="p-6 bg-white border rounded-lg shadow-sm">
                <h2 className="text-lg font-semibold text-green-800">Subdeals / Department Handover</h2>
                
                {/* List of Existing Subdeals */}
                <div className="mt-4 space-y-3">
                    {formData.subdeals.length === 0 ? (
                        <p className="text-gray-500">No subdeals have been created yet.</p>
                    ) : (
                        formData.subdeals.map(subdeal => (
                            <div key={subdeal.id} className="flex items-start justify-between gap-4 p-3 border rounded bg-green-50">
                                <div>
                                    <p className="font-semibold text-green-900">{subdeal.department}</p>
                                    <p className="text-sm text-gray-600">{subdeal.notes || "No notes."}</p>
                                </div>
                                <button type="button" onClick={() => handleRemoveSubdeal(subdeal.id)} className="px-2 py-1 text-xs font-semibold text-red-700 bg-red-100 rounded hover:bg-red-200">Remove</button>
                            </div>
                        ))
                    )}
                </div>

                {/* Button to show the 'Add Subdeal' form */}
                {!isAddingSubdeal && (
                    <div className="pt-4 mt-4 border-t">
                        <button type="button" onClick={() => setIsAddingSubdeal(true)} className="px-4 py-2 font-semibold text-white bg-green-600 rounded hover:bg-green-700">
                           + Add New Subdeal
                        </button>
                    </div>
                )}
                
                {/* Form to Add a New Subdeal */}
                {isAddingSubdeal && (
                    <div className="p-4 mt-4 border-t border-green-200">
                        <h3 className="font-semibold text-gray-700">New Subdeal Details</h3>
                        <div className="mt-2 space-y-4">
                            <div>
                                <label className="block text-sm font-medium">Department <span className="text-red-500">*</span></label>
                                <input 
                                    list="departments"
                                    value={newSubdeal.department}
                                    onChange={(e) => setNewSubdeal({ ...newSubdeal, department: e.target.value })}
                                    placeholder="Type or select a department"
                                    className="w-full p-2 mt-1 border rounded"
                                />
                                <datalist id="departments">
                                    {departmentOptions.map(dep => <option key={dep} value={dep} />)}
                                </datalist>
                            </div>
                            <div>
                                <label className="block text-sm font-medium">Notes</label>
                                <textarea 
                                    value={newSubdeal.notes}
                                    onChange={(e) => setNewSubdeal({ ...newSubdeal, notes: e.target.value })}
                                    rows={2} 
                                    className="w-full p-2 mt-1 border rounded"
                                    placeholder="Add any relevant notes for this department."
                                />
                            </div>
                            <div className="flex gap-4">
                                <button type="button" onClick={handleAddSubdeal} className="px-4 py-2 text-sm font-semibold text-white bg-green-500 rounded hover:bg-green-600">Save Subdeal</button>
                                <button type="button" onClick={() => setIsAddingSubdeal(false)} className="px-4 py-2 text-sm font-semibold text-gray-700 bg-gray-100 rounded hover:bg-gray-200">Cancel</button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
            
            {/* Main Form Actions */}
            <div className="flex justify-end gap-4 pt-6 mt-4 border-t">
                <button type="button" onClick={() => router.push('/crm/pipelines/quotation')} className="px-6 py-2 font-semibold border rounded bg-gray-100 hover:bg-gray-200">Cancel</button>
                <button type="submit" className="px-6 py-2 font-semibold text-white bg-green-600 rounded hover:bg-green-700">Update Quotation</button>
            </div>
        </form>
      </div>
    </div>
  );
}